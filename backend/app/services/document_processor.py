import logging

logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self):
        pass

    async def process_file(self, file_path: str):
        logger.info(f"Processing document {file_path}")
        return {"status": "processed"}
