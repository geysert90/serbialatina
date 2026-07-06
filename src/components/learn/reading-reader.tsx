"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  findSentenceForWord,
  normalizeReadingKey,
  ReadingSource,
  ReadingToken,
  toSerbianCyrillic,
  tokenizeReadingText,
} from "@/lib/learn/reading-library";

type WordState = "unknown" | "practicing" | "known";

type TranslationResponse = {
  word: string;
  wordTranslation: string;
  explanation: string;
  sentence: string;
  sentenceTranslation: string;
};

type SelectedWord = {
  word: string;
  key: string;
  sentence: string;
  state: WordState;
};

type PopoverPosition = {
  left: number;
  top: number;
  placement: "top" | "bottom";
};

const STORAGE_KEY = "serbio-reading-word-states-v2";
const SERBIO_TTS_VOICE = "sr-RS-SophieNeural";

function stateLabels(state: WordState): string {
  if (state === "known") return "Conocida";
  if (state === "practicing") return "En práctica";
  return "Nueva";
}

function stateClassNames(state: WordState): string {
  if (state === "known") {
    return "border-sky-200 bg-sky-100 text-sky-800 hover:bg-sky-200/70";
  }

  if (state === "practicing") {
    return "border-amber-200 bg-amber-100 text-amber-900 hover:bg-amber-200/70";
  }

  return "border-transparent text-black hover:bg-black/5";
}

function isWordLike(token: ReadingToken): token is ReadingToken & { key: string } {
  return token.type === "word" && Boolean(token.key);
}

function getWordButtonLabel(state: WordState, word: string): string {
  return `${word} · ${stateLabels(state)}`;
}

function prepareTtsText(value: string): string {
  return toSerbianCyrillic(value.trim().replace(/\s+/g, " "));
}

function getInitialWordStates(): Record<string, WordState> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, WordState>;
  } catch {
    return {};
  }
}

async function fetchTranslation(word: string, sentence: string): Promise<TranslationResponse> {
  const params = new URLSearchParams({
    word,
    sentence,
  });

  const response = await fetch(`/api/serbio/translate?${params.toString()}`);
  if (!response.ok) {
    throw new Error("No se pudo traducir la palabra.");
  }

  return response.json() as Promise<TranslationResponse>;
}

