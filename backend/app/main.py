import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .utils.security import validate_environment
from .api.chat import router as chat_router
from .api.llm import router as llm_router
from .api.research import router as research_router
from .api.rti import router as rti_router
from .api.legal_notice import router as legal_notice_router
from .api.fir import router as fir_router
from .api.speech import router as speech_router
from .api.tts import router as tts_router
from .api.voice import router as voice_router
from .api.admin import router as admin_router
from .api.pdf_upload import router as pdf_upload_router
from .api.contract import router as contract_router
from .api.emergency import router as emergency_router
from .api.case_progress import router as case_progress_router
from .api.prevention import router as prevention_router
from .api.audits import router as audits_router
from .api.guard import router as guard_router
from .middleware.guard import GuardMiddleware

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

# Configure CORSMiddleware - allow_origin_regex covers ALL origins including localhost
# Using regex only to avoid Starlette conflict between allow_origins and allow_origin_regex
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GUARD Middleware
app.add_middleware(GuardMiddleware)

# Register routers after CORSMiddleware
app.include_router(chat_router)
app.include_router(llm_router)
app.include_router(research_router)
app.include_router(rti_router)
app.include_router(legal_notice_router)
app.include_router(fir_router)
app.include_router(speech_router)
app.include_router(tts_router)
app.include_router(voice_router)
app.include_router(admin_router)
app.include_router(pdf_upload_router)
app.include_router(contract_router)
app.include_router(emergency_router)
app.include_router(case_progress_router)
app.include_router(prevention_router)
app.include_router(audits_router, prefix="/api/audits", tags=["Audits"])
app.include_router(guard_router)
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
