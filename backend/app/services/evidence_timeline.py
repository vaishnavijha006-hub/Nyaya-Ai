import logging

logger = logging.getLogger(__name__)

class EvidenceTimeline:
    def __init__(self):
        pass

    async def build_timeline(self, case_id: str):
        logger.info(f"Building timeline for case {case_id}")
        return {"status": "built", "timeline": []}
