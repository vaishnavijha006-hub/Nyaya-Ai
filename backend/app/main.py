from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.api.llm import router as llm_router
from app.api.research import router as research_router
from app.api.rti import router as rti_router
from app.api.legal_notice import router as legal_notice_router
from app.api.speech import router as speech_router
from app.api.tts import router as tts_router

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
app.include_router(rti_router)
app.include_router(legal_notice_router)
app.include_router(speech_router)
app.include_router(tts_router)

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
