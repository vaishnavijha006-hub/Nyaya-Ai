from fastapi import FastAPI
from app.api.chat import router as chat_router
from app.api.llm import router as llm_router

app = FastAPI(
    title="Nyaya AI API",
    version="1.0.0",
    description="AI-powered Legal Information Assistant"
)

app.include_router(chat_router)
app.include_router(llm_router)

@app.get("/")
def root():
    return {
        "message": "Nyaya AI Backend is Running 🚀"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }