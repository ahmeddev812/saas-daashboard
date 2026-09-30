"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessData } from "@/hooks/useBusinessData";
import { readBusiness } from "@/lib/storage";

/** Only same-origin, absolute-path targets are honoured — never `//evil.com`. */
export function safeNextTarget(raw: string | null | undefined, fallback: string): string {
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (raw.startsWith("/login") || raw.startsWith("/signup")) return fallback;
  return raw;
}

/** Reads `?next=` from the current URL. Client-only; never called during SSR. */
function readNextParam(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.search).get("next");
  } catch {
    return null;
  }
}

/**
 * Post-auth destination.
 *
 * Order matters (one owner for the onboarding/dashboard decision):
 *   1. unfinished workspace  -> /onboarding (even when `?next=` is present)
 *   2. `?next=` deep link    -> that path
 *   3. otherwise             -> /dashboard
 *
 * Reads localStorage directly, so it never depends on a provider having
 * hydrated yet. Uses `router.replace` semantics at every call site so the
 * back button cannot replay the login screen.
 */
export function nextDestination(): string {
  if (readBusiness()?.onboardingDone !== true) return "/onboarding";
  return safeNextTarget(readNextParam(), "/dashboard");
}

/**
 * Sends an already-signed-in visitor away from /login and /signup.
 *
 * Renders `null` at all times — this is a redirect side-effect only.
 */
export function RedirectIfAuthenticated() {
  const { status, hydrated } = useAuth();
  const { hydrated: dataHydrated } = useBusinessData();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated || !dataHydrated || status !== "authenticated") return;
    router.replace(nextDestination());
  }, [hydrated, dataHydrated, status, router]);

  return null;
}

export default RedirectIfAuthenticated;
