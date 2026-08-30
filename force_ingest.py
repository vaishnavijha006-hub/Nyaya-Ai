import sys
sys.path.append('backend')
from backend.ingest import run_ingestion
run_ingestion(force_reindex=True)
