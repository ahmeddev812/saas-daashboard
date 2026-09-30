import { cn } from "@/lib/cn";

export interface SkeletonProps {
  /** CSS width, e.g. "40%", "12rem". */
  width?: string;
  height?: string;
  /** Renders a circle (avatars). */
  rounded?: "sm" | "md" | "lg" | "full";
  className?: string;
}

/**
 * Layout-matching loading placeholder.
 * Always declare an accessible label on the region that contains it.
 */
export function Skeleton({ width = "100%", height = "1rem", rounded = "md", className }: SkeletonProps) {
  const radius =
    rounded === "full" ? "rounded-full" : rounded === "lg" ? "rounded-xl" : rounded === "sm" ? "rounded-md" : "rounded-lg";

  return (
    <span
      aria-hidden="true"
      className={cn("block animate-pulse-soft bg-muted", radius, className)}
      style={{ width, height }}
    />
  );
}

/** Card-shaped skeleton used while a panel loads. */
export function SkeletonCard({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div
      className={cn("rounded-card border border-border bg-card p-5 shadow-card", className)}
      aria-hidden="true"
    >
      <Skeleton width="45%" height="0.9rem" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} width={index === lines - 1 ? "60%" : "100%"} height="0.75rem" />
        ))}
      </div>
    </div>
  );
}

/** Stat-card shaped skeleton grid. */
export function SkeletonStats({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}
      role="status"
      aria-label="Loading metrics"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-card border border-border bg-card p-5 shadow-card">
          <Skeleton width="50%" height="0.8rem" />
          <Skeleton width="70%" height="1.9rem" className="mt-4" />
          <Skeleton width="40%" height="0.7rem" className="mt-4" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
