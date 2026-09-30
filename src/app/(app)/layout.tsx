import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireOnboarding } from "@/components/onboarding/OnboardingGate";

/**
 * Route group for every authenticated application screen.
 *
 * URL shape is unaffected: (app)/dashboard -> /dashboard.
 * Auth and onboarding guards live here so individual pages stay pure.
 */
export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <RequireOnboarding>{children}</RequireOnboarding>
    </AppShell>
  );
}
