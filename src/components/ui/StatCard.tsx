"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StatCardProps {
  label: string;
  /** Pre-formatted display value. Rendered as-is. */
  value: string;
  /** Numeric value used by the count-up animation. */
  numericValue?: number;
  /** Formats the animating numeric value. Required for the count-up to show. */
  formatValue?: (value: number) => string;
  /** 0–100 trend percentage. `null` hides the trend row entirely. */
  trend?: number | null;
  /** Contextual text, e.g. "vs last 30 days". */
  trendLabel?: string;
  /** Sets trend colour direction explicitly (defaults to sign of trend). */
  trendGood?: boolean;
  icon?: LucideIcon;
  /** Small coloured tile behind the icon. */
  iconTone?: "primary" | "accent" | "success" | "warning" | "info" | "neutral";
  /** Rendered under the value (goal progress, sparkline, notes). */
  footer?: ReactNode;
  /** Shown instead of the value when there is no data. */
  emptyLabel?: string;
  className?: string;
}

const ICON_TONES: Record<NonNullable<StatCardProps["iconTone"]>, string> = {
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent-strong dark:text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  neutral: "bg-muted text-muted-foreground",
};

function useCountUp(target: number | undefined, duration = 700): number {
  const [display, setDisplay] = useState(target ?? 0);
  const fromRef = useRef(target ?? 0);

  useEffect(() => {
    if (target === undefined || !Number.isFinite(target)) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const from = fromRef.current;
    const delta = target - from;

    // Snap immediately (no animation) when motion is reduced or the value
    // did not actually change. Deferred to a microtask so the effect body
    // never cascades a synchronous render.
    if (reduced || Math.abs(delta) < 0.0001) {
      queueMicrotask(() => {
        fromRef.current = target;
        setDisplay(target);
      });
      return;
    }

    let frame = 0;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + delta * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
        setDisplay(target);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return display;
}

/**
 * Headline metric tile.
 * Value changes animate smoothly and respect prefers-reduced-motion.
 */
export function StatCard({
  label,
  value,
  numericValue,
  formatValue,
  trend = null,
  trendLabel,
  trendGood,
  icon: Icon,
  iconTone = "primary",
  footer,
  emptyLabel,
  className,
}: StatCardProps) {
  const animated = useCountUp(numericValue);
  const isEmpty = value === "" || value === "—" || (numericValue === undefined && value === "0");

  // Prefer the animating value when a formatter is supplied.
  const displayValue =
    numericValue !== undefined && formatValue ? formatValue(animated) : value;

  const showTrend = trend !== null && Number.isFinite(trend);
  const direction = trend === null || !Number.isFinite(trend) ? 0 : Math.sign(trend);
  const isGood = trendGood ?? direction > 0;
  const TrendIcon = direction > 0 ? ArrowUpRight : direction < 0 ? ArrowDownRight : Minus;

  return (
    <article
      className={cn(
        "relative flex flex-col gap-3 rounded-card border border-border bg-card p-5 shadow-card",
        "transition-shadow hover:shadow-card-hover",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl",
              ICON_TONES[iconTone],
            )}
            aria-hidden="true"
          >
            <Icon className="size-4.5" />
          </span>
        ) : null}
      </div>

      <div>
        {/* The rolling counter is decorative; assistive tech gets one stable string. */}
        <p aria-hidden="true" className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
          {isEmpty && emptyLabel ? (
            <span className="text-lg font-medium text-muted-foreground">{emptyLabel}</span>
          ) : (
            displayValue
          )}
        </p>
        <span className="sr-only">
          {isEmpty && emptyLabel ? `${label}: no data yet` : `${label}: ${value}`}
        </span>
      </div>

      {showTrend ? (
        <p className="flex flex-wrap items-center gap-1.5 text-sm">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
              isGood ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive",
            )}
            aria-hidden="true"
          >
            <TrendIcon className="size-3.5" />
            {Math.abs(trend as number).toFixed(1)}%
          </span>
          <span className="text-muted-foreground" aria-hidden="true">
            {trendLabel ?? "vs previous period"}
          </span>
          <span className="sr-only">
            {isGood ? "Up" : "Down"} {Math.abs(trend as number).toFixed(1)} percent{" "}
            {trendLabel ?? "versus the previous period"}
          </span>
        </p>
      ) : null}

      {footer ? <div className="mt-auto pt-1">{footer}</div> : null}
    </article>
  );
}

export default StatCard;
