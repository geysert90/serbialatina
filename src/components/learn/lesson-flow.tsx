"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";

import { Flashcard } from "./flashcard";
import { AudioButton } from "./audio-button";
import type { LearningEntry } from "@/lib/learn/types";
import { completeEntryAction } from "@/app/serbio/actions";

// ── Types ─────────────────────────────────────────────────────────────

type ExerciseResult = "correct" | "incorrect" | "pending";

type RoundType = "present" | "choice" | "type";

type RoundState = {
  type: RoundType;
  stepIndex: number;
  results: Record<number, ExerciseResult>;
  /** For type exercises: the user's input */
  userInput: string;
  /** Feedback to show after answering */
  feedback: string | null;
};

type LessonFlowProps = {
  entries: LearningEntry[];
  unitId: number;
  /** Audio URLs keyed by entry id */
  audioUrls: Record<number, string>;
};

const CONFETTI_EMOJIS = ["🎉", "✨", "🌟", "🎊", "💫"] as const;
const CONFETTI_PARTICLES = Array.from({ length: 30 }).map((_, i) => ({
  id: i,
  left: `${((i * 37) % 100)}%`,
  animationDelay: `${((i * 7) % 15) / 10}s`,
  fontSize: `${12 + ((i * 5) % 16)}px`,
  emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
}));

// ── Helpers ───────────────────────────────────────────────────────────

/** Pick up to `count` distractors from the pool (excluding the correct one). */
function pickDistractors(
  correct: LearningEntry,
  pool: LearningEntry[],
  count: number = 3,
): LearningEntry[] {
  const others = pool.filter((e) => e.id !== correct.id);

  // Shuffle and pick at most `count` (or all if fewer available)
  const shuffled = [...others].sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, Math.min(count, shuffled.length));

  // If no distractors at all (single-entry unit), still return [correct] only
  if (distractors.length === 0) {
    return [correct];
  }

  // Return all options shuffled
  const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
  return options;
}

/** Case-insensitive, accent-tolerant comparison of Serbian latin input. */
function matchesSerbian(input: string, target: string): boolean {
  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  return normalize(input) === normalize(target);
}

// ── Component ─────────────────────────────────────────────────────────

