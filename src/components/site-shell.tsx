import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { logoutAction } from "@/app/acceso/actions";
import { AuthModalButton } from "@/components/auth/auth-modal";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { MobileMenu } from "@/components/mobile-menu";
import { CartButton } from "@/components/cart-button";
import type { NavigationItem, SiteChromeData } from "@/lib/wordpress";

function NavItem({
  item,
  className,
}: {
  item: NavigationItem;
  className?: string;
}) {
  const classes =
    className ??
    "rounded-full px-3 py-2 text-sm font-medium text-black/65 transition hover:bg-black/5 hover:text-black";

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={classes}>
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={classes}>
      {item.label}
    </Link>
  );
}

const COMMUNITY_SUBMENU = [
  { label: "Eventos", categorySlug: "eventos", fallbackHref: "/categorias/eventos" },
  { label: "Trabajos", categorySlug: "trabajos", fallbackHref: "/trabajos" },
  {
    label: "Trámites",
    categorySlug: "tramites-en-serbia",
    fallbackHref: "/categorias/tramites-en-serbia",
  },
] as const;

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function shouldHideMainNavItem(item: NavigationItem): boolean {
  const label = normalizeLabel(item.label);

  return ["pagina de ejemplo", "carrito", "eventos", "trabajos", "tramites en serbia"].includes(label);
}

function getCommunityHref(chrome: SiteChromeData, categorySlug: string, fallbackHref: string): string {
  if (categorySlug === "trabajos") {
    return "/trabajos";
  }

  const category = chrome.categories.find((entry) => entry.slug === categorySlug);
  return category ? `/categorias/${category.slug}` : fallbackHref;
}

function getMainNavigation(chrome: SiteChromeData): NavigationItem[] {
  const seenLabels = new Set<string>();

  return chrome.navigation.filter((item) => {
    const label = normalizeLabel(item.label);

    if (shouldHideMainNavItem(item) || seenLabels.has(label)) {
      return false;
    }

    seenLabels.add(label);
    return true;
  });
}

function CommunityNavItem({ chrome }: { chrome: SiteChromeData }) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-black/65 transition hover:bg-black/5 hover:text-black focus:bg-black/5 focus:text-black focus:outline-none"
        aria-haspopup="menu"
      >
        Comunidad
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5 transition duration-300 group-hover:rotate-180 group-focus-within:rotate-180"
        >
          <path
            d="M4 6l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </button>

      <div className="pointer-events-none absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 translate-y-2 px-1 pt-2 opacity-0 transition duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="origin-top scale-95 rounded-3xl border border-black/8 bg-[rgba(255,252,244,0.98)] p-2 shadow-[0_24px_70px_-35px_rgba(0,0,0,0.55)] backdrop-blur-xl transition duration-200 group-hover:scale-100 group-focus-within:scale-100">
          {COMMUNITY_SUBMENU.map((item) => (
            <Link
              key={item.label}
              href={getCommunityHref(chrome, item.categorySlug, item.fallbackHref)}
              className="block rounded-2xl px-4 py-3 text-sm font-semibold text-black/68 transition hover:bg-black/5 hover:text-black"
            >
              {item.label}
            </Link>
          ))}
        </div>
    </div>
    </div>
  );
}

