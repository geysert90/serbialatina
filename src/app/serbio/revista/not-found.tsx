import Link from "next/link";

export default function RevistaNotFound() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-20 text-center md:px-8">
      <p className="text-5xl">📚</p>
      <h1 className="text-3xl font-semibold tracking-[-0.04em] text-black">
        Revista no encontrada
      </h1>
      <p className="max-w-xl text-black/55">
        Esa revista todavía no existe en la biblioteca. Vuelve al catálogo y
        elige otra para practicar lectura interactiva.
      </p>
      <Link
        href="/serbio/revista"
        className="rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
      >
        Volver al catálogo
      </Link>
    </section>
  );
}
