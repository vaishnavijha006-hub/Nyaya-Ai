import pytest
import asyncio
import os

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.fixture(scope="session")
def db_connection():
    if not HAS_PSYCOPG2:
        pytest.skip("psycopg2 is not installed")
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME", "postgres"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "postgres"),
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432")
        )
        conn.autocommit = True
        
        with conn.cursor() as cur:
            cur.execute("CREATE SCHEMA IF NOT EXISTS auth")
            cur.execute("DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; END $$;")
            cur.execute("""
            CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
                SELECT coalesce(current_setting('request.jwt.claim.sub', true), '00000000-0000-0000-0000-000000000000')::uuid;
            $$ LANGUAGE SQL STABLE;
            CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
                SELECT coalesce(current_setting('request.jwt.claim.role', true), 'authenticated')::text;
            $$ LANGUAGE SQL STABLE;
            """)
            
            if os.path.exists("supabase/migrations/20260815000001_initial_schema.sql"):
                with open("supabase/migrations/20260815000001_initial_schema.sql") as f:
                    cur.execute(f.read())
            if os.path.exists("supabase/migrations/20260815000002_strict_rls_policies.sql"):
                with open("supabase/migrations/20260815000002_strict_rls_policies.sql") as f:
                    cur.execute(f.read())
                
        yield conn
        
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS privacy_access_log CASCADE")
            cur.execute("DROP TABLE IF EXISTS lawyer_assignments CASCADE")
            cur.execute("DROP TABLE IF EXISTS case_memory CASCADE")
            cur.execute("DROP TABLE IF EXISTS cases CASCADE")
            
        conn.close()
    except Exception as e:
        pytest.skip(f"Could not connect to database: {e}")

@pytest.fixture
def auth_client(db_connection):
    if not HAS_PSYCOPG2:
        pytest.skip("psycopg2 is not installed")
    class AuthClient:
        def __init__(self, conn):
            self.conn = conn
            
        def execute(self, user_id, query, params=None):
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                try:
                    # Disable autocommit so SET LOCAL persists for the query
                    self.conn.autocommit = False
                    cur.execute(f"SET LOCAL request.jwt.claim.sub = '{user_id}'")
                    cur.execute("SET LOCAL role = authenticated")
                    cur.execute(query, params or ())
                    if cur.description:
                        res = cur.fetchall()
                    else:
                        res = []
                    self.conn.commit()
                    return res
                except Exception as e:
                    self.conn.rollback()
                    raise e
                finally:
                    self.conn.autocommit = True
    return AuthClient(db_connection)

