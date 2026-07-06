"use client";

import { useState, useCallback, useEffect } from "react";
import type { YouTubeVideo } from "@/lib/learn/youtube";

export function VideoGrid({ videos }: { videos: YouTubeVideo[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeVideo = videos.find((v) => v.id === activeId);

  const open = useCallback((id: string) => setActiveId(id), []);
  const close = useCallback(() => setActiveId(null), []);

  // Close on Escape key
  useEffect(() => {
    if (!activeId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeId, close]);

  if (!videos || videos.length === 0) return null;

  return (
    <>
      <div className="rounded-[28px] border border-red-100 bg-gradient-to-br from-red-50/60 via-white to-amber-50/40 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-2xl">🎬</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
              Videos para aprender
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
              Serbia Latina en YouTube
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {videos.map((video) => (
            <button
              key={video.id}
              onClick={() => open(video.id)}
              className="group block w-full cursor-pointer overflow-hidden rounded-xl border border-black/10 bg-white text-left transition hover:border-red-300 hover:shadow-md"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90 text-white shadow-lg transition group-hover:scale-110">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-2.5">
                <p className="line-clamp-2 text-xs font-medium leading-snug text-black group-hover:text-red-700">
                  {video.title}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-center">
          <a
            href="https://www.youtube.com/@SerbiaLatina"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Ver canal completo →
          </a>
        </div>
      </div>

      {/* Modal / Lightbox */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-600"
              aria-label="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* YouTube iframe */}
            <div className="relative aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>

            {/* Video title bar */}
            <div className="bg-black px-5 py-3">
              <p className="text-sm font-medium text-white line-clamp-2">
                {activeVideo.title}
              </p>
              <a
                href={activeVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
              >
                Ver en YouTube ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
