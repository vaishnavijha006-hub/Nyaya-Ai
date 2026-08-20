import logging

logger = logging.getLogger(__name__)

class DocumentSearch:
    def __init__(self):
        pass

    async def search(self, query: str):
        logger.info(f"Searching docs for {query}")
        return {"status": "searched", "results": []}
