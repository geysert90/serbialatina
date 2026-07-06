#!/usr/bin/env python3
"""
Edge TTS Server — OpenAI TTS API compatible.
Listens on port 5050, uses Microsoft Edge TTS (edge-tts) for neural voices.

Endpoint: POST /v1/audio/speech
  Body: { model: "tts-1", input: "text to speak", voice: "sr-RS-SophieNeural", response_format: "mp3" }
  Response: audio/mpeg binary

Supports authentication via Bearer token (SERBIO_TTS_TOKEN env var or "gacasteca" default).
"""

import asyncio
import io
import logging
import os
import tempfile
from contextlib import asynccontextmanager

import edge_tts
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import Response

logging.basicConfig(level=logging.INFO, format="%(asctime)s [TTS] %(levelname)s %(message)s")
log = logging.getLogger("edge-tts-server")

PORT = int(os.environ.get("TTS_PORT", "5050"))
TOKEN = os.environ.get("SERBIO_TTS_TOKEN", os.environ.get("TTS_TOKEN", os.environ.get("TTS_API_KEY", "gacasteca")))
DEFAULT_VOICE = os.environ.get("SERBIO_TTS_VOICE", "sr-RS-SophieNeural")


def verify_token(request: Request):
    """Validate Bearer token."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth.removeprefix("Bearer ").strip()
    if token != TOKEN:
        raise HTTPException(status_code=403, detail="Invalid token")


app = FastAPI(title="Edge TTS Server", version="1.0.0")


@app.post("/v1/audio/speech")
async def synthesize_speech(request: Request):
    verify_token(request)

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    text = body.get("input", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Missing 'input' field")

    voice = body.get("voice", DEFAULT_VOICE)
    response_format = body.get("response_format", "mp3")
    rate = body.get("rate", "+0%")
    pitch = body.get("pitch", "+0Hz")

    if response_format not in ("mp3", "wav", "ogg", "aac"):
        response_format = "mp3"

    log.info("Synthesizing: voice=%s | format=%s | text='%s'", voice, response_format, text[:80])

    try:
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)

        # edge-tts can stream to a BytesIO or write to a temp file
        buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buffer.write(chunk["data"])

        audio_data = buffer.getvalue()
        log.info("Synthesized %d bytes", len(audio_data))

        if not audio_data:
            raise HTTPException(status_code=500, detail="TTS produced empty audio")

        content_type = {
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "ogg": "audio/ogg",
            "aac": "audio/aac",
        }.get(response_format, "audio/mpeg")

        return Response(
            content=audio_data,
            media_type=content_type,
            headers={
                "Content-Length": str(len(audio_data)),
                "Cache-Control": "public, max-age=31536000",
            },
        )
    except edge_tts.exceptions.NoAudioReceived:
        log.error("No audio received from edge-tts for voice=%s", voice)
        raise HTTPException(status_code=502, detail="TTS engine returned no audio")
    except Exception as e:
        log.exception("TTS synthesis failed")
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "voice": DEFAULT_VOICE}


@app.get("/voices")
async def list_voices():
    """List available edge-tts voices."""
    voices = await edge_tts.list_voices()
    sr_voices = [v for v in voices if v["ShortName"].startswith("sr-")]
    return {"voices": sr_voices[:20], "default": DEFAULT_VOICE}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
