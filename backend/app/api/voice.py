"""
voice.py — Complete Multilingual Voice AI Pipeline Router.

Pipeline:
Mic Audio
↓
Whisper STT (Groq / local Whisper model)
↓
Language Detection (Lingua / Regex / Keyword)
↓
Groq LLM + RAG Pipeline (ask_rag)
↓
Piper ONNX Neural TTS Engine
↓
Audio Response Stream / Base64 WAV
"""

import os
import uuid
import logging
import base64
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.services.llm import get_groq_client
from app.rag.pipeline import ask_rag, detect_language
from app.services.speech import text_to_speech as piper_text_to_speech, SpeechProcessingError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["voice-ai"])

VOICE_DIR = Path("voice_cache")
VOICE_DIR.mkdir(exist_ok=True)


class STTResponse(BaseModel):
    text: str
    detected_language: str


class TTSRequest(BaseModel):
    text: str
    language: str = "hi"


class VoiceChatResponse(BaseModel):
    transcription: str
    detected_language: str
    answer: str
    sources: list
    audio_base64: str


from fastapi import APIRouter, UploadFile, File, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/stt", response_model=STTResponse)
@limiter.limit("10/minute")
async def speech_to_text_endpoint(request: Request, file: UploadFile = File(...)):
    """
    Transcribe audio file into text using Whisper and detect language.
    Enforces 10 req/min rate limit.
    """
    audio_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix or ".wav"
    temp_path = VOICE_DIR / f"{audio_id}{ext}"

    try:
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())

        client = get_groq_client()

        with open(temp_path, "rb") as audio_file:
            transcription_res = client.audio.transcriptions.create(
                file=(temp_path.name, audio_file.read()),
                model="whisper-large-v3",
                response_format="text"
            )

        text = str(transcription_res).strip()
        lang = detect_language(text)

        logger.info(f"STT completed: {text!r} | language={lang}")
        return STTResponse(text=text, detected_language=lang)

    except Exception as exc:
        logger.error(f"STT failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech-to-Text transcription failed: {str(exc)}"
        )
    finally:
        if temp_path.exists():
            temp_path.unlink()


@router.post("/tts")
@limiter.limit("10/minute")
async def text_to_speech_endpoint(request: Request, body: TTSRequest):
    """
    Synthesize text into natural neural speech WAV audio using Piper ONNX model.
    Enforces 10 req/min rate limit.
    """
    if not body.text or not body.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text field cannot be empty for TTS synthesis."
        )

    try:
        audio_path = piper_text_to_speech(body.text)
        return FileResponse(path=str(audio_path), media_type="audio/wav", filename="response.wav")
    except SpeechProcessingError as exc:
        logger.error(f"TTS synthesis failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )



@router.post("/chat", response_model=VoiceChatResponse)
async def voice_chat_pipeline(file: UploadFile = File(...)):
    """
    End-to-End Multilingual Voice AI Pipeline:
    Audio Input → Whisper STT → Language Detection → RAG Query → Groq LLM → Piper Neural TTS Response.
    """
    # 1. Transcribe speech
    stt_res = await speech_to_text_endpoint(file)
    transcription = stt_res.text
    lang = stt_res.detected_language

    # 2. Execute RAG query
    rag_res = ask_rag(transcription)
    answer = rag_res["answer"]
    sources = rag_res["sources"]

    # 3. Generate Audio Response via Piper Neural TTS
    try:
        audio_path = piper_text_to_speech(answer[:500])
        with open(audio_path, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode("utf-8")
    except Exception as exc:
        logger.error(f"Voice chat TTS generation fallback: {exc}")
        audio_b64 = ""

    return VoiceChatResponse(
        transcription=transcription,
        detected_language=lang,
        answer=answer,
        sources=sources,
        audio_base64=audio_b64,
    )

