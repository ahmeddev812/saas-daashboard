import type {
  BusinessGoal,
  CurrencyCode,
  Customer,
  GoalType,
  Order,
  OrderStatus,
  Product,
} from "@/types/business";
import { daysBetween, toDateKey, todayKey } from "@/lib/dates";

/**
 * ===========================================================================
 * ATLARIS calculations
 * ---------------------------------------------------------------------------
 * Every metric shown anywhere in the app is derived here. Nothing is
 * hard-coded in a page or component.
 *
 * Rules:
 *   - Zero denominators return `null` — never NaN, never Infinity,
 *     never an invented percentage.
 *   - Refunded orders are EXCLUDED from recognized revenue, always.
 *   - Insufficient data returns `null` so the UI can show an honest
 *     "not enough data" state instead of a fabricated number.
 * ===========================================================================
 */

/** A metric that may legitimately be undefined because data is insufficient. */
export type Metric = number | null;

/** Order statuses whose value counts toward recognized revenue. */
export const REVENUE_STATUSES: readonly OrderStatus[] = ["paid", "fulfilled"];

/** Refunded orders never contribute to recognized revenue. */
export function isRecognized(order: Order): boolean {
  return REVENUE_STATUSES.includes(order.status);
}

/** Safe division: returns null instead of NaN/Infinity. */
export function safeDivide(numerator: number, denominator: number): Metric {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (denominator === 0) return null;
  return numerator / denominator;
}

/** Rounds to `digits` decimals, returning null for null input. */
export function round(value: Metric, digits = 2): Metric {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/* ==========================================================================
   Revenue
   ========================================================================== */

/** Sum of order totals for the given orders (no status filtering). */
export function grossOrderValue(orders: readonly Order[]): number {
  return orders.reduce((sum, order) => sum + (Number.isFinite(order.total) ? order.total : 0), 0);
}

/**
 * Recognized revenue: paid + fulfilled orders only.
 * Refunded orders are excluded. Pending orders are excluded because the
 * money has not been earned/collected yet.
 */
export function recognizedRevenue(orders: readonly Order[]): number {
  return orders.filter(isRecognized).reduce((sum, o) => sum + o.total, 0);
}

/** Revenue that was refunded (always reported separately, never added back). */
export function refundedRevenue(orders: readonly Order[]): number {
  return orders.filter((o) => o.status === "refunded").reduce((sum, o) => sum + o.total, 0);
}

/** Orders whose status counts as paid for reporting purposes. */
export function isPaidOrder(order: Order): boolean {
  return order.status === "paid" || order.status === "fulfilled";
}

/* ==========================================================================
   Core SaaS metrics
   ========================================================================== */

/** MRR = sum of ACTIVE customers' monthly recurring revenue. */
export function calculateMRR(customers: readonly Customer[]): number {
  return customers
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + (Number.isFinite(c.mrr) ? c.mrr : 0), 0);
}

/** ARR = MRR x 12. */
export function calculateARR(mrr: number): number {
  return mrr * 12;
}

/** Number of active customers (denominator for ARPU). */
export function countActiveCustomers(customers: readonly Customer[]): number {
  return customers.filter((c) => c.status === "active").length;
}

/** ARPU = MRR / active customers. Null when there are no active customers. */
export function calculateARPU(mrr: number, activeCustomers: number): Metric {
  return round(safeDivide(mrr, activeCustomers));
}

/**
 * Churn rate = (customers lost in period / customers at start) x 100.
 * Returns null when the starting cohort is empty.
 */
export function calculateChurnRate(customersLost: number, customersAtStart: number): Metric {
  const ratio = safeDivide(customersLost, customersAtStart);
  return ratio === null ? null : round(ratio * 100);
}

/**
 * Derives churn over a window from customer records.
 * "Lost" = customers whose status is churned and whose lastActive falls in
 * the window. Returns null without enough history to judge.
 */
export function churnRateForPeriod(
  customers: readonly Customer[],
  fromKey: string,
  toKey: string = todayKey(),
): Metric {
  const atStart = customers.filter((c) => toDateKey(c.joinDate) < fromKey).length;
  const lost = customers.filter((c) => {
    if (c.status !== "churned") return false;
    const key = toDateKey(c.lastActive);
    return key >= fromKey && key <= toKey;
  }).length;
  return calculateChurnRate(lost, atStart);
}

/**
 * LTV = ARPU / churn rate (churn expressed as a decimal).
 * Null when ARPU or churn is unknown, or churn is 0 (undefined lifetime).
 */
export function calculateLTV(arpu: Metric, churnRatePercent: Metric): Metric {
  if (arpu === null || churnRatePercent === null) return null;
  if (churnRatePercent <= 0) return null;
  return round(safeDivide(arpu, churnRatePercent / 100));
}

/**
 * CAC = acquisition cost / new customers in period.
 * The acquisition cost is a MANUAL input (AppSettings.acquisitionCost) —
 * it is never invented by the app.
 */
export function calculateCAC(acquisitionCost: number, newCustomers: number): Metric {
  if (!Number.isFinite(acquisitionCost) || acquisitionCost < 0) return null;
  return round(safeDivide(acquisitionCost, newCustomers));
}

/**
 * Growth % = ((current - previous) / previous) x 100.
 * Null when the previous value is 0 or not finite.
 */
export function calculateGrowthPercent(current: number, previous: number): Metric {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  const ratio = safeDivide(current - previous, previous);
  return ratio === null ? null : round(ratio * 100);
}

/** Absolute change between two values (null-safe). */
export function calculateDelta(current: number, previous: number): Metric {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  return round(current - previous);
}

/**
 * Conversion rate = (paid / total signups) x 100.
 * Null when there were no signups.
 */
export function calculateConversionRate(paid: number, totalSignups: number): Metric {
  const ratio = safeDivide(paid, totalSignups);
  return ratio === null ? null : round(ratio * 100);
}

/* ==========================================================================
   Order / customer helpers
   ========================================================================== */

/** Total number of orders. */
export function countOrders(orders: readonly Order[]): number {
  return orders.length;
}

/** Orders created inside the inclusive [fromKey, toKey] window. */
export function ordersInRange(orders: readonly Order[], fromKey: string, toKey: string): Order[] {
  return orders.filter((o) => {
    const key = toDateKey(o.date);
    return key >= fromKey && key <= toKey;
  });
}

/** Customers who joined inside the inclusive [fromKey, toKey] window. */
export function customersJoinedInRange(
  customers: readonly Customer[],
  fromKey: string,
  toKey: string,
): Customer[] {
  return customers.filter((c) => {
    const key = toDateKey(c.joinDate);
    return key >= fromKey && key <= toKey;
  });
}

/** Revenue for a single order's recognized value. */
export function orderRevenue(order: Order): number {
  return isRecognized(order) ? order.total : 0;
}

/* ==========================================================================
   Aggregations used by charts and reports
   ========================================================================== */

export interface PeriodPoint {
  /** Date key (YYYY-MM-DD) or period label. */
  key: string;
  /** Recognized revenue in this period. */
  value: number;
  count: number;
}

/** Recognized revenue bucketed by day for the supplied date keys. */
export function revenueByDay(
  orders: readonly Order[],
  dateKeys: readonly string[],
): PeriodPoint[] {
  const lookup = new Map<string, PeriodPoint>();
  for (const key of dateKeys) lookup.set(key, { key, value: 0, count: 0 });

  for (const order of orders) {
    const key = toDateKey(order.date);
    const bucket = lookup.get(key);
    if (!bucket) continue;
    bucket.value += orderRevenue(order);
    bucket.count += 1;
  }

  return dateKeys.map((key) => lookup.get(key) ?? { key, value: 0, count: 0 });
}

