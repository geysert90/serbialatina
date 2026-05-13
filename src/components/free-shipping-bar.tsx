"use client";

import { useEffect, useState } from "react";
import { getShippingProgress } from "@/lib/shipping";

type FreeShippingBarProps = {
  currentTotal: number;
  compact?: boolean;
};

export function FreeShippingBar({ currentTotal, compact = false }: FreeShippingBarProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [showCelebrate, setShowCelebrate] = useState(false);

  const { target, remaining, percent, unlocked } = getShippingProgress(currentTotal);

  // Animate the progress bar on mount and when percent changes
  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedPercent(percent), 150);
    return () => clearTimeout(timeout);
  }, [percent]);

  // Celebration when unlocked
  useEffect(() => {
    if (unlocked) {
      setShowCelebrate(true);
      const t = setTimeout(() => setShowCelebrate(false), 3000);
      return () => clearTimeout(t);
    }
  }, [unlocked]);

  if (compact) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-white p-3">
        {/* Mini progress bar */}
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-emerald-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${animatedPercent}%` }}
          />
        </div>

        {unlocked ? (
          <p className="text-center text-xs font-semibold text-emerald-600">
            🚚 ¡Envío gratis desbloqueado!
          </p>
        ) : (
          <p className="text-center text-xs font-medium text-emerald-700">
            <span className="tabular-nums font-bold">${remaining.toFixed(2)}</span> más para envío gratis
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-base">
            🚚
          </span>
          <div>
            {unlocked ? (
              <p className="text-sm font-bold text-emerald-600">
                ¡Envío gratis conseguido!
              </p>
            ) : (
              <p className="text-sm font-semibold text-black">
                Envío gratis
              </p>
            )}
            <p className="text-xs text-black/40">
              En pedidos superiores a <span className="font-semibold tabular-nums">${target.toFixed(2)}</span>
            </p>
          </div>
        </div>

        {unlocked && showCelebrate && (
          <span className="animate-bounce text-lg">🎉</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-3 overflow-hidden rounded-full bg-emerald-100 shadow-inner">
        {/* Animated fill */}
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 transition-all duration-700 ease-out"
          style={{ width: `${animatedPercent}%` }}
        />
        {/* Shine effect when unlocked */}
        {unlocked && (
          <div className="absolute inset-0 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        )}
      </div>

      {/* Progress text */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-black/35 tabular-nums">
          ${currentTotal.toFixed(2)}
        </span>

        {!unlocked ? (
          <span className="text-xs font-semibold text-emerald-700">
            Te faltan <span className="tabular-nums">${remaining.toFixed(2)}</span>
          </span>
        ) : (
          <span className="text-xs font-bold text-emerald-600">
            Desbloqueado ✓
          </span>
        )}

        <span className="text-xs font-medium text-black/25 tabular-nums">
          ${target.toFixed(2)}
        </span>
      </div>

      {/* CTA when not unlocked */}
      {!unlocked && (
        <p className="text-center text-xs leading-relaxed text-black/35">
          Agrega <span className="font-semibold text-emerald-600 tabular-nums">${remaining.toFixed(2)}</span> más
          en productos para obtener <strong className="text-emerald-600">envío gratis</strong>
        </p>
      )}
    </div>
  );
}
