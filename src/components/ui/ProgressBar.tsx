import { cn } from "@/lib/cn";

export interface ProgressBarProps {
  /** 0–100. Values outside the range are clamped. */
  value: number | null;
  label?: string;
  /** Right-hand caption, e.g. "$4,200 of $10,000". */
  caption?: string;
  tone?: "primary" | "accent" | "success" | "warning" | "destructive";
  size?: "sm" | "md" | "lg";
  /** Hides the visible label but keeps it for screen readers. */
  hideLabel?: boolean;
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

const SIZE_CLASSES: Record<NonNullable<ProgressBarProps["size"]>, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3.5",
};

/**
 * Accessible progress indicator.
 * `value = null` renders an explicit "no target set" state instead of 0%.
 */
export function ProgressBar({
  value,
  label,
  caption,
  tone = "primary",
  size = "md",
  hideLabel = false,
  className,
}: ProgressBarProps) {
  const hasValue = value !== null && Number.isFinite(value);
  const clamped = hasValue ? Math.max(0, Math.min(value, 100)) : 0;
  const display = hasValue ? `${Math.round(clamped)}%` : "—";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label || caption ? (
        <div className="flex items-baseline justify-between gap-3">
          {label ? (
            <span className={cn("text-sm font-medium text-foreground", hideLabel && "sr-only")}>
              {label}
            </span>
          ) : (
            <span />
          )}
          <span className="text-sm tabular-nums text-muted-foreground">
            {caption ? <span className="mr-2">{caption}</span> : null}
            <span className="font-semibold text-foreground">{display}</span>
          </span>
        </div>
      ) : null}

      <div
        role="progressbar"
        aria-valuenow={hasValue ? Math.round(clamped) : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={hasValue ? `${Math.round(clamped)} percent` : "No target set"}
        aria-label={label ?? "Progress"}
        className={cn("w-full overflow-hidden rounded-full bg-muted", SIZE_CLASSES[size])}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            hasValue ? TONE_CLASSES[tone] : "bg-border",
          )}
          style={{ width: hasValue ? `${clamped}%` : "0%" }}
        />
      </div>

      {!hasValue ? (
        <p className="text-xs text-muted-foreground">No target set yet.</p>
      ) : null}
    </div>
  );
}

export default ProgressBar;
