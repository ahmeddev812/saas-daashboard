import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  /** Lucide icon component. Defaults to Inbox. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Primary call to action. */
  action?: ReactNode;
  /** Secondary link/button. */
  secondaryAction?: ReactNode;
  /** `compact` fits inside a card; `page` fills a route. */
  size?: "compact" | "page";
  className?: string;
}

/**
 * Shown whenever a list/chart has no data.
 * Always explains WHY it is empty and offers a next step.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "compact",
  className,
}: EmptyStateProps) {
  const isPage = size === "page";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isPage ? "rounded-card border border-dashed border-border px-6 py-16" : "px-4 py-10",
        className,
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-2xl bg-primary-soft text-primary",
          isPage ? "size-16" : "size-12",
        )}
        aria-hidden="true"
      >
        {icon ?? <Inbox className={isPage ? "size-7" : "size-5"} />}
      </span>

      <h3 className={cn("mt-4 font-semibold text-foreground", isPage ? "text-lg" : "text-base")}>
        {title}
      </h3>

      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}

      {action || secondaryAction ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div>
      ) : null}

      {secondaryAction ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}

export default EmptyState;