export function LessonFlow({ entries, unitId, audioUrls }: LessonFlowProps) {
  const totalEntries = entries.length;

  // Round tracking
  const [currentRound, setCurrentRound] = useState<RoundType>("present");
  const [roundStates, setRoundStates] = useState<
    Record<RoundType, RoundState>
  >(() => ({
    present: { type: "present", stepIndex: 0, results: {}, userInput: "", feedback: null },
    choice: { type: "choice", stepIndex: 0, results: {}, userInput: "", feedback: null },
    type: { type: "type", stepIndex: 0, results: {}, userInput: "", feedback: null },
  }));

  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const state = roundStates[currentRound];
  const currentEntry = entries[state.stepIndex] ?? entries[0];

  // Pre-compute choice options for the current step (memoized per round)
  const choiceOptions = useMemo(() => {
    if (currentRound !== "choice") return [];
    return pickDistractors(currentEntry, entries, 3);
  }, [currentRound, entries, currentEntry]);

  const audioUrl = audioUrls[currentEntry?.id];

  // ── Actions ────────────────────────────────────────────────────────

  const advance = useCallback(() => {
    const nextIndex = state.stepIndex + 1;

    if (nextIndex >= totalEntries) {
      // Move to next round or finish
      if (currentRound === "present") {
        setCurrentRound("choice");
      } else if (currentRound === "choice") {
        setCurrentRound("type");
      } else {
        // All rounds done
        setIsComplete(true);
        setShowConfetti(true);
      }
      return;
    }

    setRoundStates((prev) => ({
      ...prev,
      [currentRound]: {
        ...prev[currentRound],
        stepIndex: nextIndex,
        userInput: "",
        feedback: null,
      },
    }));
  }, [state.stepIndex, currentRound, totalEntries]);

  const recordResult = useCallback(
    (entryId: number, result: ExerciseResult) => {
      setRoundStates((prev) => ({
        ...prev,
        [currentRound]: {
          ...prev[currentRound],
          results: { ...prev[currentRound].results, [entryId]: result },
        },
      }));

      // Record progress server-side on correct
      if (result === "correct") {
        completeEntryAction(entryId, unitId).catch(() => {
          // Silently fail — progress is best-effort for UX
        });
      }
    },
    [currentRound, unitId],
  );

  // ── Choice handler ─────────────────────────────────────────────────

  const handleChoice = (entryId: number) => {
    if (state.feedback) return; // Already answered

    const correctId = currentEntry.id;
    const isCorrect = entryId === correctId;

    recordResult(currentEntry.id, isCorrect ? "correct" : "incorrect");

    setRoundStates((prev) => ({
      ...prev,
      [currentRound]: {
        ...prev[currentRound],
        feedback: isCorrect ? "¡Correcto! 🎉" : `La respuesta es: ${currentEntry.serbian_latin}`,
      },
    }));
  };

  // ── Type handler ───────────────────────────────────────────────────

  const handleTypeSubmit = () => {
    if (!state.userInput.trim() || state.feedback) return;

    const isCorrect = matchesSerbian(state.userInput, currentEntry.serbian_latin);

    recordResult(currentEntry.id, isCorrect ? "correct" : "incorrect");

    setRoundStates((prev) => ({
      ...prev,
      [currentRound]: {
        ...prev[currentRound],
        feedback: isCorrect
          ? "¡Correcto! 🎉"
          : `La respuesta es: ${currentEntry.serbian_latin}`,
      },
    }));
  };

  // ── Score ──────────────────────────────────────────────────────────

  const correctCount = Object.values(state.results).filter(
    (r) => r === "correct",
  ).length;

  // ── Render ─────────────────────────────────────────────────────────

  if (isComplete) {
    const allCorrect = Object.values(roundStates.choice.results).filter(
      (r) => r === "correct",
    ).length +
      Object.values(roundStates.type.results).filter(
        (r) => r === "correct",
      ).length;
    const totalExercises = totalEntries * 2; // choice + type rounds

    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        {showConfetti && <Confetti />}
        <p className="text-5xl">🎉</p>
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-black">
          ¡Lección completada!
        </h2>
        <p className="text-lg text-black/55">
          Acertaste {allCorrect} de {totalExercises} ejercicios
        </p>
        <p className="text-sm text-amber-600 font-medium">
          +{totalEntries * 10} XP ganados
        </p>
        <Link
          href="/serbio/unidades"
          className="rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Volver a unidades
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Round indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`rounded-full px-3 py-1 font-medium ${
            currentRound === "present"
              ? "bg-amber-100 text-amber-800"
              : "text-black/30"
          }`}
        >
          Aprender
        </span>
        <span className="text-black/20">→</span>
        <span
          className={`rounded-full px-3 py-1 font-medium ${
            currentRound === "choice"
              ? "bg-amber-100 text-amber-800"
              : "text-black/30"
          }`}
        >
          Elegir
        </span>
        <span className="text-black/20">→</span>
        <span
          className={`rounded-full px-3 py-1 font-medium ${
            currentRound === "type"
              ? "bg-amber-100 text-amber-800"
              : "text-black/30"
          }`}
        >
          Escribir
        </span>
      </div>

      {/* Progress */}
      <div className="flex w-full max-w-sm items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-amber-100">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{
              width: `${((state.stepIndex + (state.feedback ? 1 : 0)) / totalEntries) * 100}%`,
            }}
          />
        </div>
        <span className="text-xs font-medium text-black/35 tabular-nums">
          {state.stepIndex + 1}/{totalEntries}
        </span>
      </div>

      {/* ── PRESENT ROUND ── */}
      {currentRound === "present" && (
        <Flashcard
          entry={currentEntry}
          audioUrl={audioUrl}
          showNext
          onNext={advance}
        />
      )}

      {/* ── CHOICE ROUND ── */}
      {currentRound === "choice" && (
        <div className="flex w-full max-w-sm flex-col items-center gap-5">
          <p className="text-lg font-medium text-black/70">
            ¿Cómo se dice{" "}
            <span className="font-semibold text-black">
              &ldquo;{currentEntry.spanish_translation}&rdquo;
            </span>{" "}
            en serbio?
          </p>

          <div className="grid w-full gap-2.5">
            {choiceOptions.map((opt) => {
              const isSelected = state.feedback !== null;
              const isCorrect = opt.id === currentEntry.id;
              const isWrongSelected =
                isSelected &&
                state.results[currentEntry.id] === "incorrect";

              let btnStyle =
                "rounded-xl border border-black/10 bg-white px-4 py-3 text-left text-lg font-medium transition hover:bg-amber-50";

              if (isSelected) {
                if (isCorrect) {
                  btnStyle =
                    "rounded-xl border-2 border-green-400 bg-green-50 px-4 py-3 text-left text-lg font-medium text-green-800";
                } else if (isWrongSelected) {
                  btnStyle =
                    "rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-left text-lg font-medium text-red-600 line-through";
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChoice(opt.id)}
                  disabled={!!state.feedback}
                  className={btnStyle}
                >
                  {opt.serbian_latin}
                  {isSelected && isCorrect && (
                    <span className="ml-2">✅</span>
                  )}
                </button>
              );
            })}
          </div>

          {state.feedback && (
            <div className="flex flex-col items-center gap-3">
              <p
                className={`text-sm font-medium ${
                  state.results[currentEntry.id] === "correct"
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {state.feedback}
              </p>
              {audioUrl && <AudioButton audioUrl={audioUrl} size="sm" />}
              <button
                type="button"
                onClick={advance}
                className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Continuar →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TYPE ROUND ── */}
      {currentRound === "type" && (
        <div className="flex w-full max-w-sm flex-col items-center gap-5">
          <p className="text-lg font-medium text-black/70">
            Escribe en serbio:{" "}
            <span className="font-semibold text-black">
              &ldquo;{currentEntry.spanish_translation}&rdquo;
            </span>
          </p>

          {!state.feedback ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTypeSubmit();
              }}
              className="flex w-full gap-2"
            >
              <input
                type="text"
                value={state.userInput}
                onChange={(e) =>
                  setRoundStates((prev) => ({
                    ...prev,
                    [currentRound]: {
                      ...prev[currentRound],
                      userInput: e.target.value,
                    },
                  }))
                }
                placeholder="Escribe en serbio..."
                autoFocus
                className="flex-1 rounded-xl border border-black/15 bg-white px-4 py-3 text-lg outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              <button
                type="submit"
                disabled={!state.userInput.trim()}
                className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-40"
              >
                ✓
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p
                className={`text-sm font-medium ${
                  state.results[currentEntry.id] === "correct"
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {state.feedback}
              </p>
              {audioUrl && <AudioButton audioUrl={audioUrl} size="sm" />}
              <button
                type="button"
                onClick={advance}
                className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Continuar →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Correct count */}
      {correctCount > 0 && currentRound !== "present" && (
        <p className="text-xs text-black/30">
          {correctCount} correcta{correctCount !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

// ── Confetti animation (CSS-only) ─────────────────────────────────────

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {CONFETTI_PARTICLES.map((particle) => (
        <span
          key={particle.id}
          className="absolute animate-[confetti-fall_2s_ease-out_forwards]"
          style={{
            left: particle.left,
            top: `-5%`,
            animationDelay: particle.animationDelay,
            fontSize: particle.fontSize,
            opacity: 0,
          }}
        >
          {particle.emoji}
        </span>
      ))}
    </div>
  );
}
