"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessData } from "@/hooks/useBusinessData";
import { formatDate } from "@/lib/dates";

/** Millisecond boundaries for the four greeting windows. */
const GREETINGS = [
  { until: 5, label: "Good evening" },
  { until: 12, label: "Good morning" },
  { until: 18, label: "Good afternoon" },
  { until: 24, label: "Good evening" },
] as const;

/** Hour-of-day → greeting. Pure so it can be tested and server-rendered. */
export function greetingForHour(hour: number): string {
  const clamped = Math.min(Math.max(hour, 0), 23);
  return GREETINGS.find((entry) => clamped < entry.until)?.label ?? "Hello";
}

/**
 * Time-based dashboard headline: greeting, date, business + user context.
 * Every value comes from BusinessProfile / AuthUser — nothing is hard-coded.
 */
export function DashboardGreeting() {
  const { user } = useAuth();
  const { business, hydrated } = useBusinessData();

  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const businessName = business.name.trim() || "your workspace";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {formatDate(new Date(), { style: "long" })}
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {hydrated ? (
            <>
              Here&apos;s what&apos;s happening at{" "}
              <span className="font-medium text-foreground">{businessName}</span>.
            </>
          ) : (
            "Loading your workspace…"
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          href="/reports"
          className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          View reports
        </Link>
        <Link
          href="/settings"
          className="inline-flex h-9 items-center rounded-lg gradient-primary px-3.5 text-sm font-medium text-primary-foreground shadow-glow transition-all hover:brightness-110"
        >
          Workspace settings
        </Link>
      </div>
    </div>
  );
}

export default DashboardGreeting;
