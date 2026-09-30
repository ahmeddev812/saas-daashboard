/**
 * ATLARIS date helpers.
 *
 * Conventions:
 *   - "date key" = YYYY-MM-DD (locale independent, used in URLs and storage)
 *   - All helpers are SSR safe (no localStorage, no Date.now side effects
 *     beyond the optional `base` argument).
 */

export type DateKey = string;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/* --------------------------------------------------------------------------
   Conversion
   -------------------------------------------------------------------------- */

/** Accepts a Date, ISO timestamp or YYYY-MM-DD key and returns a Date at local midnight. */
export function toDate(value: Date | string | number): Date {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === "number") return new Date(value);

  if (DATE_KEY_PATTERN.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }
  return new Date(value);
}

/** YYYY-MM-DD for a given date (defaults to now). */
export function toDateKey(value: Date | string | number = new Date()): DateKey {
  const date = toDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** YYYY-MM-DD for today (local time). */
export function todayKey(): DateKey {
  return toDateKey(new Date());
}

/** Parse a date key back into a Date (local midnight). Returns null when invalid. */
export function parseDateKey(key: string): Date | null {
  if (!DATE_KEY_PATTERN.test(key)) return null;
  const date = toDate(key);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** ISO 8601 timestamp for activity logs. */
export function nowIso(): string {
  return new Date().toISOString();
}

/* --------------------------------------------------------------------------
   Arithmetic
   -------------------------------------------------------------------------- */

/** Adds (or subtracts, with a negative value) calendar days. */
export function addDays(base: Date | string | number, days: number): Date {
  const date = toDate(base);
  date.setDate(date.getDate() + days);
  return date;
}

/** Subtracts calendar days. */
export function subtractDays(base: Date | string | number, days: number): Date {
  return addDays(base, -days);
}

/** Adds calendar months, clamping the day of month. */
export function addMonths(base: Date | string | number, months: number): Date {
  const date = toDate(base);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return date;
}

/** Whole days between two dates (b - a), time-of-day ignored. */
export function daysBetween(a: Date | string, b: Date | string): number {
  const start = startOfDay(toDate(a)).getTime();
  const end = startOfDay(toDate(b)).getTime();
  return Math.round((end - start) / 86_400_000);
}

/** Midnight (00:00:00.000) of the same local day. */
export function startOfDay(value: Date | string | number): Date {
  const date = toDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

/* --------------------------------------------------------------------------
   Ranges
   -------------------------------------------------------------------------- */

/**
 * The last `count` days as date keys, oldest first,
 * ending on `base` (defaults to today).
 *
 *   getLastNDays(7) -> ["2026-09-20", ..., "2026-09-26"]
 */
export function getLastNDays(count: number, base: Date | string = new Date()): DateKey[] {
  const size = Math.max(1, Math.floor(count));
  const end = startOfDay(base);
  const keys: DateKey[] = [];
  for (let i = size - 1; i >= 0; i -= 1) {
    keys.push(toDateKey(addDays(end, -i)));
  }
  return keys;
}

/** Inclusive range of date keys from `from` to `to`. */
export function getDateRange(from: Date | string, to: Date | string): DateKey[] {
  const start = startOfDay(from);
  const end = startOfDay(to);
  if (end.getTime() < start.getTime()) return [];

  const keys: DateKey[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor.getTime() <= end.getTime() && guard < 3660) {
    keys.push(toDateKey(cursor));
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return keys;
}

/** True when `value` falls inside the inclusive [from, to] window. */
export function isInRange(value: Date | string, from: Date | string, to: Date | string): boolean {
  const key = toDateKey(value);
  return key >= toDateKey(from) && key <= toDateKey(to);
}

/** True when two values fall on the same calendar day. */
export function isSameDay(a: Date | string, b: Date | string): boolean {
  return toDateKey(a) === toDateKey(b);
}

/* --------------------------------------------------------------------------
   Formatting
   -------------------------------------------------------------------------- */

export interface FormatDateOptions {
  /** "short" -> Sep 26, 2026 | "long" -> September 26, 2026 | "numeric" -> 09/26/2026 */
  style?: "short" | "long" | "numeric" | "month" | "monthYear";
  /** Append the time of day. */
  withTime?: boolean;
}

/** Human readable date. Never throws on invalid input. */
export function formatDate(value: Date | string | number | null | undefined, options: FormatDateOptions = {}): string {
  if (value === null || value === undefined || value === "") return "—";

  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "—";

  const { style = "short", withTime = false } = options;

  const base: Intl.DateTimeFormatOptions =
    style === "long"
      ? { year: "numeric", month: "long", day: "numeric" }
      : style === "numeric"
        ? { year: "numeric", month: "2-digit", day: "2-digit" }
        : style === "month"
          ? { month: "short", day: "numeric" }
          : style === "monthYear"
            ? { year: "numeric", month: "short" }
            : { year: "numeric", month: "short", day: "numeric" };

  if (withTime) {
    base.hour = "2-digit";
    base.minute = "2-digit";
  }

  try {
    return new Intl.DateTimeFormat(undefined, base).format(date);
  } catch {
    return toDateKey(date);
  }
}

/** "3 days ago" / "in 2 days" — used by activity feeds. */
export function formatRelative(value: Date | string | number): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (absMs < minute) return rtf.format(Math.round(diffMs / 1000), "second");
  if (absMs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
  if (absMs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  if (absMs < 30 * day) return rtf.format(Math.round(diffMs / day), "day");
  if (absMs < 365 * day) return rtf.format(Math.round(diffMs / (30 * day)), "month");
  return rtf.format(Math.round(diffMs / (365 * day)), "year");
}

/** Group label for period buckets: "Sep 2026". */
export function formatMonthYear(value: Date | string | number): string {
  return formatDate(value, { style: "monthYear" });
}

/** Compact axis label for charts: "Sep 26". */
export function formatShortLabel(value: Date | string | number): string {
  return formatDate(value, { style: "month" });
}
