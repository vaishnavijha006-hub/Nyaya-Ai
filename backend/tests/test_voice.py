"""
test_voice.py — Comprehensive unit & integration tests for Phase 13 Voice AI endpoints.
"""

from __future__ import annotations

import io
import wave
import pytest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def create_dummy_wav_bytes() -> bytes:
    """Generate a minimal valid 16-bit 44.1kHz mono WAV file in-memory."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(44100)
        wav_file.writeframes(b"\x00\x00" * 441)
    return buf.getvalue()


class TestVoiceAI:

    @patch("app.api.voice.speech_to_text", return_value="What is Article 21 of the Indian Constitution?")
    def test_transcription_endpoint_success(self, mock_stt):
        wav_bytes = create_dummy_wav_bytes()
        response = client.post(
            "/voice/transcribe",
            files={"file": ("test.wav", wav_bytes, "audio/wav")}
        )
        assert response.status_code == 200
        data = response.json()
        assert "transcript" in data
        assert data["transcript"] == "What is Article 21 of the Indian Constitution?"
        mock_stt.assert_called_once()

    def test_transcription_empty_audio(self):
        response = client.post(
            "/voice/transcribe",
            files={"file": ("empty.wav", b"", "audio/wav")}
        )
        assert response.status_code in (400, 422)

    def test_transcription_unsupported_format(self):
        response = client.post(
            "/voice/transcribe",
            files={"file": ("test.txt", b"Hello world", "text/plain")}
        )
        assert response.status_code == 415
        assert "Unsupported audio format" in response.json()["detail"]

    @patch("app.api.voice.text_to_speech")
    def test_tts_endpoint_success(self, mock_tts, tmp_path):
        dummy_wav_path = tmp_path / "generated.wav"
        dummy_wav_path.write_bytes(create_dummy_wav_bytes())
        mock_tts.return_value = dummy_wav_path

        response = client.post(
            "/voice/speak",
            json={"text": "Article 21 guarantees the right to life and personal liberty."}
        )
        assert response.status_code == 200
        assert response.headers["content-type"] in ("audio/wav", "audio/x-wav")
        assert len(response.content) > 0
        mock_tts.assert_called_once_with("Article 21 guarantees the right to life and personal liberty.")

    def test_tts_endpoint_empty_text(self):
        response = client.post(
            "/voice/speak",
            json={"text": "   "}
        )
        assert response.status_code in (400, 422)


    @patch("app.api.voice.text_to_speech")
    def test_tts_cleanup_executed(self, mock_tts, tmp_path):
        dummy_wav_path = tmp_path / "temp_to_clean.wav"
        dummy_wav_path.write_bytes(create_dummy_wav_bytes())
        mock_tts.return_value = dummy_wav_path

        with TestClient(app) as test_client:
            res = test_client.post(
                "/voice/speak",
                json={"text": "Cleanup test query"}
            )
            assert res.status_code == 200

        # Background task runs after response completes
        assert not dummy_wav_path.exists()
