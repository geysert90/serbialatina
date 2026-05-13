"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

import { Flashcard } from "@/components/learn/flashcard";
import type { LearningEntry } from "@/lib/learn/types";

type FlashcardDeckProps = {
  entries: LearningEntry[];
  audioUrls: Record<number, string>;
};

export function FlashcardDeck({ entries, audioUrls }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [known, setKnown] = useState<number[]>([]);
  const [unknown, setUnknown] = useState<number[]>([]);
  const [isDone, setIsDone] = useState(false);

  const currentEntry = entries[currentIndex];

  const handleAnswer = useCallback(
    (knows: boolean) => {
      if (knows) {
        setKnown((prev) => [...prev, currentEntry.id]);
      } else {
        setUnknown((prev) => [...prev, currentEntry.id]);
      }

      const nextIndex = currentIndex + 1;
      if (nextIndex >= entries.length) {
        setIsDone(true);
      } else {
        setCurrentIndex(nextIndex);
      }
    },
    [currentIndex, currentEntry.id, entries.length],
  );

  const restart = () => {
    setCurrentIndex(0);
    setKnown([]);
    setUnknown([]);
    setIsDone(false);
  };

  if (entries.length === 0) {
    return null;
  }

  if (isDone) {
    const total = entries.length;
    const pct = Math.round((known.length / total) * 100);

    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <p className="text-5xl">{pct >= 80 ? "🎉" : "💪"}</p>
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-black">
          ¡Sesión completada!
        </h2>
        <p className="text-lg text-black/55">
          Recordaste {known.length} de {total} ({pct}%)
        </p>
        {unknown.length > 0 && (
          <p className="text-sm text-black/35">
            {unknown.length} para repasar la próxima vez
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={restart}
            className="rounded-full border border-black/10 bg-white px-5 py-2 text-sm font-medium text-black/60 transition hover:bg-black/5"
          >
            Repetir sesión
          </button>
          <Link
            href="/serbio/unidades"
            className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Ir a unidades
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress */}
      <div className="flex w-full max-w-sm items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-amber-100">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{
              width: `${((currentIndex) / entries.length) * 100}%`,
            }}
          />
        </div>
        <span className="text-xs font-medium text-black/35 tabular-nums">
          {currentIndex + 1}/{entries.length}
        </span>
      </div>

      {/* Card */}
      <Flashcard
        entry={currentEntry}
        audioUrl={audioUrls[currentEntry.id]}
      />

      {/* Know / Don't know buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleAnswer(false)}
          className="rounded-full border-2 border-red-200 bg-red-50 px-6 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 active:scale-95"
        >
          No sé
        </button>
        <button
          type="button"
          onClick={() => handleAnswer(true)}
          className="rounded-full border-2 border-green-200 bg-green-50 px-6 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100 active:scale-95"
        >
          Lo sé ✓
        </button>
      </div>

      {/* Counts */}
      <div className="flex gap-4 text-xs text-black/35">
        <span>✅ {known.length} sabidas</span>
        <span>🔄 {unknown.length} por repasar</span>
      </div>
    </div>
  );
}
