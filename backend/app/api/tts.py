"""Compatibility route for the original Piper text-to-speech endpoint."""

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse

from app.api.speech import TextToSpeechRequest
from app.services.speech import SpeechProcessingError, text_to_speech


router = APIRouter(tags=["tts"])


@router.post("/tts", response_class=FileResponse)
async def legacy_text_to_speech(request: TextToSpeechRequest) -> FileResponse:
    """Preserve the original /tts endpoint while using the shared service."""
    try:
        audio_path = await run_in_threadpool(text_to_speech, request.text)
    except SpeechProcessingError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    return FileResponse(audio_path, media_type="audio/wav", filename=audio_path.name)
