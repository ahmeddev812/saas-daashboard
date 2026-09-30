import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "destructive"
  | "info";

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  /** Adds a small filled dot before the label. */
  dot?: boolean;
  className?: string;
  /** Extra context for screen readers, e.g. "Order status:". */
  srPrefix?: string;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary-soft text-primary border-primary/30",
  accent: "bg-accent-soft text-accent-strong dark:text-accent border-accent/40",
  success: "bg-success-soft text-success border-success/35",
  warning: "bg-warning-soft text-warning border-warning/45",
  destructive: "bg-destructive-soft text-destructive border-destructive/35",
  info: "bg-info-soft text-info border-info/35",
};

/**
 * Semantic status chip.
 * Tone is ALWAYS paired with a text label — colour is never the only signal.
 */
export function Badge({ children, tone = "neutral", dot = false, className, srPrefix }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {srPrefix ? <span className="sr-only">{srPrefix} </span> : null}
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export default Badge;
