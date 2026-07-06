import { NextRequest, NextResponse } from "next/server";

type TranslationPayload = {
  word: string;
  wordTranslation: string;
  explanation: string;
  sentence: string;
  sentenceTranslation: string;
};

const cache = new Map<string, TranslationPayload>();

function cleanTranslation(value: string): string {
  return value
    .trim()
    .replace(/^[“”"']+/, "")
    .replace(/[“”"']+$/, "");
}

async function translateText(text: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=sr|es`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "SerbiaLatina-Reading/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Translation API error ${response.status}`);
  }

  const data = await response.json();
  const translatedText = data?.responseData?.translatedText;
  const cleanedText = typeof translatedText === "string" ? cleanTranslation(translatedText) : "";
  return cleanedText || text;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const word = searchParams.get("word")?.trim();
  const sentence = searchParams.get("sentence")?.trim() ?? "";

  if (!word) {
    return NextResponse.json({ error: "Missing word" }, { status: 400 });
  }

  const cacheKey = `${word.toLowerCase()}|${sentence.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const [wordTranslation, sentenceTranslation] = await Promise.all([
      translateText(word),
      sentence ? translateText(sentence) : Promise.resolve(word),
    ]);

    const payload: TranslationPayload = {
      word,
      wordTranslation,
      explanation:
        wordTranslation && wordTranslation !== word
          ? `En esta frase se entiende como “${wordTranslation}”.`
          : "La traducción puede variar según el contexto de la frase.",
      sentence,
      sentenceTranslation,
    };

    cache.set(cacheKey, payload);
    return NextResponse.json(payload);
  } catch {
    const fallback: TranslationPayload = {
      word,
      wordTranslation: word,
      explanation: "No pudimos cargar una traducción automática, así que dejamos el texto original.",
      sentence,
      sentenceTranslation: sentence || word,
    };

    cache.set(cacheKey, fallback);
    return NextResponse.json(fallback);
  }
}
