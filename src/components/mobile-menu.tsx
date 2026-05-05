"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface MenuLink {
  label: string;
  href: string;
  badge?: string;
}

interface CommunityGroup {
  type: "community";
  label: string;
  links: MenuLink[];
}

interface SimpleLink {
  type: "link";
  label: string;
  href: string;
  external?: boolean;
  icon?: "cart";
}

type MobileMenuItem = CommunityGroup | SimpleLink;

export function MobileMenu({ items }: { items: MobileMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [animate, setAnimate] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const openMenu = useCallback(() => {
    setOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimate(true));
    });
  }, []);

  const closeMenu = useCallback(() => {
    setAnimate(false);
    setTimeout(() => setOpen(false), 300);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const overlay = open
    ? createPortal(
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          {/* Backdrop — tap to close */}
          <div
            className={`absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
              animate ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Panel — slides from right */}
          <div
            ref={panelRef}
            className={`absolute right-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto bg-[rgba(255,252,244,0.99)] shadow-[-20px_0_60px_-25px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-transform duration-300 ease-out ${
              animate ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/45">
                Menú
              </p>
              <button
                type="button"
                onClick={closeMenu}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black/45 transition hover:bg-black/5 hover:text-black"
                aria-label="Cerrar menú"
              >
                <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4">
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>
            </div>

            <nav className="space-y-1 px-3 py-4">
              {items.map((item, idx) =>
                item.type === "community" ? (
                  <div key={`community-${idx}`}>
                    <p className="px-4 pb-1 pt-3 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-black/35">
                      {item.label}
                    </p>
                    {item.links.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={closeMenu}
                        className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-black/72 transition hover:bg-black/5 hover:text-black"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={`${item.label}-${idx}`}
                    href={item.href}
                    onClick={closeMenu}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer" : undefined}
                    className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-black/72 transition hover:bg-black/5 hover:text-black"
                  >
                    {item.icon === "cart" && (
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                        <path
                          d="M5 6h15l-1.6 8.2a2 2 0 0 1-2 1.6H8.2a2 2 0 0 1-2-1.6L4.6 3.8H2.8"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                        <circle cx="8.8" cy="20" r="1.2" fill="currentColor" />
                        <circle cx="17" cy="20" r="1.2" fill="currentColor" />
                      </svg>
                    )}
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        type="button"
        ref={buttonRef}
        onClick={openMenu}
        onTouchEnd={() => {
          openMenu();
        }}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white/76 text-black shadow-[0_12px_30px_-22px_rgba(0,0,0,0.7)] transition hover:-translate-y-0.5 hover:bg-white lg:hidden"
        aria-label="Abrir menú"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-5 w-5">
          <rect x="1" y="3" width="14" height="1.5" rx="0.75" fill="currentColor" />
          <rect x="1" y="7" width="14" height="1.5" rx="0.75" fill="currentColor" />
          <rect x="1" y="11" width="14" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
      </button>

      {overlay}
    </>
  );
}
