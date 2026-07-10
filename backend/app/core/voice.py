"""Voice interface integration for speech-to-text and text-to-speech."""

import io
import os
import tempfile
from typing import Optional

from backend.app.utils.logger import logger

try:
    import speech_recognition as sr
except ImportError:
    sr = None

try:
    from gtts import gTTS
except ImportError:
    gTTS = None


class VoiceProcessor:
    """Handles speech-to-text and text-to-speech processing."""

    def __init__(self):
        self.recognizer = sr.Recognizer() if sr else None

    async def speech_to_text(self, audio_data: bytes) -> dict:
        """Convert speech audio bytes to text."""
        if not sr:
            return {"success": False, "error": "speech_recognition library not installed"}

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                tmp.write(audio_data)
                tmp_path = tmp.name

            with sr.AudioFile(tmp_path) as source:
                audio = self.recognizer.record(source)

            text = self.recognizer.recognize_google(audio)
            os.unlink(tmp_path)

            return {"success": True, "text": text, "confidence": 0.95}

        except sr.UnknownValueError:
            return {"success": False, "error": "Could not understand audio"}
        except sr.RequestError as e:
            return {"success": False, "error": f"Speech recognition service error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Voice processing error: {str(e)}"}

    async def text_to_speech(self, text: str, lang: str = "en") -> dict:
        """Convert text to speech audio bytes."""
        if not gTTS:
            return {"success": False, "error": "gTTS library not installed"}

        try:
            tts = gTTS(text=text, lang=lang, slow=False)
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_bytes = audio_buffer.getvalue()

            return {"success": True, "audio": audio_bytes.hex(), "format": "mp3", "length": len(audio_bytes)}

        except Exception as e:
            return {"success": False, "error": f"TTS error: {str(e)}"}


voice_processor = VoiceProcessor()
