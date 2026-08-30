import asyncio
from typing import Dict, Any

def analyze_safety(query: str) -> Dict[str, Any]:
    emergency_keywords = ["suicide", "emergency", "in danger", "kill myself", "life threat"]
    if any(kw in query.lower() for kw in emergency_keywords):
        return {"requires_emergency_mode": True, "risk_level": "EMERGENCY"}
    return {"requires_emergency_mode": False, "risk_level": "NORMAL"}

class SafetyService:
    def __init__(self, redis_client=None, pg_client=None, rag_client=None, sms_client=None):
        self.redis = redis_client
        self.pg = pg_client
        self.rag = rag_client
        self.sms = sms_client

    async def process_query(self, query: str) -> Dict[str, Any]:
        is_emergency = await self._is_emergency_query(query)
        
        if is_emergency:
            result = await self._handle_emergency()
            return result
        
        # Non-emergency flow
        if self.redis:
            await self.redis.get("cache")
        if self.pg:
            await self.pg.execute("SELECT 1")
        if self.rag:
            await self.rag.search(query)
            
        return {"status": "NORMAL"}
        
    async def _is_emergency_query(self, query: str) -> bool:
        emergency_keywords = ["suicide", "emergency", "in danger", "kill myself", "life threat"]
        return any(kw in query.lower() for kw in emergency_keywords)
        
    async def _handle_emergency(self) -> Dict[str, Any]:
        sms_sent = False
        status_msg = "SMS action failed"
        
        if self.sms:
            try:
                # Expect sms client to raise asyncio.TimeoutError if timed out
                # or we wrap it in wait_for
                await asyncio.wait_for(self.sms.send_alert(), timeout=2.0)
                sms_sent = True
                status_msg = "SMS sent successfully"
            except (asyncio.TimeoutError, Exception) as e:
                sms_sent = False
                status_msg = "SMS action timed out or failed"
            
        return {
            "status": "EMERGENCY_INTERVENTION_REQUIRED",
            "sms_sent": sms_sent,
            "message": status_msg
        }
