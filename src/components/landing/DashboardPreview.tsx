"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  DEMO_PREVIEW_NOTICE,
  PREVIEW_METRICS,
  PREVIEW_ORDERS,
  PREVIEW_SERIES,
} from "@/data/landing";

/** Builds an SVG path + area fill from the static preview series. */
function buildChartPath(values: number[], width: number, height: number): {
  line: string;
  area: string;
} {
  if (values.length === 0) return { line: "", area: "" };

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values.map((v, i) => ({
    x: i * stepX,
    y: height - ((v - min) / span) * height,
  }));

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const area = `${line} L${width} ${height} L0 ${height} Z`;

  return { line, area };
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-success-soft text-success",
  pending: "bg-warning-soft text-warning",
  refunded: "bg-muted text-muted-foreground",
};

/**
 * Static, self-contained illustration of the ATLARIS dashboard.
 *
 * Renders ONLY the demo figures in `@/data/landing`. It never touches
 * BusinessDataProvider or localStorage — the landing route is public and this
 * component must stay inert with respect to real user data.
 */
export function DashboardPreview() {
  const { line, area } = buildChartPath(PREVIEW_SERIES, 600, 160);

  return (
    <figure className="relative">
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Dashboard preview
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          {DEMO_PREVIEW_NOTICE}
        </span>
      </figcaption>

      <div className="glass overflow-hidden rounded-panel shadow-card">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-border bg-card/60 px-4 py-3">
          <span className="size-2.5 rounded-full bg-destructive/70" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-warning/70" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-success/70" aria-hidden="true" />
          <span className="ml-3 truncate text-xs text-muted-foreground">
            atlaris.app / dashboard
          </span>
        </div>

        <div className="space-y-4 bg-card/40 p-4 sm:p-5">
          {/* Metric tiles */}
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PREVIEW_METRICS.map((metric, index) => {
              const direction = metric.delta === null ? 0 : Math.sign(metric.delta);
              const Icon = direction > 0 ? ArrowUpRight : direction < 0 ? ArrowDownRight : Minus;
              const good = direction > 0;

              return (
                <motion.li
                  key={metric.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.07, duration: 0.45 }}
                  className="rounded-card border border-border bg-card p-3"
                >
                  <p className="text-[11px] font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-foreground sm:text-xl">
                    {metric.value}
                  </p>
                  {metric.delta !== null ? (
                    <p
                      className={cn(
                        "mt-1 inline-flex items-center gap-0.5 text-xs font-medium",
                        good ? "text-success" : "text-destructive",
                      )}
                    >
                      <Icon className="size-3" aria-hidden="true" />
                      {Math.abs(metric.delta).toFixed(1)}%
                      <span className="sr-only">
                        {good ? "increase" : "decrease"} versus the previous period
                      </span>
                    </p>
                  ) : null}
                </motion.li>
              );
            })}
          </ul>

          {/* Area chart */}
          <div className="rounded-card border border-border bg-card p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">Revenue trend</p>
              <p className="text-xs text-muted-foreground">Last 14 weeks</p>
            </div>

            <div className="relative h-32 w-full sm:h-40">
              <svg
                viewBox="0 0 600 160"
                preserveAspectRatio="none"
                className="h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="preview-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--atl-primary)" stopOpacity="0.34" />
                    <stop offset="100%" stopColor="var(--atl-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[0, 40, 80, 120, 160].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="600"
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth="1"
                  />
                ))}

                <path d={area} fill="url(#preview-area)" />
                <motion.path
                  d={line}
                  fill="none"
                  stroke="var(--atl-primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, ease: "easeOut", delay: 0.35 }}
                />
              </svg>
            </div>
          </div>

          {/* Recent orders */}
          <div className="rounded-card border border-border bg-card p-3 sm:p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Recent orders</p>
            <ul className="space-y-2">
              {PREVIEW_ORDERS.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {order.customer}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.id} · {order.product}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                        STATUS_STYLES[order.status],
                      )}
                    >
                      {order.status}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {order.amount}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </figure>
  );
}

export default DashboardPreview;
