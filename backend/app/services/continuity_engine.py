import logging
from .continuity_monitor import ContinuityMonitor

logger = logging.getLogger(__name__)

class ContinuityEngine:
    def __init__(self):
        self.monitor = ContinuityMonitor()

    async def check_continuity(self, session_id: str, case_info: dict) -> dict:
        """
        Main entry point for continuity evaluation in the chat pipeline.
        Acts as a monitoring layer without hallucinating facts.
        """
        logger.info(f"[ContinuityEngine] Checking continuity for session {session_id}")
        return await self.monitor.evaluate(session_id, case_info)
