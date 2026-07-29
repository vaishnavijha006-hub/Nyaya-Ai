"""Speech-to-text and text-to-speech services for Nyaya AI."""

from __future__ import annotations

from functools import lru_cache
import logging
from pathlib import Path
import subprocess
from typing import Any
from uuid import uuid4


logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]
PIPER_MODEL_PATH = BACKEND_DIR / "voices" / "hi_IN-pratham-medium.onnx"
GENERATED_AUDIO_DIR = BACKEND_DIR / "temp" / "tts"


class SpeechProcessingError(RuntimeError):
    """Raised when audio cannot be transcribed or synthesized."""


@lru_cache(maxsize=1)
def load_whisper() -> Any:
    """Load and cache the Whisper model once per application process."""
    try:
        import whisper
    except ImportError as error:
        raise SpeechProcessingError(
            "Whisper is not installed. Install the openai-whisper package."
        ) from error

    model_name = "base"
    logger.info("Loading Whisper model '%s'.", model_name)
    try:
        return whisper.load_model(model_name)
    except Exception as error:
        logger.exception("Unable to load Whisper model '%s'.", model_name)
        raise SpeechProcessingError("Whisper model could not be loaded.") from error


def speech_to_text(audio_file: Path) -> str:
    """Transcribe an audio file with the cached Whisper model."""
    if not audio_file.is_file():
        raise SpeechProcessingError("The uploaded audio file could not be found.")

    try:
        result = load_whisper().transcribe(str(audio_file), fp16=False)
    except SpeechProcessingError:
        raise
    except Exception as error:
        logger.exception("Whisper transcription failed for '%s'.", audio_file.name)
        raise SpeechProcessingError("Whisper could not transcribe the uploaded audio.") from error

    text = str(result.get("text", "")).strip()
    if not text:
        raise SpeechProcessingError("No speech was detected in the uploaded audio.")
    return text


def text_to_speech(text: str) -> Path:
    """Generate a unique WAV file from text with the Hindi Piper voice."""
    if not text.strip():
        raise SpeechProcessingError("Text cannot be empty.")
    if not PIPER_MODEL_PATH.is_file():
        raise SpeechProcessingError(
            f"Piper model is missing at '{PIPER_MODEL_PATH}'."
        )

    GENERATED_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    output_path = GENERATED_AUDIO_DIR / f"{uuid4()}.wav"

    try:
        result = subprocess.run(
            [
                "piper",
                "--model",
                str(PIPER_MODEL_PATH),
                "--output_file",
                str(output_path),
            ],
            input=text.encode("utf-8"),
            capture_output=True,
            check=False,
            timeout=60,
        )
    except FileNotFoundError as error:
        raise SpeechProcessingError(
            "Piper CLI was not found. Install Piper and add it to PATH."
        ) from error
    except subprocess.TimeoutExpired as error:
        logger.warning("Piper timed out while generating '%s'.", output_path.name)
        raise SpeechProcessingError("Piper timed out while generating audio.") from error

    if result.returncode != 0:
        stderr = result.stderr.decode("utf-8", errors="replace").strip()
        logger.error("Piper exited with code %s: %s", result.returncode, stderr)
        raise SpeechProcessingError(
            f"Piper failed to generate audio: {stderr or 'unknown error'}"
        )
    if not output_path.is_file():
        raise SpeechProcessingError("Piper completed without creating a WAV file.")

    return output_path
