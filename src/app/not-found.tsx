import Link from "next/link";
import { Compass, LayoutDashboard } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Branded 404 (spec §28).
 * Rendered inside the root layout for any unknown route, including /goals
 * style legacy links and mistyped URLs.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-xl">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-primary">
          404 · Page not found
        </p>

        <div className="rounded-card border border-border bg-card shadow-card">
          <EmptyState
            size="page"
            icon={<Compass className="size-7" />}
            title="That page does not exist"
            description="The link may be out of date, or the address has a typo. Everything else in your workspace is still where you left it."
            action={
              <Link href="/">
                <span className="inline-flex h-10 items-center justify-center rounded-xl gradient-primary px-5 text-sm font-medium text-primary-foreground shadow-glow transition-all hover:brightness-110">
                  Back to home
                </span>
              </Link>
            }
            secondaryAction={
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <LayoutDashboard className="size-4" aria-hidden="true" />
                Open dashboard
              </Link>
            }
          />
        </div>
      </div>
    </main>
  );
}
