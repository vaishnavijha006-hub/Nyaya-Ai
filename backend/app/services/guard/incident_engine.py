import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class IncidentEngine:
    def __init__(self):
        pass

    async def report_incident(self, title: str, description: str, severity: str) -> Dict[str, Any]:
        """
        Report a new incident.
        """
        logger.error(f"Incident Reported: {title} - {severity}")
        return {
            "id": "new-incident-id",
            "title": title,
            "status": "open",
            "severity": severity
        }
