"use client";

import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/cn";
import type { SeriesPoint } from "@/lib/calculations";

export interface MetricChartProps {
  data: SeriesPoint[];
  /** Formats the tooltip value. Defaults to a plain number. */
  formatValue?: (value: number) => string;
  /** X-axis tick formatter. Defaults to showing the raw key. */
  formatKey?: (key: string) => string;
  height?: number;
  /** Positive → green delta in the tooltip, negative → red. */
  className?: string;
  ariaLabel: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: { key?: string; value?: number } }>;
}

/**
 * Responsive area/line chart used by the dashboard and revenue pages.
 *
 * The rendered SVG is decorative — the same numbers are exposed to assistive
 * tech through `aria-label` on the wrapper plus the visible stat cards, so the
 * chart itself is `aria-hidden`.
 */
export function MetricChart({
  data,
  formatValue,
  formatKey,
  height = 240,
  className,
  ariaLabel,
}: MetricChartProps) {
  const gradientId = useId();

  const valueFormatter = useMemo(
    () => formatValue ?? ((value: number) => value.toLocaleString()),
    [formatValue],
  );
  const keyFormatter = useMemo(
    () => formatKey ?? ((key: string) => key),
    [formatKey],
  );

  const tooltipContent = (props: ChartTooltipProps) => {
    const { active: isActive, payload } = props;
    const point = payload?.[0]?.payload;
    if (!isActive || !point) return null;

    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-card">
        <p className="text-xs text-muted-foreground">{keyFormatter(point.key ?? "")}</p>
        <p className="text-sm font-semibold text-popover-foreground">
          {valueFormatter(point.value ?? 0)}
        </p>
      </div>
    );
  };

  const hasData = data.length > 0 && data.some((point) => point.value > 0);

  return (
    <div
      className={cn("relative w-full", className)}
      style={{ height }}
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--atl-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--atl-primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="key"
            tickFormatter={keyFormatter}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            minTickGap={28}
            interval="preserveStartEnd"
          />

          <YAxis
            tickFormatter={(value: number) => valueFormatter(value)}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
            allowDecimals={false}
          />

          <Tooltip
            content={tooltipContent}
            cursor={{ stroke: "var(--ring)", strokeWidth: 1 }}
            isAnimationActive={false}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--atl-primary)"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: "var(--atl-primary)", strokeWidth: 0 }}
            isAnimationActive={!prefersReducedMotion()}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>

      {!hasData ? (
        <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground">
          No data in this period
        </p>
      ) : null}
    </div>
  );
}

let reducedMotionCache: boolean | null = null;

/** Reads the OS motion preference once per module load. */
function prefersReducedMotion(): boolean {
  if (reducedMotionCache !== null) return reducedMotionCache;
  if (typeof window === "undefined" || !window.matchMedia) {
    reducedMotionCache = false;
    return false;
  }
  reducedMotionCache = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reducedMotionCache;
}

export default MetricChart;
