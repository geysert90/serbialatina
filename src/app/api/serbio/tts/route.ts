import { NextRequest, NextResponse } from "next/server";

import { toSerbianCyrillic } from "@/lib/learn/reading-library";

const TTS_URL = process.env.SERBIO_TTS_URL ?? "http://localhost:5050/v1/audio/speech";
const TTS_TOKEN =
  process.env.SERBIO_TTS_TOKEN ?? process.env.TTS_TOKEN ?? process.env.TTS_API_KEY ?? "gacasteca";
const DEFAULT_VOICE = process.env.SERBIO_TTS_VOICE ?? "sr-RS-SophieNeural";
const USER_AGENT = "SerbiaLatina-ReadingTTS/1.0";
const cache = new Map<string, Buffer>();

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " " );
}

function prepareTtsText(value: string): string {
  return toSerbianCyrillic(normalize(value));
}

async function synthesize(text: string, voice: string) {
  const cacheKey = `${voice}|${text}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const response = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TTS_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    throw new Error(`TTS service error ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  cache.set(cacheKey, buffer);
  return buffer;
}

async function readInput(request: NextRequest): Promise<{ text: string | null; voice: string }> {
  if (request.method === "POST") {
    try {
      const body = (await request.json()) as { text?: unknown; voice?: unknown };
      return {
        text: typeof body.text === "string" ? body.text : null,
        voice: typeof body.voice === "string" && body.voice.trim() ? body.voice.trim() : DEFAULT_VOICE,
      };
    } catch {
      return { text: null, voice: DEFAULT_VOICE };
    }
  }

  const { searchParams } = request.nextUrl;
  const text = searchParams.get("text");
  const voice = searchParams.get("voice")?.trim() || DEFAULT_VOICE;
  return { text, voice };
}

async function handleRequest(request: NextRequest) {
  const { text, voice } = await readInput(request);
  const normalizedText = text ? prepareTtsText(text) : "";

  if (!normalizedText) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  try {
    const audio = await synthesize(normalizedText, voice);

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown TTS error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}
