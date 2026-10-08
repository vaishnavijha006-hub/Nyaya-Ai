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

from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

app = FastAPI(
    title="Nyaya AI API",
    version="1.0.0",
    description="AI-powered Legal Information Assistant"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status": exc.status_code,
            "detail": exc.detail,
        },
        headers=getattr(exc, "headers", None)
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": True,
            "status": 422,
            "detail": exc.errors(),
        }
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    import logging
    logging.getLogger("app.main").error(f"[Unhandled Error] {type(exc).__name__}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "status": 500,
            "detail": "Internal Server Error",
        }
    )

# Validate environment fast on startup
validate_environment()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GUARD Middleware
app.add_middleware(GuardMiddleware)

# Register routers after CORSMiddleware
from app.api.collective_actions import router as collective_actions_router
from app.api.legal_aid import router as legal_aid_router
from app.api.lawyers import router as lawyers_router
from app.api.legal_journey import router as legal_journey_router
from app.api.cases import router as cases_router
from app.api.court_data import router as court_data_router

app.include_router(chat_router)
app.include_router(llm_router)
app.include_router(research_router)
app.include_router(rti_router)
app.include_router(collective_actions_router)
app.include_router(legal_aid_router)
app.include_router(lawyers_router)
app.include_router(legal_journey_router)
app.include_router(cases_router)
app.include_router(court_data_router)
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
