"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Compass,
  LayoutGrid,
  CalendarDays,
  Star,
  Plus,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { AuraBrand } from "./brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Explore", icon: Compass },
  { href: "/vault", label: "Vault", icon: LayoutGrid },
  { href: "/capture", label: "Capture", icon: Plus, center: true },
  { href: "/plans", label: "Plans", icon: CalendarDays },
  { href: "/premium", label: "Premium", icon: Star },
];

export function AppShell({
  children,
  live,
}: {
  children: React.ReactNode;
  live?: boolean;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header
        className="sticky top-0 z-40 border-b border-[var(--line-soft)] bg-[var(--bg)]/90 backdrop-blur-md"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <AuraBrand />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV.filter((n) => !n.center).map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/" || pathname.startsWith("/alerts")
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "focus-ring flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition",
                    active
                      ? "bg-[var(--ink)] text-white shadow-sm"
                      : "text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--ink)]",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={active ? 2.25 : 2} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/capture"
              className="focus-ring ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ink)] text-white shadow-sm transition hover:bg-black"
              aria-label="Capture"
            >
              <Plus className="h-5 w-5" />
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {live ? (
              <span className="hidden items-center gap-1.5 rounded-full bg-[var(--ink)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white sm:inline-flex">
                <span className="live-dot" /> Live
              </span>
            ) : null}
            <Link
              href="/concierge"
              className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white shadow-sm transition hover:border-[var(--line-strong)] hover:bg-[var(--bg)]"
              aria-label="Aura concierge chat"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
            {session?.user ? (
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/" })}
                className="focus-ring hidden h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3.5 text-xs text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--ink)] md:inline-flex"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            ) : (
              <Link
                href="/settings"
                className="hidden text-[11px] uppercase tracking-[0.16em] text-[var(--muted)] transition hover:text-[var(--ink)] md:inline"
              >
                Settings
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="aura-shell mx-auto max-w-6xl px-4 md:px-6">{children}</div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "var(--safe-bottom)" }}
        aria-label="Mobile"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 items-end px-1 pb-1.5 pt-1.5">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/alerts")
                : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            if (item.center) {
              return (
                <li key={item.href} className="flex justify-center">
                  <Link
                    href={item.href}
                    className="focus-ring -mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ink)] text-white shadow-lg shadow-black/20 transition hover:bg-black"
                    aria-label="Capture"
                  >
                    <Plus className="h-6 w-6" />
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "focus-ring flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] text-[10px] font-medium uppercase tracking-[0.14em] transition",
                    active ? "text-[var(--ink)]" : "text-[var(--muted)]",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "stroke-[2.25]")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
