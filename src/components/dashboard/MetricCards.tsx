"use client";

import { useMemo } from "react";
import { Activity, DollarSign, Repeat, Users } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { useBusinessData } from "@/hooks/useBusinessData";
import {
  calculateGrowthPercent,
  calculateMRR,
  countActiveCustomers,
  formatCurrency,
  formatMetric,
  mrrSeries,
  activeCustomerSeries,
  ordersInRange,
  recognizedRevenue,
} from "@/lib/calculations";
import { addDays, getDateRange, toDateKey, todayKey } from "@/lib/dates";

export interface DashboardMetrics {
  mrr: number;
  mrrGrowth: number | null;
  activeCustomers: number;
  customerGrowth: number | null;
  orders: number;
  ordersGrowth: number | null;
  revenue: number;
  revenueGrowth: number | null;
}

/**
 * Derives the four headline KPIs plus their period-over-period deltas.
 *
 * Growth compares the trailing N days against the equally sized window
 * immediately before it. `null` is returned (and rendered as "—") whenever the
 * comparison window has no data, rather than inventing a percentage.
 */
export function useDashboardMetrics(windowDays = 30): DashboardMetrics {
  const { customers, orders } = useBusinessData();

  return useMemo(() => {
    const today = todayKey();
    const windowStart = toDateKey(addDays(new Date(), -(windowDays - 1)));
    const previousEnd = toDateKey(addDays(new Date(), -windowDays));
    const previousStart = toDateKey(addDays(new Date(), -(windowDays * 2 - 1)));

    const currentOrders = ordersInRange(orders, windowStart, today);
    const previousOrders = ordersInRange(orders, previousStart, previousEnd);

    const currentRevenue = recognizedRevenue(currentOrders);
    const previousRevenue = recognizedRevenue(previousOrders);

    const mrr = calculateMRR(customers);
    const activeCustomers = countActiveCustomers(customers);

    // MRR / customer growth compares the value at the start of this window
    // against the value at the end of the previous one.
    const mrrPoints = mrrSeries(customers, [windowStart, previousEnd]);
    const customerPoints = activeCustomerSeries(customers, [windowStart, previousEnd]);

    return {
      mrr,
      mrrGrowth: calculateGrowthPercent(mrrPoints[0]?.value ?? 0, mrrPoints[1]?.value ?? 0),
      activeCustomers,
      customerGrowth: calculateGrowthPercent(
        customerPoints[0]?.value ?? 0,
        customerPoints[1]?.value ?? 0,
      ),
      orders: currentOrders.length,
      ordersGrowth: calculateGrowthPercent(currentOrders.length, previousOrders.length),
      revenue: currentRevenue,
      revenueGrowth: calculateGrowthPercent(currentRevenue, previousRevenue),
    };
  }, [customers, orders, windowDays]);
}

export interface MetricCardsProps {
  windowDays?: number;
}

/**
 * Four KPI tiles: MRR, active customers, orders and revenue.
 * Values are recomputed from context on every render, so a CRUD mutation
 * elsewhere in the app updates these cards immediately.
 */
export function MetricCards({ windowDays = 30 }: MetricCardsProps) {
  const { business } = useBusinessData();
  const metrics = useDashboardMetrics(windowDays);

  const currency = business.currency;
  const dateWindow = useMemo(
    () => getDateRange(addDays(new Date(), -(windowDays - 1)), new Date()),
    [windowDays],
  );

  const currencyFormat = (value: number) => formatCurrency(value, currency);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="MRR"
        value={currencyFormat(metrics.mrr)}
        numericValue={metrics.mrr}
        formatValue={(value) => currencyFormat(value)}
        trend={metrics.mrrGrowth}
        trendLabel="vs previous period"
        trendGood
        icon={Repeat}
        iconTone="primary"
        emptyLabel="No recurring customers yet"
      />

      <StatCard
        label="Active customers"
        value={formatMetric(metrics.activeCustomers)}
        numericValue={metrics.activeCustomers}
        formatValue={(value) => formatMetric(value)}
        trend={metrics.customerGrowth}
        trendLabel="vs previous period"
        trendGood
        icon={Users}
        iconTone="accent"
        emptyLabel="No active customers yet"
      />

      <StatCard
        label={`Orders · ${windowDays}d`}
        value={formatMetric(metrics.orders)}
        numericValue={metrics.orders}
        formatValue={(value) => formatMetric(value)}
        trend={metrics.ordersGrowth}
        trendLabel="vs previous period"
        trendGood
        icon={Activity}
        iconTone="info"
        emptyLabel="No orders in this window"
      />

      <StatCard
        label={`Revenue · ${windowDays}d`}
        value={currencyFormat(metrics.revenue)}
        numericValue={metrics.revenue}
        formatValue={(value) => currencyFormat(value)}
        trend={metrics.revenueGrowth}
        trendLabel="vs previous period"
        trendGood
        icon={DollarSign}
        iconTone="success"
        emptyLabel="No recognized revenue yet"
        footer={
          <p className="text-xs text-muted-foreground">
            {dateWindow[0]} → {dateWindow[dateWindow.length - 1]}
          </p>
        }
      />
    </div>
  );
}

export default MetricCards;
