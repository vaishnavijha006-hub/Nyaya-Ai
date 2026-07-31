"""
tts.py — Piper Text-to-Speech service for Nyaya AI.
"""

from __future__ import annotations

import logging
import wave
from pathlib import Path
from uuid import uuid4
from typing import Any
from functools import lru_cache

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]
PIPER_MODEL_PATH = BACKEND_DIR / "voices" / "hi_IN-pratham-medium.onnx"
GENERATED_AUDIO_DIR = BACKEND_DIR / "temp" / "tts"


class TTSError(RuntimeError):
    """Raised when text-to-speech synthesis fails."""


@lru_cache(maxsize=1)
def load_piper_voice() -> Any:
    """Load and cache the Piper ONNX neural voice model."""
    if not PIPER_MODEL_PATH.is_file():
        logger.error("Piper ONNX model missing at '%s'.", PIPER_MODEL_PATH)
        raise TTSError(f"Piper ONNX model missing at '{PIPER_MODEL_PATH}'.")

    try:
        from piper import PiperVoice
        logger.info("Loading Piper ONNX neural voice model from '%s'...", PIPER_MODEL_PATH.name)
        voice = PiperVoice.load(str(PIPER_MODEL_PATH))
        return voice
    except Exception as error:
        logger.exception("Failed to load Piper ONNX voice model.")
        raise TTSError("Piper ONNX neural voice model could not be loaded.") from error


def text_to_speech(text: str) -> Path:
    """
    Synthesize speech from text and save to a temporary WAV file.
    Returns absolute Path to generated audio file.
    """
    if not text or not text.strip():
        raise TTSError("Text field cannot be empty.")

    clean_text = text.strip()
    GENERATED_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    output_path = GENERATED_AUDIO_DIR / f"{uuid4()}.wav"

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
            raise TTSError("Piper completed synthesis but output file is empty.")

        return output_path

    except TTSError:
        raise
    except Exception as error:
        logger.exception("Piper neural TTS synthesis failed.")
        raise TTSError(f"Piper neural TTS synthesis failed: {error}") from error
