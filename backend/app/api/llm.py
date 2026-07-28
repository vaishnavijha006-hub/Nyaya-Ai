import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.rag.pipeline import ask_rag

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/llm", tags=["llm"])

class RagRequest(BaseModel):
    question: str

@router.post("/rag")
def rag_chat(request: RagRequest):
    """
    RAG-grounded LLM endpoint.
    """
    try:
        logger.info(f"Received RAG request: {request.question}")
        return ask_rag(request.question)
    except Exception as exc:
        logger.error(f"Error in RAG endpoint: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))