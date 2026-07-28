from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.api.llm import router as llm_router
from app.api.research import router as research_router

app = FastAPI(
    title="Nyaya AI API",
    version="1.0.0",
    description="AI-powered Legal Information Assistant"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(llm_router)
app.include_router(research_router)

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