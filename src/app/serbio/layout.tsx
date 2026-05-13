import Link from "next/link";
import { type ReactNode } from "react";

export default function SerbioLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <nav className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-x-1 gap-y-2 px-4 pt-4 text-xs sm:text-sm md:px-8 md:pt-6">
        <Link
          href="/serbio"
          className="rounded-full px-2.5 py-1.5 font-medium text-black/55 transition hover:bg-amber-50 hover:text-black sm:px-3"
        >
          Inicio
        </Link>
        <span className="hidden text-black/20 sm:inline">/</span>
        <Link
          href="/serbio/unidades"
          className="rounded-full px-2.5 py-1.5 font-medium text-black/55 transition hover:bg-amber-50 hover:text-black sm:px-3"
        >
          Unidades
        </Link>
        <span className="hidden text-black/20 sm:inline">/</span>
        <Link
          href="/serbio/revista"
          className="rounded-full px-2.5 py-1.5 font-medium text-black/55 transition hover:bg-amber-50 hover:text-black sm:px-3"
        >
          Revista
        </Link>
        <span className="hidden text-black/20 sm:inline">/</span>
        <Link
          href="/serbio/flashcards"
          className="rounded-full px-2.5 py-1.5 font-medium text-black/55 transition hover:bg-amber-50 hover:text-black sm:px-3"
        >
          Repaso
        </Link>
        <span className="hidden text-black/20 sm:inline">/</span>
        <Link
          href="/serbio/progreso"
          className="rounded-full px-2.5 py-1.5 font-medium text-black/55 transition hover:bg-amber-50 hover:text-black sm:px-3"
        >
          Progreso
        </Link>
      </nav>
      {children}
    </>
  );
}
