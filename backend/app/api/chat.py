import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.llm import ask_llm

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        logger.info(f"Received chat request: {request.question}")
        answer = ask_llm(request.question)
        return ChatResponse(answer=answer)
    except Exception as exc:
        logger.error(f"Error in chat endpoint: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))