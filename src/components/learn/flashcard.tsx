"use client";

import { useState } from "react";

import { AudioButton } from "./audio-button";
import type { LearningEntry } from "@/lib/learn/types";

type FlashcardProps = {
  entry: LearningEntry;
  audioUrl?: string;
  /** Called when user flips or taps "Next" */
  onNext?: () => void;
  /** Show "Next" button? (For presentation round) */
  showNext?: boolean;
  /** Auto-flip after delay? (ms) */
  autoFlipMs?: number;
};

export function Flashcard({
  entry,
  audioUrl,
  onNext,
  showNext = false,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const flip = () => setIsFlipped((prev) => !prev);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* 3D Card */}
      <div
        className="relative h-64 w-full max-w-sm cursor-pointer [perspective:800px] sm:h-72"
        onClick={flip}
      >
        <div
          className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* Front — Serbian */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 [backface-visibility:hidden]">
            <p className="text-3xl font-semibold tracking-[-0.03em] text-amber-900 sm:text-4xl">
              {entry.serbian_cyrillic}
            </p>
            <p className="text-2xl text-amber-800/80 sm:text-3xl">
              {entry.serbian_latin}
            </p>
            {entry.pronunciation_hint && (
              <p className="text-sm text-amber-600/60">
                {entry.pronunciation_hint}
              </p>
            )}
            <p className="text-xs text-amber-400/50">Toca para ver</p>
          </div>

          {/* Back — Spanish */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-3xl font-semibold tracking-[-0.03em] text-green-900 sm:text-4xl">
              {entry.spanish_translation}
            </p>
            {entry.example_spanish && (
              <p className="text-sm text-green-700/60">
                &ldquo;{entry.example_spanish}&rdquo;
              </p>
            )}
            {entry.example_latin && (
              <p className="text-sm text-green-600/40 italic">
                {entry.example_latin}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {audioUrl && (
          <AudioButton audioUrl={audioUrl} label="Escuchar pronunciación" />
        )}
        <button
          type="button"
          onClick={flip}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black/55 transition hover:bg-black/5"
        >
          {isFlipped ? "Volver" : "Traducción"}
        </button>
        {showNext && onNext && (
          <button
            type="button"
            onClick={onNext}
            className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Siguiente →
          </button>
        )}
      </div>
    </div>
  );
}
