"""HTTP endpoints for Nyaya AI voice features."""

from __future__ import annotations

import logging
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.services.speech import SpeechProcessingError, speech_to_text, text_to_speech


logger = logging.getLogger(__name__)
router = APIRouter(tags=["speech"])
MAX_AUDIO_BYTES = 25 * 1024 * 1024


class SpeechToTextResponse(BaseModel):
    """Successful speech transcription payload."""

    text: str


class TextToSpeechRequest(BaseModel):
    """Text requested for speech synthesis."""

    text: str = Field(min_length=1, max_length=10_000)


async def _save_upload(audio_file: UploadFile) -> Path:
    """Persist an uploaded audio file temporarily for Whisper to read."""
    suffix = Path(audio_file.filename or "audio.webm").suffix or ".webm"
    content = await audio_file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded audio file is empty.",
        )
    if len(content) > MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="The uploaded audio file exceeds the 25 MB limit.",
        )

    with NamedTemporaryFile(delete=False, suffix=suffix) as temporary_file:
        temporary_file.write(content)
        return Path(temporary_file.name)


@router.post("/speech-to-text", response_model=SpeechToTextResponse)
async def transcribe_speech(
    audio_file: UploadFile = File(..., description="Recorded audio file."),
) -> SpeechToTextResponse:
    """Transcribe a multipart audio upload with Whisper."""
    if audio_file.content_type and not audio_file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Upload an audio file.",
        )

    temporary_path = await _save_upload(audio_file)
    try:
        text = await run_in_threadpool(speech_to_text, temporary_path)
    except SpeechProcessingError as error:
        logger.warning("Speech-to-text request failed: %s", error)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error
    finally:
        temporary_path.unlink(missing_ok=True)
        await audio_file.close()

    return SpeechToTextResponse(text=text)


from starlette.background import BackgroundTasks


def _remove_temp_file(path: Path) -> None:
    """Delete temporary audio file after response completes."""
    try:
        path.unlink(missing_ok=True)
    except Exception as e:
        logger.warning("Failed to delete temporary audio file %s: %s", path, e)


@router.post("/text-to-speech", response_class=FileResponse)
async def synthesize_speech(request: TextToSpeechRequest, background_tasks: BackgroundTasks) -> FileResponse:
    """Generate and return a WAV file for the supplied text."""
    try:
        audio_path = await run_in_threadpool(text_to_speech, request.text)
    except SpeechProcessingError as error:
        logger.warning("Text-to-speech request failed: %s", error)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    background_tasks.add_task(_remove_temp_file, audio_path)
    return FileResponse(audio_path, media_type="audio/wav", filename=audio_path.name)