/** Recognized revenue bucketed by YYYY-MM. */
export function revenueByMonth(orders: readonly Order[]): PeriodPoint[] {
  const map = new Map<string, PeriodPoint>();
  for (const order of orders) {
    const month = toDateKey(order.date).slice(0, 7);
    const bucket = map.get(month) ?? { key: month, value: 0, count: 0 };
    bucket.value += orderRevenue(order);
    bucket.count += 1;
    map.set(month, bucket);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export interface NamedTotal {
  id: string;
  label: string;
  value: number;
  count: number;
}

/** Recognized revenue grouped by product (uses CAPTURED line prices). */
export function revenueByProduct(orders: readonly Order[], products: readonly Product[]): NamedTotal[] {
  const totals = new Map<string, NamedTotal>();

  for (const order of orders) {
    if (!isRecognized(order)) continue;
    for (const item of order.items) {
      const current = totals.get(item.productId) ?? {
        id: item.productId,
        label: item.productName,
        value: 0,
        count: 0,
      };
      current.value += item.price * item.qty;
      current.count += item.qty;
      totals.set(item.productId, current);
    }
  }

  // Include products that exist but have no recognized sales, at zero.
  for (const product of products) {
    if (!totals.has(product.id)) {
      totals.set(product.id, { id: product.id, label: product.name, value: 0, count: 0 });
    }
  }

  return [...totals.values()].sort((a, b) => b.value - a.value);
}

/** Recognized revenue grouped by customer. */
export function revenueByCustomer(
  orders: readonly Order[],
  customers: readonly Customer[],
): NamedTotal[] {
  const totals = new Map<string, NamedTotal>();

  for (const order of orders) {
    if (!isRecognized(order)) continue;
    const current = totals.get(order.customerId) ?? {
      id: order.customerId,
      label: order.customerId,
      value: 0,
      count: 0,
    };
    current.value += order.total;
    current.count += 1;
    totals.set(order.customerId, current);
  }

  const byId = new Map(customers.map((c) => [c.id, c]));
  const result: NamedTotal[] = [];
  for (const entry of totals.values()) {
    result.push({ ...entry, label: byId.get(entry.id)?.name ?? "Unknown customer" });
  }
  for (const customer of customers) {
    if (!totals.has(customer.id)) {
      result.push({ id: customer.id, label: customer.name, value: 0, count: 0 });
    }
  }

  return result.sort((a, b) => b.value - a.value);
}

/** Top customers by recognized revenue. */
export function topCustomers(
  orders: readonly Order[],
  customers: readonly Customer[],
  limit = 5,
): NamedTotal[] {
  return revenueByCustomer(orders, customers)
    .filter((c) => c.value > 0)
    .slice(0, Math.max(1, limit));
}

/** Top products by recognized revenue. */
export function topProducts(
  orders: readonly Order[],
  products: readonly Product[],
  limit = 5,
): NamedTotal[] {
  return revenueByProduct(orders, products)
    .filter((p) => p.value > 0)
    .slice(0, Math.max(1, limit));
}

/* ==========================================================================
   Time series
   ========================================================================== */

export interface SeriesPoint {
  key: string;
  value: number;
}

/**
 * Recognized revenue over the trailing `days` window, one point per day.
 * This is what the dashboard/analytics charts render.
 */
export function revenueSeries(
  orders: readonly Order[],
  dateKeys: readonly string[],
): SeriesPoint[] {
  return revenueByDay(orders, dateKeys).map((p) => ({ key: p.key, value: p.value }));
}

/**
 * MRR over the trailing window, derived from customer join dates.
 * A customer contributes their `mrr` from `joinDate` onward while they are
 * still counted as recurring (churned and trial customers are excluded —
 * only `active` customers carry MRR, matching `calculateMRR`).
 */
export function mrrSeries(customers: readonly Customer[], dateKeys: readonly string[]): SeriesPoint[] {
  return dateKeys.map((key) => {
    let value = 0;
    for (const customer of customers) {
      if (customer.status !== "active") continue;
      if (toDateKey(customer.joinDate) > key) continue;
      value += Number.isFinite(customer.mrr) ? customer.mrr : 0;
    }
    return { key, value };
  });
}

/** Active + trial customer count as of each key in the trailing window. */
export function activeCustomerSeries(
  customers: readonly Customer[],
  dateKeys: readonly string[],
): SeriesPoint[] {
  return dateKeys.map((key) => {
    let value = 0;
    for (const customer of customers) {
      if (customer.status === "churned") continue;
      if (toDateKey(customer.joinDate) > key) continue;
      value += 1;
    }
    return { key, value };
  });
}

/* ==========================================================================
   Goals
   ========================================================================== */

export interface GoalProgress {
  goal: BusinessGoal;
  /** 0–100, capped. Null when target is 0 or negative. */
  percent: Metric;
  remaining: number;
  complete: boolean;
  /** Days left until the deadline (negative = overdue). */
  daysLeft: number;
}

/** Progress for a single goal. Never divides by zero. */
export function goalProgress(goal: BusinessGoal, today = todayKey()): GoalProgress {
  const percent = goal.target > 0 ? round(Math.min((goal.current / goal.target) * 100, 999.99)) : null;
  const deadlineDate = goal.deadline ? toDateKey(goal.deadline) : null;
  const daysLeft = deadlineDate ? daysBetween(today, deadlineDate) : 0;

  return {
    goal,
    percent,
    remaining: Math.max(goal.target - goal.current, 0),
    complete: goal.target > 0 && goal.current >= goal.target,
    daysLeft,
  };
}

/** Derives the live "current" value for a goal from real business data. */
export function computeGoalCurrent(type: GoalType, deps: {
  customers: readonly Customer[];
  orders: readonly Order[];
  revenue: number;
}): number {
  switch (type) {
    case "revenue":
      return deps.revenue;
    case "customers":
      return deps.customers.length;
    case "orders":
      return deps.orders.length;
    default:
      return 0;
  }
}

/* ==========================================================================
   Funnel (analytics)
   ========================================================================== */

export interface FunnelStage {
  key: "signup" | "trial" | "paid";
  label: string;
  value: number;
  conversion: Metric;
}

/**
 * signup -> trial -> paid funnel derived purely from customer records.
 * Conversion between stages is null when the previous stage is empty.
 */
export function conversionFunnel(customers: readonly Customer[]): FunnelStage[] {
  const signup = customers.length;
  const trial = customers.filter((c) => c.status === "trial" || c.status === "active").length;
  const paid = customers.filter((c) => c.status === "active" && c.mrr > 0).length;

  const stages: FunnelStage[] = [
    { key: "signup", label: "Signed up", value: signup, conversion: null },
    { key: "trial", label: "Started trial", value: trial, conversion: calculateConversionRate(trial, signup) },
    { key: "paid", label: "Paying", value: paid, conversion: calculateConversionRate(paid, trial) },
  ];
  return stages;
}

/* ==========================================================================
   Cohorts
   ========================================================================== */

export interface CohortRow {
  /** YYYY-MM cohort key. */
  cohort: string;
  customers: number;
  retained: number;
  retention: Metric;
}

/**
 * Simple monthly cohort retention: of customers who joined in a month,
 * how many are still active today.
 */
export function cohortRetention(customers: readonly Customer[]): CohortRow[] {
  const map = new Map<string, { total: number; retained: number }>();

  for (const customer of customers) {
    const cohort = toDateKey(customer.joinDate).slice(0, 7);
    const row = map.get(cohort) ?? { total: 0, retained: 0 };
    row.total += 1;
    if (customer.status === "active") row.retained += 1;
    map.set(cohort, row);
  }

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cohort, row]) => ({
      cohort,
      customers: row.total,
      retained: row.retained,
      retention: round((safeDivide(row.retained, row.total) ?? 0) * 100),
    }));
}

/* ==========================================================================
   Formatting
   ========================================================================== */

/** Formats a metric for display. Returns "—" for null (never "NaN"). */
export function formatMetric(value: Metric, digits = 0): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Formats a percentage metric with the % suffix. */
export function formatPercent(value: Metric, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${formatMetric(value, digits)}%`;
}

/**
 * Formats a monetary amount in the active business currency.
 * Returns "—" for null/undefined so a missing figure is never shown as $0.
 */
export function formatCurrency(
  value: Metric,
  currency: CurrencyCode = "USD",
  options: { compact?: boolean; showCode?: boolean } = {},
): string {
  if (value === null || !Number.isFinite(value)) return "—";

  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: options.showCode ? "code" : "narrowSymbol",
      ...(options.compact
        ? { notation: "compact" as const, maximumFractionDigits: 1 }
        : { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
    });
    return formatter.format(value);
  } catch {
    // Unknown currency code — fall back to a plain number rather than crashing.
    return `${formatMetric(value, 2)} ${currency}`;
  }
}