export function ReadingReader({ source }: { source: ReadingSource }) {
  const [wordStates, setWordStates] = useState<Record<string, WordState>>(() =>
    getInitialWordStates(),
  );
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [translation, setTranslation] = useState<TranslationResponse | null>(null);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isExampleModalOpen, setIsExampleModalOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const playRequestRef = useRef(0);
  const mobileActionsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wordStates));
  }, [wordStates]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const tokensByParagraph = useMemo(() => {
    return source.paragraphs.map((paragraph) => tokenizeReadingText(paragraph));
  }, [source.paragraphs]);

  const fullText = useMemo(() => source.paragraphs.join(" "), [source.paragraphs]);

  const counts = useMemo(() => {
    const values = Object.values(wordStates);
    return {
      known: values.filter((value) => value === "known").length,
      practicing: values.filter((value) => value === "practicing").length,
      total: values.length,
    };
  }, [wordStates]);

  const computePopoverPosition = (anchorEl: HTMLButtonElement): PopoverPosition => {
    const rect = anchorEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const estimatedWidth = Math.min(288, Math.max(224, viewportWidth - 32));
    const halfWidth = estimatedWidth / 2;
    const horizontalPadding = 12;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2, halfWidth + horizontalPadding),
      viewportWidth - halfWidth - horizontalPadding,
    );
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const estimatedHeight = 128;
    const placement: PopoverPosition["placement"] =
      spaceBelow < estimatedHeight + 24 && spaceAbove > spaceBelow ? "top" : "bottom";
    const top = placement === "top" ? rect.top - 10 : rect.bottom + 10;
    return { left, top, placement };
  };

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const playServerAudio = async (text: string) => {
    const requestId = playRequestRef.current + 1;
    playRequestRef.current = requestId;
    setAudioError(null);
    stopCurrentAudio();

    try {
      const response = await fetch("/api/serbio/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: prepareTtsText(text),
          voice: SERBIO_TTS_VOICE,
        }),
      });

      if (!response.ok) {
        throw new Error("No pudimos generar el audio del servidor.");
      }

      const blob = await response.blob();
      if (playRequestRef.current !== requestId) return;

      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;
      const audio = new Audio(objectUrl);
      audioRef.current = audio;

      audio.onended = () => {
        if (objectUrlRef.current === objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrlRef.current = null;
        }
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };

      audio.onerror = () => {
        if (objectUrlRef.current === objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrlRef.current = null;
        }
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        setAudioError("No pudimos reproducir el audio de esta palabra.");
      };

      await audio.play();
    } catch (error) {
      if (playRequestRef.current === requestId) {
        setAudioError(error instanceof Error ? error.message : "No pudimos cargar el audio.");
      }
    }
  };

  const openWord = async (word: string, anchorEl: HTMLButtonElement) => {
    const key = normalizeReadingKey(word);
    const sentence = findSentenceForWord(source.paragraphs, word);
    const state = wordStates[key] ?? "unknown";

    setSelectedWord({ word, key, sentence, state });
    setPopoverPosition(computePopoverPosition(anchorEl));
    setTranslation(null);
    setTranslationError(null);
    setAudioError(null);
    setIsLoadingTranslation(true);

    void playServerAudio(word);

    try {
      const result = await fetchTranslation(word, sentence);
      setTranslation(result);
    } catch (error) {
      setTranslationError(
        error instanceof Error ? error.message : "No pudimos cargar la traducción.",
      );
    } finally {
      setIsLoadingTranslation(false);
    }
  };

  const updateWordState = (nextState: WordState) => {
    if (!selectedWord) return;

    setWordStates((prev) => {
      const next = { ...prev };
      next[selectedWord.key] = nextState;
      return next;
    });

    setSelectedWord((prev) => (prev ? { ...prev, state: nextState } : prev));
  };

  const scrollToMobileActions = () => {
    mobileActionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectedState = selectedWord?.state ?? "unknown";
  const selectedTranslation = translation?.wordTranslation ?? "";
  const selectedExplanation = translation?.explanation ?? "";
  const selectedSentenceTranslation = translation?.sentenceTranslation ?? "";

  return (
    <>
      <div className="relative overflow-hidden rounded-[44px] border border-amber-300 bg-gradient-to-br from-[#5d4023] via-[#3d2816] to-[#20140d] p-3 pb-24 shadow-[0_40px_110px_rgba(58,34,10,0.24)] md:p-4 md:pb-4">
        <div className="pointer-events-none absolute inset-3 rounded-[38px] border border-white/10" />
        <div className="pointer-events-none absolute left-1/2 top-4 hidden h-[calc(100%-2rem)] w-12 -translate-x-1/2 rounded-full bg-gradient-to-r from-black/15 via-transparent to-black/15 lg:block" />
        <div className="relative grid gap-0 overflow-hidden rounded-[34px] border border-[#e8d6b7] bg-[#fffaf0] lg:grid-cols-[minmax(0,1fr)_24px_minmax(0,0.92fr)]">
        <article className="relative min-h-full space-y-6 overflow-hidden bg-[linear-gradient(180deg,#fffdf5_0%,#fffaf0_100%)] px-5 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4 border-b border-amber-100 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                Lectura interactiva
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-black md:text-3xl">
                Lee, colorea y toca palabras
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void playServerAudio(prepareTtsText(fullText))}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              ▶ Escuchar texto completo
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            <span>🟦 Conocidas: {counts.known}</span>
            <span>🟧 Práctica: {counts.practicing}</span>
            <span>✍️ Guardadas: {counts.total}</span>
          </div>

          {selectedWord ? (
            <button
              type="button"
              onClick={scrollToMobileActions}
              className="fixed right-3 top-1/2 z-40 -translate-y-1/2 rounded-full border border-amber-300 bg-white/95 px-3 py-2 text-xs font-semibold text-amber-800 shadow-lg md:hidden"
            >
              {selectedWord.word} ↓
            </button>
          ) : null}

          <div className="space-y-5 leading-8 text-[1.05rem] text-black/80 md:text-[1.08rem]">
            {tokensByParagraph.map((tokens, paragraphIndex) => (
              <p key={`${source.slug}-${paragraphIndex}`} className="text-pretty">
                {tokens.map((token, tokenIndex) => {
                  if (token.type !== "word" || !isWordLike(token)) {
                    return (
                      <span key={`${source.slug}-${paragraphIndex}-${tokenIndex}`}>
                        {token.text}
                      </span>
                    );
                  }

                  const key = token.key;
                  const state = wordStates[key] ?? "unknown";
                  const isSelected = selectedWord?.key === key;

                  return (
                    <span key={`${source.slug}-${paragraphIndex}-${tokenIndex}`} className="relative inline-block align-baseline">
                      <button
                        type="button"
                        onClick={(event) => void openWord(token.text, event.currentTarget)}
                        className={`relative inline-flex items-center rounded-md border px-1.5 py-0.5 align-baseline transition ${stateClassNames(
                          state,
                        )} ${isSelected ? "ring-2 ring-amber-300 ring-offset-1" : ""}`}
                        aria-label={getWordButtonLabel(state, token.text)}
                      >
                        {token.text}
                      </button>

                      {isSelected && popoverPosition && (
                        <span
                          className="fixed z-50 w-[min(18rem,80vw)] rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-[#fff8e8] px-3 py-2 text-left shadow-xl"
                          style={{
                            left: `${popoverPosition.left}px`,
                            top: `${popoverPosition.top}px`,
                            transform:
                              popoverPosition.placement === "top"
                                ? "translate(-50%, -100%)"
                                : "translate(-50%, 0)",
                          }}
                        >
                          <span className="block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-amber-700">
                            Traducción
                          </span>
                          <span className="mt-1 block text-sm font-semibold text-black">
                            {isLoadingTranslation ? "Buscando…" : selectedTranslation || "—"}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-black/65">
                            {isLoadingTranslation
                              ? "Generando explicación…"
                              : selectedExplanation ||
                                "Toca otra palabra si quieres más contexto."}
                          </span>
                        </span>
                      )}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>

          <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4 text-sm text-black/60 shadow-inner">
            <p className="font-medium text-black/75">Cómo funciona</p>
            <ul className="mt-2 grid gap-2 md:grid-cols-2">
              <li>• Azul = palabra que ya conoces</li>
              <li>• Naranja = palabra en práctica</li>
              <li>• Color normal = palabra nueva</li>
              <li>• Pulsa una palabra para escucharla y verla traducida</li>
            </ul>
          </div>
        </article>

        <div className="hidden bg-gradient-to-b from-transparent via-amber-300/60 to-transparent lg:block" />

        <aside
          ref={mobileActionsRef}
          className="relative min-h-full bg-[linear-gradient(180deg,#fffdf5_0%,#fffaf0_100%)] px-4 py-5 md:px-6 md:py-8"
        >
          <div className="rounded-[30px] border border-amber-100 bg-gradient-to-br from-white to-[#fff8eb] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] md:p-6">
            {selectedWord ? (
              <div className="space-y-4">
                <div className="space-y-2 border-b border-black/5 pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                    Palabra seleccionada
                  </p>
                  <h3 className="text-2xl font-semibold tracking-[-0.04em] text-black">
                    {selectedWord.word}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${stateClassNames(
                        selectedState,
                      )}`}
                    >
                      {stateLabels(selectedState)}
                    </span>
                    <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black/55">
                      {source.topic}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                      Traducción en español
                    </p>
                    <p className="mt-1 text-base font-medium text-black">
                      {isLoadingTranslation ? "Buscando traducción…" : selectedTranslation || "—"}
                    </p>
                  </div>

                  <div className="hidden md:block">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                      Ejemplo de uso
                    </p>
                    <p className="mt-1 text-sm leading-7 text-black/75">
                      {selectedWord.sentence}
                    </p>
                  </div>

                  <div className="hidden md:block">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                      Sentido en español
                    </p>
                    <p className="mt-1 text-sm leading-7 text-black/70">
                      {isLoadingTranslation
                        ? "Traduciendo el contexto…"
                        : selectedSentenceTranslation || "—"}
                    </p>
                  </div>

                  <div className="md:hidden">
                    <button
                      type="button"
                      onClick={() => setIsExampleModalOpen(true)}
                      className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                    >
                      ℹ Ver ejemplo
                    </button>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                      Explicación breve
                    </p>
                    <p className="mt-1 text-sm leading-7 text-black/70">
                      {isLoadingTranslation
                        ? "Generando una explicación corta…"
                        : selectedExplanation || "—"}
                    </p>
                  </div>

                  {audioError && (
                    <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600">
                      {audioError}
                    </p>
                  )}

                  {translationError && (
                    <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600">
                      {translationError}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => updateWordState("known")}
                      className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                    >
                      Marcar conocida
                    </button>
                    <button
                      type="button"
                      onClick={() => updateWordState("practicing")}
                      className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      En práctica
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-4xl">📚</p>
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-black">
                  Pulsa cualquier palabra
                </h3>
                <p className="text-sm leading-7 text-black/55">
                  Escuchará su audio del servidor y verás traducción en español con una breve explicación.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-[28px] border border-amber-100 bg-gradient-to-br from-[#fffdf6] to-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/35">
              Fuente
            </p>
            <h4 className="mt-1 text-lg font-semibold text-black">{source.sourceName}</h4>
            <p className="mt-1 text-sm leading-6 text-black/55">{source.subtitle}</p>
          </div>
        </aside>
      </div>
      </div>

      {selectedWord ? (
        <div className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-amber-200 bg-white/95 p-3 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.5)] backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-black">{selectedWord.word}</p>
              <p className="truncate text-xs text-black/55">
                {isLoadingTranslation ? "Buscando traducción…" : selectedTranslation || "Sin traducción"}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-black/45">
                {counts.known} conocidas · {counts.practicing} práctica
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsExampleModalOpen(true)}
                className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700"
              >
                Ejemplo
              </button>
              <button
                type="button"
                onClick={() => setSelectedWord(null)}
                className="shrink-0 rounded-full border border-black/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-black/60"
                aria-label="Cerrar acciones rápidas"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateWordState("known")}
              className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700"
            >
              ✅ Conocida
            </button>
            <button
              type="button"
              onClick={() => updateWordState("practicing")}
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"
            >
              📝 Práctica
            </button>
          </div>
        </div>
      ) : null}

      {isExampleModalOpen && selectedWord ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 md:hidden">
          <div className="w-full max-w-md rounded-[28px] border border-black/10 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-black/5 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                  Ejemplo de uso
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-black">
                  {selectedWord.word}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExampleModalOpen(false)}
                className="rounded-full bg-black/5 px-3 py-1 text-sm font-semibold text-black/55"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-3 pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                  Frase original
                </p>
                <p className="mt-1 text-sm leading-7 text-black/80">{selectedWord.sentence}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                  Sentido en español
                </p>
                <p className="mt-1 text-sm leading-7 text-black/70">
                  {isLoadingTranslation ? "Traduciendo…" : selectedSentenceTranslation || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
