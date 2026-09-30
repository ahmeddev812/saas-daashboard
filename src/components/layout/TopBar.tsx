"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Moon, Search, Sun, UserRound } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessActions } from "@/hooks/useBusinessData";
import { useToast } from "@/context/ToastContext";
import { useChangedKey, useMounted } from "@/hooks/useMounted";

/* framer-motion is only used by the Logo mark; loaded after hydration so the
   first paint never depends on its chunk being present. */
const Logo = dynamic(
  () => import("@/components/brand/Logo").then((m) => m.Logo),
  {
    ssr: false,
    loading: () => <div className="h-[30px] w-[30px]" aria-hidden="true" />,
  },
);

/**
 * Top application bar:
 *   mobile: menu toggle + logo + theme
 *   desktop: logo + search trigger (⌘K) + theme + account menu
 */
export function TopBar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { updateSettings } = useBusinessActions();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const mounted = useMounted();

  // Close the account menu on navigation.
  useChangedKey(pathname, () => setMenuOpen(false));

  // Persist through settings.theme so the ThemeBridge keeps it across reloads.
  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
    updateSettings({ theme: next });
    toast.info(`${next === "dark" ? "Dark" : "Light"} theme enabled`);
  }, [resolvedTheme, setTheme, updateSettings, toast]);

  const handleLogout = useCallback(() => {
    logout();
    toast.success("Signed out", "Your local data stays in this browser.");
    router.replace("/");
  }, [logout, toast, router]);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg print:hidden">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="grid size-10 place-items-center rounded-xl text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <Link
          href="/dashboard"
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Logo size={30} />
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Search trigger (opens the ⌘K palette) */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("atlaris:open-search"));
            }}
            aria-label="Open global search"
            className="hidden items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-ring/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:inline-flex"
          >
            <Search className="size-4" aria-hidden="true" />
            <span>Search</span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
              {typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform ?? "")
                ? "⌘K"
                : "Ctrl K"}
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("atlaris:open-search"))}
            aria-label="Open global search"
            className="grid size-10 place-items-center rounded-xl text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:hidden"
          >
            <Search className="size-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            aria-pressed={isDark}
            className="grid size-10 place-items-center rounded-xl text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {isDark ? (
              <Sun className="size-5" aria-hidden="true" />
            ) : (
              <Moon className="size-5" aria-hidden="true" />
            )}
          </button>

          {/* Account menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
              className="grid size-10 place-items-center rounded-xl border border-border bg-muted text-foreground transition-colors hover:border-ring/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <UserRound className="size-5" aria-hidden="true" />
            </button>

            {menuOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  aria-label="Close account menu"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-60 animate-fade-in rounded-xl border border-border bg-popover p-1.5 shadow-card"
                >
                  <div className="border-b border-border px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user?.name ?? "Signed out"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>

                  <Link
                    href="/settings"
                    role="menuitem"
                    className="mt-1.5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <UserRound className="size-4" aria-hidden="true" />
                    Profile & settings
                  </Link>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              </>
            ) : null}

            <span className="sr-only">
              Current theme: {theme ?? "system"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
