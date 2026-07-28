from fastapi import APIRouter
from pydantic import BaseModel

from app.services.llm import ask_llm_rag
from app.rag.pipeline import ask_rag

router = APIRouter(prefix="/llm", tags=["llm"])

class RagRequest(BaseModel):
    question: str

@router.post("/rag")
def rag_chat(request: RagRequest):
    """
    RAG-grounded LLM endpoint.
    """
    return ask_rag(request.question)