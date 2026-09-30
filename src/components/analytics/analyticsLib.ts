import {
  daysBetween,
  formatDate,
  getDateRange,
  subtractDays,
  toDateKey,
  todayKey,
} from "@/lib/dates";
import {
  activeCustomerSeries,
  ordersInRange,
  revenueByMonth,
  revenueSeries,
  type SeriesPoint,
} from "@/lib/calculations";
import type { Customer, Order } from "@/types/business";

/** Inclusive date window (YYYY-MM-DD). */
export interface DateRange {
  from: string;
  to: string;
}

export interface RangePreset {
  id: string;
  label: string;
  days: number;
}

export const RANGE_PRESETS: RangePreset[] = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "12m", label: "12 months", days: 365 },
];

/** The last `days` days ending today, inclusive. */
export function rangeForDays(days: number): DateRange {
  const size = Math.max(1, Math.floor(days));
  return { from: toDateKey(subtractDays(new Date(), size - 1)), to: todayKey() };
}

/** Number of calendar days in the range (inclusive). */
export function rangeDays(range: DateRange): number {
  const days = daysBetween(range.from, range.to) + 1;
  return Number.isFinite(days) ? Math.max(0, days) : 0;
}

export function rangeLabel(range: DateRange): string {
  if (range.from > range.to) return "Invalid range";
  return `${formatDate(range.from)} – ${formatDate(range.to)}`;
}

/** True when the range matches a preset exactly (and ends today). */
export function activePreset(range: DateRange, preset: RangePreset): boolean {
  return rangeDays(range) === preset.days && range.to === todayKey();
}

/** Normalises an arbitrary range so from is never after to. */
export function normalizeRange(from: string, to: string): DateRange {
  if (from === "" || to === "") return { from, to };
  return from <= to ? { from, to } : { from: to, to: from };
}

/**
 * Recognized revenue points for the range.
 * Daily up to 120 points, then bucketed monthly so charts stay readable.
 */
export function revenuePoints(orders: readonly Order[], range: DateRange): SeriesPoint[] {
  const keys = getDateRange(range.from, range.to);
  if (keys.length === 0) return [];
  if (keys.length <= 120) return revenueSeries(orders, keys);
  return revenueByMonth(ordersInRange(orders, range.from, range.to)).map((point) => ({
    key: point.key,
    value: point.value,
  }));
}

/** Non-churned customer count over the range (one point per day). */
export function customerPoints(customers: readonly Customer[], range: DateRange): SeriesPoint[] {
  const keys = getDateRange(range.from, range.to);
  if (keys.length === 0) return [];
  return activeCustomerSeries(customers, keys);
}

/** Chart axis label: "2026-09" → Sep 2026, "2026-09-26" → Sep 26. */
export function pointLabel(key: string): string {
  if (key.length === 7) return formatDate(`${key}-01`, { style: "monthYear" });
  return formatDate(key, { style: "month" });
}
