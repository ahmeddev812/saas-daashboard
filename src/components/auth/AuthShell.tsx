"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";

const VALUE_POINTS = [
  {
    title: "Live metrics, not exports",
    description: "MRR, churn, LTV and cohorts recalculate the moment a record changes.",
  },
  {
    title: "Your data stays here",
    description: "Records are written to this browser only — nothing is uploaded anywhere.",
  },
  {
    title: "One source of truth",
    description: "Customers, products and orders feed every screen in the dashboard.",
  },
] as const;

export interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  /** Rendered under the form card (secondary links, demo hints…). */
  footer?: ReactNode;
  /** Highlights the matching panel heading. */
  active?: "login" | "signup";
  className?: string;
}

/**
 * Shared split-screen shell for /login and /signup.
 *
 * Left: brand + value proposition (decorative, hidden below lg).
 * Right: the actual form card.
 */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  active,
  className,
}: AuthShellProps) {
  return (
    <div className={cn("grid min-h-dvh w-full lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]", className)}>
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden border-r border-border bg-subtle/60 p-10 lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-[110px]" />
          <div className="absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-accent/20 blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,transparent,transparent_60%)]" />
        </div>

        <Link href="/" aria-label="ATLARIS home" className="w-fit">
          <Logo size={34} />
        </Link>

        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">ATLARIS</p>
          <p className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground">
            Carry your business. <span className="text-gradient">See everything.</span>
          </p>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground">
            A local-first analytics workspace for teams who want the whole picture
            without a data pipeline.
          </p>

          <ul className="mt-8 space-y-5">
            {VALUE_POINTS.map((point) => (
              <li key={point.title} className="flex gap-3.5">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{point.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {point.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          Demo application — authentication is stored locally in your browser and is
          not secure. Do not use a real password.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-dvh flex-col justify-center px-5 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to home
          </Link>

          <div className="mb-7 lg:hidden">
            <Link href="/" aria-label="ATLARIS home" className="w-fit">
              <Logo size={30} />
            </Link>
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}

          {/* Panel switcher for small screens where the brand panel is hidden */}
          <nav aria-label="Authentication" className="mt-8 border-t border-border pt-6">
            <ul className="flex justify-center gap-2">
              <li>
                <Link
                  href="/login"
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                    active === "login"
                      ? "bg-primary-soft text-primary"
                      : "text-muted-foreground hover:bg-subtle hover:text-foreground",
                  )}
                  aria-current={active === "login" ? "page" : undefined}
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                    active === "signup"
                      ? "bg-primary-soft text-primary"
                      : "text-muted-foreground hover:bg-subtle hover:text-foreground",
                  )}
                  aria-current={active === "signup" ? "page" : undefined}
                >
                  Create account
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </main>
    </div>
  );
}

export default AuthShell;
