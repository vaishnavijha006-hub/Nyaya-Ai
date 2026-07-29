"""Text-to-speech API routes powered by Piper."""

from pathlib import Path
import subprocess
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel


router = APIRouter(tags=["tts"])

MODEL_PATH = Path("app/tts_models/hi_IN-pratham-medium.onnx")
TEMP_DIR = Path("temp")


class TTSRequest(BaseModel):
    """The text to synthesize into speech."""

    text: str


@router.post("/tts", response_class=FileResponse)
def text_to_speech(request: TTSRequest) -> FileResponse:
    """Generate a WAV audio file from the supplied text using Piper."""
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    output_path = TEMP_DIR / f"{uuid4()}.wav"

    try:
        result = subprocess.run(
            ["piper", "--model", str(MODEL_PATH), "--output_file", str(output_path)],
            input=request.text.encode("utf-8"),
            capture_output=True,
            check=False,
        )
    except FileNotFoundError as error:
        raise HTTPException(
            status_code=500,
            detail="Piper CLI was not found. Install Piper and ensure it is on PATH.",
        ) from error

    if result.returncode != 0:
        error_message = result.stderr.decode("utf-8", errors="replace").strip()
        raise HTTPException(
            status_code=500,
            detail=f"Piper TTS failed: {error_message or 'unknown error'}",
        )

    if not output_path.is_file():
        raise HTTPException(
            status_code=500,
            detail="Piper TTS completed but did not create the output WAV file.",
        )

    return FileResponse(output_path, media_type="audio/wav", filename=output_path.name)
