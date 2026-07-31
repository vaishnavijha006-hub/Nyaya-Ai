"""
voice.py — Voice AI Router (Speech-to-Text & Text-to-Speech).

Endpoints:
  POST /voice/transcribe -> Speech-to-Text via OpenAI Whisper
  POST /voice/speak      -> Text-to-Speech via Piper Neural ONNX
"""

from __future__ import annotations

import logging
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, File, HTTPException, UploadFile, BackgroundTasks, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.services.speech import speech_to_text, SpeechProcessingError
from app.services.tts import text_to_speech, TTSError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["voice-ai"])

MAX_AUDIO_BYTES = 25 * 1024 * 1024
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm"}


class TranscribeResponse(BaseModel):
    transcript: str


class SpeakRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10_000)


def _cleanup_file(file_path: Path) -> None:
    """Helper background task to remove temporary generated audio file."""
    try:
        if file_path.exists():
            file_path.unlink()
            logger.info("Cleaned up temp voice file: %s", file_path)
    except Exception as error:
        logger.warning("Failed to clean up temp voice file '%s': %s", file_path, error)


async def _save_audio_upload(audio_file: UploadFile) -> Path:
    """Validate and persist uploaded audio file temporarily."""
    filename = audio_file.filename or "recording.webm"
    suffix = Path(filename).suffix.lower() or ".webm"

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported audio format '{suffix}'. Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    content = await audio_file.read()
    if not content or len(content.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded audio file is empty.",
        )

    if len(content) > MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="The uploaded audio file exceeds the 25 MB limit.",
        )

    with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(content)
        return Path(temp_file.name)


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio_endpoint(
    audio_file: UploadFile = File(..., alias="file", description="Recorded audio file (wav, mp3, m4a, webm)."),
    language: Optional[str] = Form(default=None, description="Optional target transcription language code (e.g. hi)."),
) -> TranscribeResponse:
    """
    Speech-to-Text endpoint.
    Accepts audio file upload and returns transcription json payload:
    {"transcript": "..."}
    """
    temp_path = await _save_audio_upload(audio_file)
    try:
        transcript = await run_in_threadpool(speech_to_text, temp_path, language=language)
        return TranscribeResponse(transcript=transcript)
    except SpeechProcessingError as error:
        logger.warning("STT failed: %s", error)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error
    finally:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)
        await audio_file.close()


@router.post("/speak", response_class=FileResponse)
async def speak_text_endpoint(
    request: SpeakRequest,
    background_tasks: BackgroundTasks,
) -> FileResponse:
    """
    Text-to-Speech endpoint.
    Synthesizes requested text into speech via Piper ONNX, returns WAV audio,
    and automatically cleans up temporary files after delivery.
    """
    if not request.text or not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text field cannot be empty for TTS synthesis.",
        )

    try:
        audio_path = await run_in_threadpool(text_to_speech, request.text)
    except (TTSError, SpeechProcessingError) as error:
        logger.warning("TTS failed: %s", error)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    background_tasks.add_task(_cleanup_file, audio_path)
    return FileResponse(
        audio_path,
        media_type="audio/wav",
        filename="speech.wav",
    )
