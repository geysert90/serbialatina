"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Flashcard } from "./flashcard";
import { AudioButton } from "./audio-button";
import type { LearningEntry } from "@/lib/learn/types";
import { MAX_HEARTS } from "@/lib/learn/types";
import {
  completeEntryAction,
  deductHeartAction,
  addXpAction,
} from "@/app/serbio/actions";

// ── Types ─────────────────────────────────────────────────────────────

type ExerciseResult = "correct" | "incorrect" | "pending";
type RoundType = "present" | "choice" | "type";

type RoundState = {
  type: RoundType;
  stepIndex: number;
  results: Record<number, ExerciseResult>;
  userInput: string;
  feedback: string | null;
};

type ChallengeGameProps = {
  entries: LearningEntry[];
  unitId: number;
  audioUrls: Record<number, string>;
  initialHearts: number;
};

// ── Helpers ───────────────────────────────────────────────────────────

function pickDistractors(
  correct: LearningEntry,
  pool: LearningEntry[],
  count: number = 3,
): LearningEntry[] {
  const others = pool.filter((e) => e.id !== correct.id);
  const shuffled = [...others].sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, Math.min(count, shuffled.length));
  if (distractors.length === 0) return [correct];
  return [correct, ...distractors].sort(() => Math.random() - 0.5);
}

function matchesSerbian(input: string, target: string): boolean {
  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  return normalize(input) === normalize(target);
}

// ── Sound generation (Web Audio API) ─────────────────────────────────

function useSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playCorrect = useCallback(() => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio not available
    }
  }, [getCtx]);

  const playIncorrect = useCallback(() => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not available
    }
  }, [getCtx]);

  return { playCorrect, playIncorrect };
}

// ── XP Floating animation ────────────────────────────────────────────

function FloatingXp({ xp, x, y }: { xp: number; x: number; y: number }) {
  return (
    <span
      className="pointer-events-none fixed z-50 animate-[xp-float_1s_ease-out_forwards] text-lg font-bold text-amber-500"
      style={{ left: x, top: y }}
    >
      +{xp} XP
    </span>
  );
}

// ── Hearts Display ────────────────────────────────────────────────────

function HeartsDisplay({ hearts }: { hearts: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: MAX_HEARTS }).map((_, i) => (
        <span
          key={i}
          className={`text-lg transition-all duration-300 ${
            i < hearts
              ? "scale-100 opacity-100"
              : "scale-75 opacity-20 grayscale"
          }`}
        >
          {i < hearts ? "❤️" : "🖤"}
        </span>
      ))}
    </div>
  );
}

// ── Game Over Modal ───────────────────────────────────────────────────

