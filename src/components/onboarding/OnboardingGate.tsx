"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessData } from "@/hooks/useBusinessData";

/**
 * Redirects to /onboarding for signed-in users who have not finished setup.
 *
 * UI-only access control (localStorage auth) — not server-side security.
 *
 * Both gates below render inside <AuthGuard>, which is the single owner of
 * the "waiting for hydration" screen: by the time these run, auth AND
 * business data are already hydrated. They therefore never show a loading
 * screen of their own — only a redirect or the children.
 */
export function RequireOnboarding({ children }: { children: ReactNode }) {
  const { status, hydrated: authHydrated } = useAuth();
  const { business, hydrated: dataHydrated } = useBusinessData();
  const router = useRouter();

  const ready = authHydrated && dataHydrated && status === "authenticated";
  const needsOnboarding = ready && !business.onboardingDone;

  useEffect(() => {
    if (!needsOnboarding) return;
    router.replace("/onboarding");
  }, [needsOnboarding, router]);

  // Unreachable while wrapped by AuthGuard; render nothing rather than
  // flashing app content built from un-hydrated defaults.
  if (!ready || needsOnboarding) return null;

  return <>{children}</>;
}

/**
 * Keeps finished users off /onboarding. Renders the wizard only when the
 * session and business profile have both hydrated.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { status, hydrated: authHydrated } = useAuth();
  const { business, hydrated: dataHydrated } = useBusinessData();
  const router = useRouter();

  const ready = authHydrated && dataHydrated && status === "authenticated";
  const alreadyDone = ready && business.onboardingDone;

  useEffect(() => {
    if (!alreadyDone) return;
    router.replace("/dashboard");
  }, [alreadyDone, router]);

  if (!ready || alreadyDone) return null;

  return <>{children}</>;
}
