from fastapi import APIRouter
from pydantic import BaseModel

from app.services.llm import ask_llm

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest):
    answer = ask_llm(request.question)
    return ChatResponse(answer=answer)