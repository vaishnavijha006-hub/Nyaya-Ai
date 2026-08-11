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
PIPER_MODEL_PATH_HI = BACKEND_DIR / "voices" / "hi_IN-pratham-medium.onnx"
PIPER_MODEL_PATH_EN = BACKEND_DIR / "voices" / "en_US-lessac-medium.onnx"
GENERATED_AUDIO_DIR = BACKEND_DIR / "temp" / "tts"


class TTSError(RuntimeError):
    """Raised when text-to-speech synthesis fails."""


@lru_cache(maxsize=2)
def load_piper_voice(language: str = "hi") -> Any:
    """Load and cache the Piper ONNX neural voice model."""
    model_path = PIPER_MODEL_PATH_EN if language == "en" else PIPER_MODEL_PATH_HI
    
    if not model_path.is_file():
        logger.error("Piper ONNX model missing at '%s'.", model_path)
        raise TTSError(f"Piper ONNX model missing at '{model_path}'.")

    try:
        from piper import PiperVoice
        logger.info("Loading Piper ONNX neural voice model from '%s'...", model_path.name)
        voice = PiperVoice.load(str(model_path))
        return voice
    except Exception as error:
        logger.exception("Failed to load Piper ONNX voice model.")
        raise TTSError("Piper ONNX neural voice model could not be loaded.") from error


def prepare_for_tts(text: str) -> str:
    """Uses LLM to format/transliterate text for a Hindi neural TTS engine."""
    from app.services.llm import get_groq_client, PRIMARY_MODEL
    try:
        client = get_groq_client()
        prompt = (
            "You are a text pre-processor for a Hindi Text-to-Speech (TTS) engine. "
            "Your task is to take the given text and rewrite it into clean, phonetic Devanagari script (Hindi). "
            "CRITICAL RULES:\n"
            "1. Output ONLY the Devanagari text, nothing else.\n"
            "2. Transliterate English words into Devanagari (e.g., 'Constitution' -> 'कॉन्स्टिट्यूशन').\n"
            "3. Convert all digits/numbers into Hindi words (e.g., '21' -> 'इक्कीस', '2005' -> 'दो हज़ार पाँच').\n"
            "4. Expand abbreviations (e.g., 'RTI' -> 'आर टी आई').\n"
            "5. Remove special markdown characters (*, #, [, ]) but keep natural punctuation (, . ?).\n"
        )
        res = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text},
            ],
            temperature=0.0,
            max_tokens=1000,
        )
        cleaned = res.choices[0].message.content.strip()
        logger.info(f"TTS prepared text: {cleaned}")
        return cleaned if cleaned else text
    except Exception as e:
        logger.warning(f"TTS preparation failed: {e}")
        return text


def text_to_speech(text: str, language: str = "hi") -> Path:
    """
    Synthesize speech from text and save to a temporary WAV file.
    Returns absolute Path to generated audio file.
    """
    if not text or not text.strip():
        raise TTSError("Text field cannot be empty.")

    # Pre-process text based on language
    if language == "en":
        import re
        clean_text = re.sub(r'[*_#`~>|-]', ' ', text.strip())
        clean_text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
    else:
        clean_text = prepare_for_tts(text.strip())

    GENERATED_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    output_path = GENERATED_AUDIO_DIR / f"{uuid4()}.wav"

    try:
        voice = load_piper_voice(language)
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
