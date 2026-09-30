"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessData } from "@/hooks/useBusinessData";
import { Logo } from "@/components/brand/Logo";
import { Skeleton } from "@/components/ui/Skeleton";

export interface AuthGuardProps {
  children: ReactNode;
  /** Send visitors without a session to `redirectTo`. Defaults to true. */
  requireAuth?: boolean;
  /** Where to send unauthenticated visitors. Defaults to `/login`. */
  redirectTo?: string;
}

/**
 * Client-side access guard for application routes.
 *
 * IMPORTANT: because auth is localStorage-only, this is a UI access
 * mechanism — it is NOT server-side security. Anyone can open dev tools.
 *
 * While auth OR business data are still hydrating we render a branded
 * placeholder — never a redirect — so neither the login page nor protected
 * content flashes before the checks can run. Redirect decisions are made
 * ONLY from hydrated state.
 *
 * This guard checks exactly one thing: is the visitor signed in? Deciding
 * where a signed-in visitor belongs (onboarding vs dashboard) belongs to the
 * pages/gates themselves, so a logged-in user is never bounced around here.
 */
export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/login",
}: AuthGuardProps) {
  const { user, status, hydrated: authHydrated } = useAuth();
  const { hydrated: dataHydrated } = useBusinessData();
  const router = useRouter();
  const pathname = usePathname();

  /** null until we know the session state on this mount; then: no session? */
  const hadNoSessionOnMount = useRef<boolean | null>(null);

  const hydrated = authHydrated && dataHydrated;
  const blocked = hydrated && requireAuth && status !== "authenticated";
  const noSession = hydrated && status !== "authenticated";

  useEffect(() => {
    if (!hydrated || status === "loading" || !requireAuth) return;

    if (hadNoSessionOnMount.current === null) {
      // First time we can decide: this visitor simply has no session
      // (direct visit, refresh or client-side navigation while signed out).
      hadNoSessionOnMount.current = noSession;
      if (noSession) {
        router.replace(`${redirectTo}?next=${encodeURIComponent(pathname)}`);
      }
      return;
    }

    if (noSession && hadNoSessionOnMount.current === false) {
      // Signed-in visit whose session ended while mounted (sign-out). The
      // logout flow navigates to "/" as well — same destination, so the two
      // can never fight and leave a blank screen.
      router.replace("/");
    }
  }, [hydrated, status, requireAuth, noSession, pathname, redirectTo, router]);

  if (!hydrated || status === "loading") {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background"
        role="status"
        aria-live="polite"
      >
        <Logo size={44} animated={false} />
        <div className="w-full max-w-3xl space-y-4 px-6">
          <Skeleton width="40%" height="1.5rem" className="mx-auto" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton height="6rem" />
            <Skeleton height="6rem" />
            <Skeleton height="6rem" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </div>
    );
  }

  if (requireAuth && (blocked || !user)) {
    // The redirect effect above handles navigation; render nothing meanwhile.
    return null;
  }

  return <>{children}</>;
}

export default AuthGuard;
