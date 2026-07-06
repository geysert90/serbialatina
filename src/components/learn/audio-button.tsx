"use client";

import { useState, useRef } from "react";

type AudioButtonProps = {
  /** Full Directus asset URL (from getEntryAudioUrl) */
  audioUrl: string;
  /** Optional label / aria-label */
  label?: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Optional class overrides */
  className?: string;
};

export function AudioButton({
  audioUrl,
  label = "Escuchar pronunciación",
  size = "md",
  className = "",
}: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };

      audio.play().catch(() => {
        setIsPlaying(false);
        audioRef.current = null;
      });
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsPlaying(false);
    }
  };

  const sizeClasses =
    size === "sm"
      ? "h-8 w-8 text-sm"
      : "h-10 w-10 text-base";

  return (
    <button
      type="button"
      onClick={togglePlay}
      aria-label={isPlaying ? "Pausar audio" : label}
      className={`inline-flex items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-amber-700 transition hover:bg-amber-100 active:scale-95 ${sizeClasses} ${className}`}
    >
      {isPlaying ? "⏸" : "🔊"}
    </button>
  );
}
