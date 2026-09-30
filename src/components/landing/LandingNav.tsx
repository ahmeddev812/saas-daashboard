"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/Button";
import { useMounted } from "@/hooks/useMounted";

/* framer-motion is only used by the Logo mark; load it after hydration so
   the first paint never depends on its chunk being present. */
const Logo = dynamic(
  () => import("@/components/brand/Logo").then((m) => m.Logo),
  {
    ssr: false,
    loading: () => <div className="h-[30px] w-[30px]" aria-hidden="true" />,
  },
);

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
] as const;

/** Public marketing header. Hash links let the browser handle the scroll. */
export function LandingNav() {
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <header className="glass-strong sticky top-0 z-40">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8"
      >
        <Link href="/" className="shrink-0" aria-label="ATLARIS home">
          <Logo size={30} />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            aria-pressed={isDark}
          >
            {isDark ? (
              <Sun className="size-4" aria-hidden="true" />
            ) : (
              <Moon className="size-4" aria-hidden="true" />
            )}
          </button>

          <Link href="/login">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign in
            </Button>
          </Link>

          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      {/* Mobile section shortcuts — no drawer needed on a single-page site. */}
      <div className="border-t border-border md:hidden">
        <ul className="scrollbar-slim mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 py-2">
          {NAV_LINKS.map((link) => (
            <li key={link.href} className="shrink-0">
              <a
                href={link.href}
                className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

export default LandingNav;
