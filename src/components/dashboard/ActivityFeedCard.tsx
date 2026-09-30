"use client";

import Link from "next/link";
import { Activity as ActivityIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useBusinessData } from "@/hooks/useBusinessData";
import { formatRelative } from "@/lib/dates";
import type { ActivityAction } from "@/types/business";

const ACTION_TONE: Record<ActivityAction, string> = {
  create: "bg-success-soft text-success",
  update: "bg-info-soft text-info",
  delete: "bg-destructive-soft text-destructive",
  status_change: "bg-warning-soft text-warning",
  login: "bg-primary-soft text-primary",
  logout: "bg-muted text-muted-foreground",
  import: "bg-accent-soft text-accent-strong dark:text-accent",
  export: "bg-accent-soft text-accent-strong dark:text-accent",
  reset: "bg-destructive-soft text-destructive",
  invite: "bg-primary-soft text-primary",
};

const ACTION_LABEL: Record<ActivityAction, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  status_change: "Status",
  login: "Signed in",
  logout: "Signed out",
  import: "Imported",
  export: "Exported",
  reset: "Reset",
  invite: "Invited",
};

/** Latest 8 activity entries, newest first. */
export function ActivityFeedCard() {
  const { activities } = useBusinessData();

  const recent = [...activities]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 8);

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Activity"
        description="What changed in this workspace"
        action={
          <Link
            href="/settings"
            className="text-xs font-medium text-primary transition-colors hover:underline"
          >
            Full log
          </Link>
        }
      />

      <CardContent className="min-w-0 flex-1">
        {recent.length === 0 ? (
          <EmptyState
            icon={<ActivityIcon className="size-5" />}
            title="Nothing has happened yet"
            description="Create a customer, product or order and the timeline will start filling in."
          />
        ) : (
          <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">
            {recent.map((entry) => (
              <li key={entry.id} className="relative flex gap-3 pl-0">
                <span
                  aria-hidden="true"
                  className={`mt-1.5 size-3.5 shrink-0 rounded-full ring-4 ring-card ${ACTION_TONE[entry.action]}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {ACTION_LABEL[entry.action]}
                    </span>
                    <span className="text-xs text-muted-foreground">{entry.actor}</span>
                  </div>
                  <p className="mt-1 text-sm leading-snug text-foreground">{entry.description}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <time dateTime={entry.timestamp}>{formatRelative(entry.timestamp)}</time>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityFeedCard;
