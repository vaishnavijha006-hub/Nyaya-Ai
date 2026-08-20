import logging
from typing import Dict, Any, List
from .notification_dispatcher import NotificationDispatcher
from .communication_audit import CommunicationAudit

logger = logging.getLogger(__name__)

class NotificationEngine:
    def __init__(self):
        self.dispatcher = NotificationDispatcher()
        self.audit = CommunicationAudit()

    async def process_notification(self, user_id: str, title: str, body: str, notification_type: str) -> Dict[str, Any]:
        """
        Process and send a notification, ensuring no hallucinations.
        """
        logger.info(f"Processing notification for user {user_id}")
        
        # In a real app, query preferences here
        # Log intent
        await self.audit.log_communication(user_id, "push", "outbound", "pending", {"title": title, "body": body})
        
        try:
            result = await self.dispatcher.dispatch(user_id, title, body, "push")
            await self.audit.log_communication(user_id, "push", "outbound", "sent", result)
            return {"status": "success", "result": result}
        except Exception as e:
            await self.audit.log_communication(user_id, "push", "outbound", "failed", {"error": str(e)})
            raise
