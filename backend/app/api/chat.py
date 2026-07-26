from fastapi import APIRouter
from pydantic import BaseModel

from app.api.llm import ask_llm

router = APIRouter()


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    answer = ask_llm(request.question)
    return ChatResponse(answer=answer)