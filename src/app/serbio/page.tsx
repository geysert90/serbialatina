import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aprende Serbio",
  description:
    "Recursos para aprender serbio desde español. En desarrollo.",
};

export default function SerbioPage() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 md:px-8 md:py-20">
      <div className="panel space-y-10 p-8 md:p-12">
        <div className="space-y-4">
          <p className="eyebrow w-fit">En desarrollo</p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-black md:text-5xl">
            Aprende serbio
          </h1>
          <p className="max-w-xl text-lg leading-8 text-black/60">
            Estamos preparando recursos para que la comunidad hispana en Serbia
            pueda aprender serbio de forma práctica, desde vocabulario básico
            hasta frases para el día a día.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <p className="text-2xl">🗣️</p>
            <p className="mt-2 text-sm font-semibold text-black">
              Vocabulario esencial
            </p>
            <p className="mt-1 text-sm text-black/55">
              Palabras y frases para moverte por Serbia sin problema.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <p className="text-2xl">📝</p>
            <p className="mt-2 text-sm font-semibold text-black">
              Gramática básica
            </p>
            <p className="mt-1 text-sm text-black/55">
              Casos, géneros y estructuras explicadas desde el español.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <p className="text-2xl">🎧</p>
            <p className="mt-2 text-sm font-semibold text-black">
              Pronunciación
            </p>
            <p className="mt-1 text-sm text-black/55">
              Guías de sonidos que no existen en español: č, ć, đ, š, ž.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <p className="text-2xl">💬</p>
            <p className="mt-2 text-sm font-semibold text-black">
              Diálogos reales
            </p>
            <p className="mt-1 text-sm text-black/55">
              Conversaciones en la tienda, el médico, la administración.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
