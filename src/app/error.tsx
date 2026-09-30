"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Branded route error boundary (spec §28).
 * Never shows a stack trace — just what happened, a retry and a way home.
 */
export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[ATLARIS] route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-lg rounded-card border border-border bg-card p-6 shadow-card sm:p-8">
        <span
          aria-hidden="true"
          className="grid size-12 place-items-center rounded-2xl bg-destructive-soft text-destructive"
        >
          <AlertTriangle className="size-6" />
        </span>

        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-destructive">
          Something went wrong
        </p>
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
          This screen could not be rendered
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your data is safe in this browser — nothing was written or lost. Try again, or head back
          to the dashboard.
        </p>

        {error.digest ? (
          <p className="mt-3 rounded-xl border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={reset} icon={<RefreshCw className="size-4" aria-hidden="true" />}>
            Try again
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Home className="size-4" aria-hidden="true" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
