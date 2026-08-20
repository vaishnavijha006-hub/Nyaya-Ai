from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any
from ...services.notification_engine import NotificationEngine

router = APIRouter()
engine = NotificationEngine()

class NotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str
    type: str

@router.post("/send", response_model=Dict[str, Any])
async def send_notification(request: NotificationRequest, background_tasks: BackgroundTasks):
    try:
        # Using background task for async event-driven architecture
        background_tasks.add_task(
            engine.process_notification,
            request.user_id,
            request.title,
            request.body,
            request.type
        )
        return {"status": "queued"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
