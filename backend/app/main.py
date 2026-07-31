import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.utils.security import validate_environment
from app.api.chat import router as chat_router
from app.api.llm import router as llm_router
from app.api.research import router as research_router
from app.api.rti import router as rti_router
from app.api.legal_notice import router as legal_notice_router
from app.api.speech import router as speech_router
from app.api.tts import router as tts_router
from app.api.voice import router as voice_router
from app.api.admin import router as admin_router

# Initialize Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Nyaya AI API",
    version="1.0.0",
    description="AI-powered Legal Information Assistant"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Validate environment fast on startup
validate_environment()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if os.getenv("ALLOWED_ORIGINS"):
    origins.extend([o.strip() for o in os.getenv("ALLOWED_ORIGINS").split(",") if o.strip()])

# Configure CORSMiddleware before registering any routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.ngrok-free\.(app|dev)|https://.*\.loca\.lt",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers after CORSMiddleware
app.include_router(chat_router)
app.include_router(llm_router)
app.include_router(research_router)
app.include_router(rti_router)
app.include_router(legal_notice_router)
app.include_router(speech_router)
app.include_router(tts_router)
app.include_router(voice_router)
app.include_router(admin_router)


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
