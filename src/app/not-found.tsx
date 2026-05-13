import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-4xl items-center px-4 py-16 md:px-8">
      <div className="panel w-full space-y-6 p-8 md:p-10">
        <div className="eyebrow w-fit">404</div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-black md:text-5xl">
            No encontré ese contenido en Serbia Latina.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-black/65">
            La ruta existe en el frontend, pero el slug solicitado no devolvió datos
            publicados desde WordPress.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_-22px_rgba(0,0,0,0.8)]"
        >
          Volver a la portada
        </Link>
      </div>
    </section>
  );
}
