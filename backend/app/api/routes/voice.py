"""Voice API routes for speech-to-text and text-to-speech."""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from backend.app.core.voice import voice_processor

router = APIRouter(prefix="/api/v1/voice")


class TTSRequest(BaseModel):
    text: str
    lang: str = "en"


@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    """Convert speech audio to text."""
    audio_data = await audio.read()
    result = await voice_processor.speech_to_text(audio_data)
    return result


@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech audio."""
    result = await voice_processor.text_to_speech(request.text, request.lang)
    return result
