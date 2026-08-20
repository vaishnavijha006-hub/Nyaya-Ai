import psycopg2
import os
import time

for _ in range(30):
    try:
        conn = psycopg2.connect(
            dbname='postgres',
            user='postgres',
            password='postgres',
            host='127.0.0.1',
            port='5432'
        )
        break
    except Exception as e:
        time.sleep(1)
else:
    raise Exception("Could not connect to database")

conn.autocommit = True
cur = conn.cursor()

# Reset schema
cur.execute("DROP SCHEMA public CASCADE;")
cur.execute("CREATE SCHEMA public;")
cur.execute("GRANT ALL ON SCHEMA public TO postgres;")
cur.execute("GRANT ALL ON SCHEMA public TO public;")

# Mock roles
cur.execute("""
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
END
$$;
""")

# Mock functions
cur.execute("""
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.role', true), '');
$$ LANGUAGE sql STABLE;
""")

# Run migrations
with open('supabase/migrations/20260815000001_initial_schema.sql', 'r', encoding='utf-8') as f:
    cur.execute(f.read())

with open('supabase/migrations/20260815000002_strict_rls_policies.sql', 'r', encoding='utf-8') as f:
    cur.execute(f.read())

print('Schema and mocks set up successfully.')
