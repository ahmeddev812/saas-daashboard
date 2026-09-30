import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Route group for the public authentication screens.
 * Kept outside the authenticated AppShell — no sidebar, no business data.
 */
export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
