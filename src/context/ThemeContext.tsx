"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ResolvedTheme = "light" | "dark";
export type ThemePreference = ResolvedTheme | "system";

/* Same key next-themes used, so preferences saved before the swap still work. */
const STORAGE_KEY = "theme";
const THEMES: readonly ThemePreference[] = ["light", "dark"];

/* Layout effect on the client (before paint), plain effect during SSR. */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface ThemeContextValue {
  themes: readonly ThemePreference[];
  theme: ThemePreference;
  resolvedTheme?: ResolvedTheme;
  systemTheme?: ResolvedTheme;
  setTheme: (next: ThemePreference | ((current: ThemePreference) => ThemePreference)) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function matchSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    /* storage unavailable (private mode) — fall back to system */
  }
  return "system";
}

function applyTheme(resolved: ResolvedTheme, disableTransitions: boolean) {
  const root = document.documentElement;
  const clearTransitionLock = disableTransitions
    ? (() => {
        const style = document.createElement("style");
        style.textContent =
          "*,*::before,*::after{transition:none!important;-webkit-transition:none!important}";
        document.head.appendChild(style);
        return () => {
          window.getComputedStyle(document.body);
          style.remove();
        };
      })()
    : null;

  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  clearTransitionLock?.();
}

export interface ThemeProviderProps {
  children: ReactNode;
  /** Skip the colour transition while the class is swapped (default: true). */
  disableTransitionOnChange?: boolean;
}

/**
 * Minimal replacement for next-themes' <ThemeProvider>.
 *
 * The theme bootstrap <script> no longer lives inside the React tree (React 19
 * logs "Encountered a script tag ..." whenever a component-rendered script is
 * created on the client) — see theme-init.ts, rendered by RootLayout outside
 * any component. This provider keeps the rest of the old contract: class
 * attribute on <html>, "theme" storage key, system preference tracking,
 * cross-tab sync and the transition lock while swapping.
 */
export function ThemeProvider({ children, disableTransitionOnChange = true }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [systemPreference, setSystemPreference] = useState<ResolvedTheme>("light");
  const [synced, setSynced] = useState(false);

  /* Resolve the stored choice + OS preference once we are on the client. Until
     then the bootstrap script owns <html class>, so nothing is applied twice. */
  useIsoLayoutEffect(() => {
    setThemeState(readStoredTheme());
    setSystemPreference(matchSystemTheme());
    setSynced(true);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystemPreference(query.matches ? "dark" : "light");
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue === "light" || event.newValue === "dark" || event.newValue === "system") {
        setThemeState(event.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemPreference : theme;

  useIsoLayoutEffect(() => {
    if (!synced) return;
    applyTheme(resolvedTheme, disableTransitionOnChange);
  }, [synced, resolvedTheme, disableTransitionOnChange]);

  const setTheme = useCallback((next: ThemePreference | ((current: ThemePreference) => ThemePreference)) => {
    setThemeState((current) => {
      const value = typeof next === "function" ? next(current) : next;
      try {
        window.localStorage.setItem(STORAGE_KEY, value);
      } catch {
        /* storage unavailable — state still updates for this session */
      }
      return value;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ themes: THEMES, theme, resolvedTheme, systemTheme: systemPreference, setTheme }),
    [theme, resolvedTheme, systemPreference, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside <ThemeProvider>");
  return value;
}
