"use client";

/**
 * App-wide provider stack.
 *
 *   ThemeProvider  (own implementation, system default)
 *     └─ MotionConfig  (framer-motion reducedMotion="user")
 *         └─ ToastProvider
 *             └─ AuthProvider          (kept separate from business state)
 *                 └─ BusinessDataProvider
 *
 * Order matters: business data can react to auth, and toasts are available
 * to everything below. MotionConfig lets framer honour the OS motion
 * preference without any component reading matchMedia during render, which
 * keeps server and client markup identical (no hydration mismatch).
 */

import { useEffect, useRef, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";

import { AuthProvider } from "@/context/AuthContext";
import { BusinessDataProvider, useBusinessData } from "@/context/BusinessDataProvider";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { ToastStack } from "@/components/ui/Toast";

/**
 * Keeps the document theme in sync with the persisted `settings.theme` value
 * so the choice made in Settings/onboarding survives a reload.
 *
 * Only signed-in workspaces are authoritative over the stored theme — a visitor
 * who flips the theme on the landing page keeps it. `appliedRef` makes the
 * one-shot sync explicit: without it every user toggle would be reverted to
 * `settings.theme` as soon as the effect re-ran.
 */
function ThemeBridge() {
  const { settings, hydrated } = useBusinessData();
  const { status } = useAuth();
  const { setTheme } = useTheme();
  const appliedRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!hydrated || status !== "authenticated") return;
    if (appliedRef.current === settings.theme) return;
    appliedRef.current = settings.theme;
    setTheme(settings.theme);
  }, [hydrated, status, settings.theme, setTheme]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <ToastStack />
          <AuthProvider>
            <BusinessDataProvider>
              <ThemeBridge />
              {children}
            </BusinessDataProvider>
          </AuthProvider>
        </ToastProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}

export default Providers;
