import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from pathlib import Path

def run_test():
    try:
        from app.services.speech import text_to_speech, speech_to_text
    except ImportError as e:
        print(f"Import Error: {e}")
        return

    text_to_synthesize = "Hello, this is a test of the text to speech system."
    print(f"1. Synthesizing text: '{text_to_synthesize}'")
    try:
        audio_path = text_to_speech(text_to_synthesize)
        print(f"   SUCCESS: Saved audio to {audio_path}")
    except Exception as e:
        print(f"   FAILED TTS: {e}")
        return

    print(f"\n2. Transcribing audio: {audio_path}")
    try:
        transcribed_text = speech_to_text(audio_path)
        print(f"   SUCCESS: Transcribed text: '{transcribed_text}'")
    except Exception as e:
        print(f"   FAILED STT: {e}")
        return

if __name__ == "__main__":
    run_test()
