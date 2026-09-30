import type { Metadata } from "next";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Logo } from "@/components/brand/Logo";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Set up your workspace",
  description: "Four quick steps to configure your ATLARIS workspace.",
  alternates: { canonical: "/onboarding" },
  robots: { index: false, follow: false },
};

function WizardFrame() {
  return (
    <OnboardingGate>
      <div className="min-h-dvh bg-background">
        <header className="border-b border-border">
          <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-5 sm:px-8">
            <Link href="/" aria-label="ATLARIS home">
              <Logo size={30} animated={false} />
            </Link>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Setup
            </span>
          </div>
        </header>

        <main id="main-content" className="px-5 py-10 sm:px-8 sm:py-14">
          <OnboardingWizard />
        </main>
      </div>
    </OnboardingGate>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard redirectTo="/login">
      <WizardFrame />
    </AuthGuard>
  );
}
