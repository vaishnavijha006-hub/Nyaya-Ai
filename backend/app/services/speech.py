"""Speech-to-text and text-to-speech services for Nyaya AI."""

from __future__ import annotations

from functools import lru_cache
import logging
from pathlib import Path
import wave
from typing import Any
from uuid import uuid4

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]
PIPER_MODEL_PATH = BACKEND_DIR / "voices" / "hi_IN-pratham-medium.onnx"
GENERATED_AUDIO_DIR = BACKEND_DIR / "temp" / "tts"


from app.services.tts import text_to_speech, TTSError

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


@lru_cache(maxsize=1)
def load_piper_voice() -> Any:
    """Load and cache the Piper ONNX neural voice model once per application process."""
    if not PIPER_MODEL_PATH.is_file():
        logger.error("Piper ONNX model missing at '%s'.", PIPER_MODEL_PATH)
        raise SpeechProcessingError(f"Piper ONNX model is missing at '{PIPER_MODEL_PATH}'.")

    try:
        from piper import PiperVoice
        logger.info("Loading Piper ONNX neural voice model from '%s'...", PIPER_MODEL_PATH.name)
        voice = PiperVoice.load(str(PIPER_MODEL_PATH))
        logger.info("Piper ONNX neural voice model loaded successfully.")
        return voice
    except Exception as error:
        logger.exception("Failed to load Piper ONNX voice model.")
        raise SpeechProcessingError("Piper ONNX neural voice model could not be loaded.") from error


def speech_to_text(audio_file: Path) -> str:
    """Transcribe an audio file with the cached Whisper model."""
    if not audio_file.is_file():
        raise SpeechProcessingError("The uploaded audio file could not be found.")

    try:
        model = load_whisper()
        # Whisper uses ffmpeg subprocess internally to load audio files
        result = model.transcribe(str(audio_file), fp16=False)
    except SpeechProcessingError:
        raise
    except FileNotFoundError as fnf_err:
        logger.exception("FFmpeg executable not found on system path.")
        raise SpeechProcessingError("FFmpeg is not installed or not found in PATH. Please install FFmpeg to enable Speech-to-Text.") from fnf_err
    except Exception as error:
        logger.exception("Whisper transcription failed for '%s'.", audio_file.name)
        if "CreateProcess" in str(error) or "WinError 2" in str(error):
            raise SpeechProcessingError("FFmpeg is missing on the server. Install FFmpeg to use voice recording.") from error
        raise SpeechProcessingError(f"Whisper transcription failed: {error}") from error

    text = str(result.get("text", "")).strip()
    if not text:
        raise SpeechProcessingError("No speech was detected in the uploaded audio.")
    return text


def text_to_speech(text: str) -> Path:
    """Generate a unique WAV file from text using cached Piper ONNX neural voice synthesis."""
    if not text or not text.strip():
        raise SpeechProcessingError("Text field cannot be empty.")

    clean_text = text.strip()
    GENERATED_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    output_path = GENERATED_AUDIO_DIR / f"{uuid4()}.wav"

    logger.info("Synthesizing speech via Piper ONNX for text length=%d", len(clean_text))

    try:
        voice = load_piper_voice()
        import numpy as np

        with wave.open(str(output_path), "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(voice.config.sample_rate)

            for chunk in voice.synthesize(clean_text):
                audio_bytes = (chunk.audio_float_array * 32767).astype(np.int16).tobytes()
                wav_file.writeframes(audio_bytes)

        if not output_path.is_file() or output_path.stat().st_size == 0:
            raise SpeechProcessingError("Piper completed synthesis but output file is empty.")



        logger.info("Piper TTS synthesis complete: '%s' (%d bytes)", output_path.name, output_path.stat().st_size)
        return output_path

    except SpeechProcessingError:
        raise
    except Exception as error:
        logger.exception("Piper neural TTS synthesis failed.")
        raise SpeechProcessingError(f"Piper neural TTS synthesis failed: {error}") from error