function CartButtonPlaceholder() {
  return (
    <Link
      href="/paginas/carrito"
      className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white/76 text-black shadow-[0_12px_30px_-22px_rgba(0,0,0,0.7)] transition hover:-translate-y-0.5 hover:bg-white"
      aria-label="Abrir carrito"
      title="Carrito"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
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
    </Link>
  );
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function UserAccessButton({
  avatarUrl,
  currentUser,
}: {
  avatarUrl?: string;
  currentUser: SessionUser | null;
}) {
  if (!currentUser) {
    return <AuthModalButton />;
  }

  return (
    <details className="group relative">
      <summary
        className="inline-flex cursor-pointer list-none items-center gap-3 rounded-full border border-black/10 bg-white/76 px-2 py-2 text-black shadow-[0_12px_30px_-22px_rgba(0,0,0,0.7)] transition hover:-translate-y-0.5 hover:bg-white focus:bg-white focus:outline-none [&::-webkit-details-marker]:hidden"
        aria-label="Abrir menú de perfil"
      >
        <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-black/8 bg-[rgba(209,91,31,0.1)] text-[var(--color-accent)]">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`Foto de perfil de ${currentUser.name}`}
              fill
              className="object-cover object-center"
              sizes="40px"
            />
          ) : (
            <span className="text-xs font-semibold uppercase">
              {getInitials(currentUser.name)}
            </span>
          )}
        </span>
        <span className="hidden pr-2 text-left sm:block">
          <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Mi cuenta
          </span>
          <span className="block max-w-[9rem] truncate text-sm font-semibold text-black">
            {currentUser.name}
          </span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="mr-1 hidden h-3.5 w-3.5 text-black/45 transition duration-300 group-open:rotate-180 sm:block"
        >
          <path
            d="M4 6l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </summary>

      <div className="absolute right-0 top-full z-50 w-56 px-1 pt-2">
        <div className="origin-top-right rounded-3xl border border-black/8 bg-[rgba(255,252,244,0.98)] p-2 shadow-[0_24px_70px_-35px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <Link
            href="/cuenta"
            className="block rounded-2xl px-4 py-3 text-sm font-semibold text-black/72 transition hover:bg-black/5 hover:text-black"
          >
            Mi cuenta
          </Link>
          <form action={logoutAction} className="border-t border-black/8 pt-2">
            <button
              type="submit"
              className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-black/72 transition hover:bg-black/5 hover:text-black"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}

async function UserAccessSlot() {
  const currentUser = await getSessionUser();

  return <UserAccessButton avatarUrl={currentUser ? `/api/profile-photo/${currentUser.id}` : undefined} currentUser={currentUser} />;
}

export function SiteShell({
  chrome,
  children,
}: {
  chrome: SiteChromeData;
  children: ReactNode;
}) {
  const mainNavigation = getMainNavigation(chrome);

  // Pre-compute mobile menu items as plain data for the client component
  const mobileMenuItems: Array<
    | { type: "community"; label: string; links: { label: string; href: string }[] }
    | { type: "link"; label: string; href: string; external?: boolean; icon?: "cart" }
  > = [];

  for (const item of mainNavigation) {
    if (normalizeLabel(item.label) === "comunidad") {
      mobileMenuItems.push({
        type: "community",
        label: "Comunidad",
        links: COMMUNITY_SUBMENU.map((sub) => ({
          label: sub.label,
          href: getCommunityHref(chrome, sub.categorySlug, sub.fallbackHref),
        })),
      });
    } else if (normalizeLabel(item.label) === "tienda") {
      mobileMenuItems.push({
        type: "link",
        label: item.label,
        href: item.href,
        external: item.external,
        icon: "cart",
      });
    } else {
      mobileMenuItems.push({
        type: "link",
        label: item.label,
        href: item.href,
        external: item.external,
      });
    }
  }

  // Add hardcoded items not in WordPress nav
  mobileMenuItems.push({
    type: "link",
    label: "Aprender Serbio",
    href: "/serbio",
  });

  return (
    <div className="relative isolate min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="orb orb-three" />
        <div className="grid-fade" />
      </div>

      <header className="sticky top-0 z-50 border-b border-black/6 bg-[rgba(245,239,226,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 md:gap-4 md:px-8 md:py-4">
          <Link href="/" className="flex shrink-0 items-center gap-1.5 md:gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_12px_30px_-18px_rgba(0,0,0,0.8)] md:h-12 md:w-12">
              <Image
                src="/logo.png"
                alt=""
                width={48}
                height={48}
                priority
                className="h-auto w-auto max-h-8 max-w-8 object-contain md:max-h-11 md:max-w-11"
              />
            </span>
            <div className="min-w-0">
              <p className="whitespace-nowrap text-[0.8rem] font-semibold uppercase tracking-[0.03em] md:text-sm md:tracking-[0.24em]">
                <span className="text-blue-700">Serbia</span>{" "}
                <span className="text-red-600">Latina</span>
              </p>
              <p className="whitespace-nowrap text-[0.58rem] leading-tight text-black/65 md:text-sm">
                Comunidad hispana en los Balcanes
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {mainNavigation.map((item) =>
              normalizeLabel(item.label) === "comunidad" ? (
                <CommunityNavItem key={`${item.label}-${item.href}`} chrome={chrome} />
              ) : normalizeLabel(item.label) === "tienda" ? (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-black/65 transition hover:bg-black/5 hover:text-black"
                >
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
                  {item.label}
                </Link>
              ) : (
                <NavItem key={`${item.label}-${item.href}`} item={item} />
              ),
            )}
            <Link
              href="/serbio"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-black/65 transition hover:bg-amber-50 hover:text-amber-800"
            >
              Aprender Serbio 🇷🇸
            </Link>
          </nav>

          <div className="flex items-center gap-1.5 md:gap-3">
            <CartButton />

            <Suspense fallback={<UserAccessButton currentUser={null} />}>
              <UserAccessSlot />
            </Suspense>

            <MobileMenu items={mobileMenuItems} />
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mx-auto mt-10 max-w-7xl px-4 pb-8 md:px-8">
        <div className="border-t border-black/8 pt-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-sm text-black/55">
              <p className="font-semibold text-black/75">{chrome.site.name}</p>
              <p>Aprende serbio, revista y progreso para hispanohablantes en Serbia.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/serbio"
                className="rounded-full border border-black/8 bg-white/70 px-3 py-1.5 text-black/65 transition hover:bg-white hover:text-black"
              >
                Serbio
              </Link>
              <Link
                href="/serbio/revista"
                className="rounded-full border border-black/8 bg-white/70 px-3 py-1.5 text-black/65 transition hover:bg-white hover:text-black"
              >
                Revista
              </Link>
              <Link
                href="/serbio/progreso"
                className="rounded-full border border-black/8 bg-white/70 px-3 py-1.5 text-black/65 transition hover:bg-white hover:text-black"
              >
                Progreso
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
