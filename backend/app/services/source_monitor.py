class SourceMonitorEngine:
    def __init__(self, db_session):
        self.db = db_session

    def check_for_updates(self, source_url):
        # Periodically checks for updates to legal sources
        pass
        
    def start_ingestion_job(self, source_url):
        # Kicks off legal_ingestion pipeline
        pass