function GameOverModal({
  unitId,
  onRetry,
  onRefill,
}: {
  unitId: number;
  onRetry: () => void;
  onRefill: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
        <p className="text-5xl">💔</p>
        <h2 className="mt-4 text-2xl font-bold text-black">Sin corazones</h2>
        <p className="mt-2 text-sm text-black/50">
          Has perdido todos tus corazones. Recarga o vuelve a intentarlo más
          tarde.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onRefill}
            className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white transition hover:bg-amber-600"
          >
            Recargar corazones
          </button>
          <Link
            href="/serbio/unidades"
            className="rounded-xl border border-black/10 px-6 py-3 font-medium text-black/60 transition hover:bg-black/5"
          >
            Volver a unidades
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Result Card ───────────────────────────────────────────────────────

function ResultCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-2xl p-5 ${color}`}
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-3xl font-bold text-black">{value}</span>
      <span className="text-sm font-medium text-black/50">{label}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export function ChallengeGame({
  entries,
  unitId,
  audioUrls,
  initialHearts,
}: ChallengeGameProps) {
  const totalEntries = entries.length;
  const { playCorrect, playIncorrect } = useSound();

  // Hearts state
  const [hearts, setHearts] = useState(initialHearts);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverHearts, setGameOverHearts] = useState(initialHearts);

  // Round tracking
  const [currentRound, setCurrentRound] = useState<RoundType>("present");
  const [roundStates, setRoundStates] = useState<
    Record<RoundType, RoundState>
  >(() => ({
    present: {
      type: "present",
      stepIndex: 0,
      results: {},
      userInput: "",
      feedback: null,
    },
    choice: {
      type: "choice",
      stepIndex: 0,
      results: {},
      userInput: "",
      feedback: null,
    },
    type: {
      type: "type",
      stepIndex: 0,
      results: {},
      userInput: "",
      feedback: null,
    },
  }));

  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [floatingXps, setFloatingXps] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const floatingIdRef = useRef(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);

  const state = roundStates[currentRound];
  const currentEntry = entries[state.stepIndex] ?? entries[0];

  const choiceOptions = useMemo(() => {
    if (currentRound !== "choice") return [];
    return pickDistractors(currentEntry, entries, 3);
  }, [currentRound, entries, currentEntry]);

  const audioUrl = audioUrls[currentEntry?.id];

  // XP animation handler
  const showFloatingXp = useCallback(
    (clientX: number, clientY: number) => {
      const id = ++floatingIdRef.current;
      setFloatingXps((prev) => [...prev, { id, x: clientX, y: clientY }]);
      setTimeout(() => {
        setFloatingXps((prev) => prev.filter((f) => f.id !== id));
      }, 1000);
    },
    [],
  );

  // Advance to next entry or round
  const advance = useCallback(() => {
    const nextIndex = state.stepIndex + 1;

    if (nextIndex >= totalEntries) {
      if (currentRound === "present") {
        setCurrentRound("choice");
      } else if (currentRound === "choice") {
        setCurrentRound("type");
      } else {
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

  // Record result and handle hearts
  const recordResult = useCallback(
    async (
      entryId: number,
      result: ExerciseResult,
      _clientX?: number,
      _clientY?: number,
    ) => {
      setRoundStates((prev) => ({
        ...prev,
        [currentRound]: {
          ...prev[currentRound],
          results: { ...prev[currentRound].results, [entryId]: result },
        },
      }));

      if (result === "correct") {
        playCorrect();
        completeEntryAction(entryId, unitId).catch(() => {});
        addXpAction(10).catch(() => {});
        setTotalXpEarned((prev) => prev + 10);
      } else {
        playIncorrect();
        // Deduct heart
        const heartResult = await deductHeartAction();
        if (heartResult.ok) {
          setHearts(heartResult.hearts);
          if (heartResult.gameOver) {
            setGameOver(true);
            setGameOverHearts(heartResult.hearts);
          }
        }
      }
    },
    [currentRound, unitId, playCorrect, playIncorrect],
  );

  // Choice handler
  const handleChoice = useCallback(
    (entryId: number, _e: React.MouseEvent) => {
      if (state.feedback || gameOver) return;

      const isCorrect = entryId === currentEntry.id;

      setRoundStates((prev) => ({
        ...prev,
        [currentRound]: {
          ...prev[currentRound],
          feedback: isCorrect
            ? "¡Correcto! 🎉"
            : `La respuesta es: ${currentEntry.serbian_latin}`,
        },
      }));

      recordResult(currentEntry.id, isCorrect ? "correct" : "incorrect");
    },
    [state.feedback, gameOver, currentEntry, currentRound, recordResult],
  );

  // Type handler
  const handleTypeSubmit = useCallback(() => {
    if (!state.userInput.trim() || state.feedback || gameOver) return;

    const isCorrect = matchesSerbian(
      state.userInput,
      currentEntry.serbian_latin,
    );

    setRoundStates((prev) => ({
      ...prev,
      [currentRound]: {
        ...prev[currentRound],
        feedback: isCorrect
          ? "¡Correcto! 🎉"
          : `La respuesta es: ${currentEntry.serbian_latin}`,
      },
    }));

    recordResult(currentEntry.id, isCorrect ? "correct" : "incorrect");
  }, [state.userInput, state.feedback, gameOver, currentEntry, currentRound, recordResult]);

  // Hearts refill
  const handleRefill = useCallback(async () => {
    const result = await deductHeartAction(); // Just to reset
    setHearts(MAX_HEARTS);
    setGameOver(false);
  }, []);

  // ── Progress calculation ────────────────────────────────────────────

  const choiceCorrect = Object.values(roundStates.choice.results).filter(
    (r) => r === "correct",
  ).length;
  const typeCorrect = Object.values(roundStates.type.results).filter(
    (r) => r === "correct",
  ).length;
  const totalCorrect = choiceCorrect + typeCorrect;
  const totalExercises = totalEntries * 2;

  const progressPercent = gameOver
    ? 0
    : isComplete
      ? 100
      : Math.round(
          ((state.stepIndex + (state.feedback ? 1 : 0)) / totalEntries) * 100,
        );

  // ── Render ─────────────────────────────────────────────────────────

  // Game Over screen
  if (gameOver) {
    return (
      <GameOverModal
        unitId={unitId}
        onRetry={() => {
          setHearts(gameOverHearts);
          setGameOver(false);
        }}
        onRefill={handleRefill}
      />
    );
  }

  // Completion screen
  if (isComplete) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        {showConfetti && (
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <span
                key={i}
                className="absolute animate-[confetti-fall_2.5s_ease-out_forwards] text-xl"
                style={{
                  left: `${(i * 47) % 100}%`,
                  top: "-5%",
                  animationDelay: `${(i * 0.12).toFixed(2)}s`,
                  opacity: 0,
                }}
              >
                {["🎉", "✨", "🌟", "🎊", "💫", "❤️", "⭐"][i % 7]}
              </span>
            ))}
          </div>
        )}

        <p className="text-5xl">🏆</p>
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-black">
          ¡Lección completada!
        </h2>
        <p className="text-lg text-black/55">
          Acertaste {totalCorrect} de {totalExercises} ejercicios
        </p>

        <div className="mt-4 grid w-full max-w-xs grid-cols-2 gap-4">
          <ResultCard
            label="XP ganados"
            value={`+${totalXpEarned}`}
            icon="⚡"
            color="bg-amber-50"
          />
          <ResultCard
            label="Corazones"
            value={`${hearts}/${MAX_HEARTS}`}
            icon="❤️"
            color={hearts > 0 ? "bg-green-50" : "bg-red-50"}
          />
        </div>

        <Link
          href="/serbio/unidades"
          className="rounded-full bg-amber-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Volver a unidades
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Floating XP animations */}
      {floatingXps.map((f) => (
        <FloatingXp key={f.id} xp={10} x={f.x} y={f.y} />
      ))}

      {/* Duolingo-style header with hearts + progress */}
      <div className="flex w-full max-w-sm items-center gap-3">
        <HeartsDisplay hearts={hearts} />
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-amber-100">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs font-medium text-black/35 tabular-nums">
          {state.stepIndex + 1}/{totalEntries}
        </span>
      </div>

      {/* Round indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`rounded-full px-3 py-1 font-medium transition-all ${
            currentRound === "present"
              ? "bg-amber-100 text-amber-800"
              : "text-black/30"
          }`}
        >
          Aprender
        </span>
        <span className="text-black/20">→</span>
        <span
          className={`rounded-full px-3 py-1 font-medium transition-all ${
            currentRound === "choice"
              ? "bg-amber-100 text-amber-800"
              : "text-black/30"
          }`}
        >
          Elegir
        </span>
        <span className="text-black/20">→</span>
        <span
          className={`rounded-full px-3 py-1 font-medium transition-all ${
            currentRound === "type"
              ? "bg-amber-100 text-amber-800"
              : "text-black/30"
          }`}
        >
          Escribir
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
              const isCorrectOpt = opt.id === currentEntry.id;
              const wasWrongSelected =
                isSelected &&
                state.results[currentEntry.id] === "incorrect";

              let btnStyle =
                "rounded-xl border border-black/10 bg-white px-4 py-3 text-left text-lg font-medium transition-all duration-200 hover:bg-amber-50 active:scale-[0.98]";

              if (isSelected) {
                if (isCorrectOpt) {
                  btnStyle =
                    "rounded-xl border-2 border-green-400 bg-green-50 px-4 py-3 text-left text-lg font-medium text-green-800 scale-[1.02]";
                } else if (wasWrongSelected && opt.id === currentEntry.id) {
                  // The correct answer highlighted green after wrong
                  btnStyle =
                    "rounded-xl border-2 border-green-400 bg-green-50 px-4 py-3 text-left text-lg font-medium text-green-800";
                } else if (wasWrongSelected && state.feedback) {
                  btnStyle =
                    "rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-left text-lg font-medium text-red-600 line-through opacity-60";
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={(e) => handleChoice(opt.id, e)}
                  disabled={!!state.feedback}
                  className={btnStyle}
                >
                  {opt.serbian_latin}
                  {isSelected && isCorrectOpt && (
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
                className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-95"
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
                className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-40 active:scale-95"
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
                className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-95"
              >
                Continuar →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
