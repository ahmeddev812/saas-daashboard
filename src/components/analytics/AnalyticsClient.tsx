"use client";

import { useMemo, useState } from "react";
import { Download, Filter, LineChart, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricChart } from "@/components/charts/MetricChart";
import { DateRangeControl } from "@/components/analytics/DateRangeControl";
import {
  customerPoints,
  pointLabel,
  rangeForDays,
  rangeLabel,
  revenuePoints,
  type DateRange,
} from "@/components/analytics/analyticsLib";
import { useBusiness } from "@/hooks/useBusinessData";
import { useToast } from "@/context/ToastContext";
import {
  calculateConversionRate,
  cohortRetention,
  conversionFunnel,
  customersJoinedInRange,
  formatCurrency,
  formatMetric,
  formatPercent,
  ordersInRange,
  revenueByDay,
  recognizedRevenue,
  revenueByProduct,
} from "@/lib/calculations";
import { getDateRange } from "@/lib/dates";
import { downloadCSV, type CSVColumn } from "@/lib/export";

export function AnalyticsClient() {
  const { customers, orders, products, settings, business } = useBusiness();
  const { success, error: toastError } = useToast();

  const [range, setRange] = useState<DateRange>(() => rangeForDays(Math.max(1, settings.defaultDateRange)));

  const dateKeys = useMemo(() => getDateRange(range.from, range.to), [range]);
  const rangeOrders = useMemo(
    () => ordersInRange(orders, range.from, range.to),
    [orders, range],
  );

  const revenueInRange = recognizedRevenue(rangeOrders);
  const newCustomers = customersJoinedInRange(customers, range.from, range.to).length;

  const revenueSeries = useMemo(() => revenuePoints(orders, range), [orders, range]);
  const customerSeries = useMemo(() => customerPoints(customers, range), [customers, range]);

  const productPerformance = useMemo(
    () => revenueByProduct(rangeOrders, products).filter((entry) => entry.value > 0),
    [rangeOrders, products],
  );
  const productMax = Math.max(0, ...productPerformance.map((entry) => entry.value));

  const funnel = useMemo(() => conversionFunnel(customers), [customers]);
  const funnelTop = funnel[0]?.value ?? 0;
  const overallConversion = calculateConversionRate(funnel[2]?.value ?? 0, funnelTop);

  const cohorts = useMemo(() => cohortRetention(customers), [customers]);

  const hasAnyData = customers.length > 0 || orders.length > 0;

  function exportCsv() {
    const rows = revenueByDay(orders, dateKeys);
    const columns: CSVColumn<(typeof rows)[number]>[] = [
      { header: "Period", value: (row) => row.key },
      { header: "Revenue", value: (row) => row.value },
      { header: "Orders", value: (row) => row.count },
    ];
    const ok = downloadCSV(rows, columns, `analytics_${range.from}_to_${range.to}`);
    if (ok) success("CSV exported", `${rangeLabel(range)} · ${rows.length} rows.`);
    else toastError("Export failed", "The browser blocked the download.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Measure"
        title="Analytics"
        description="Revenue trends, customer growth, product performance and conversion."
        actions={
          <Button variant="outline" icon={<Download className="size-4" />} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />

      <DateRangeControl value={range} onChange={setRange} />

      {/* ------------------------------- KPIs ------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue in range"
          value={formatCurrency(revenueInRange, business.currency)}
          numericValue={revenueInRange}
          formatValue={(value) => formatCurrency(value, business.currency)}
          icon={LineChart}
          iconTone="success"
          emptyLabel="No recognized revenue in range"
        />
        <StatCard
          label="Orders in range"
          value={formatMetric(rangeOrders.length)}
          numericValue={rangeOrders.length}
          formatValue={(value) => formatMetric(value)}
          icon={LineChart}
          iconTone="primary"
          emptyLabel="No orders in range"
        />
        <StatCard
          label="New customers"
          value={formatMetric(newCustomers)}
          numericValue={newCustomers}
          formatValue={(value) => formatMetric(value)}
          icon={Users}
          iconTone="info"
          emptyLabel="No signups in range"
        />
        <StatCard
          label="Trial → paid"
          value={overallConversion === null ? "—" : formatPercent(overallConversion)}
          icon={Users}
          iconTone="accent"
          emptyLabel="No customers to convert yet"
        />
      </div>

      {!hasAnyData ? (
        <EmptyState
          size="page"
          icon={<LineChart className="size-7" />}
          title="Nothing to analyse yet"
          description="Add customers and orders and every chart on this page builds itself from your data."
        />
      ) : (
        <>
          {/* ---------------------------- trends ---------------------------- */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader title="Revenue trend" description={rangeLabel(range)} />
              <CardContent className="min-w-0">
                {revenueSeries.every((point) => point.value === 0) ? (
                  <EmptyState
                    title="No revenue in this range"
                    description="Widen the date range, or mark an order as paid or fulfilled."
                  />
                ) : (
                  <MetricChart
                    data={revenueSeries}
                    ariaLabel={`Recognized revenue from ${rangeLabel(range)}`}
                    formatValue={(value) => formatCurrency(value, business.currency, { compact: true })}
                    formatKey={pointLabel}
                    height={240}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader title="Customer growth" description={rangeLabel(range)} />
              <CardContent className="min-w-0">
                {customerSeries.every((point) => point.value === 0) ? (
                  <EmptyState
                    title="No customers in this range"
                    description="Churned customers are excluded — add customers to see the curve move."
                  />
                ) : (
                  <MetricChart
                    data={customerSeries}
                    ariaLabel={`Customer count from ${rangeLabel(range)}`}
                    formatValue={(value) => formatMetric(value)}
                    formatKey={pointLabel}
                    height={240}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* --------------------- performance + funnel --------------------- */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader
                title="Product performance"
                description="Recognized revenue in the selected range"
              />
              <CardContent>
                {productPerformance.length === 0 ? (
                  <EmptyState
                    title="No product revenue in range"
                    description="Fulfilled and paid orders in this window have not attributed revenue yet."
                  />
                ) : (
                  <ul className="space-y-4">
                    {productPerformance.slice(0, 8).map((entry) => (
                      <li key={entry.id}>
                        <ProgressBar
                          label={entry.label}
                          value={productMax > 0 ? (entry.value / productMax) * 100 : 0}
                          caption={`${formatCurrency(entry.value, business.currency)} · ${formatMetric(entry.count)} units`}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader
                title="Conversion funnel"
                description="Signup → trial → paid, derived from customer records"
              />
              <CardContent>
                {funnelTop === 0 ? (
                  <EmptyState
                    title="No signups yet"
                    description="The funnel appears as soon as customers exist."
                  />
                ) : (
                  <ul className="space-y-4">
                    {funnel.map((stage) => (
                      <li key={stage.key}>
                        <ProgressBar
                          label={stage.label}
                          value={funnelTop > 0 ? (stage.value / funnelTop) * 100 : 0}
                          caption={`${formatMetric(stage.value)}${
                            stage.conversion === null
                              ? ""
                              : ` · ${formatPercent(stage.conversion)} of previous`
                          }`}
                          tone={stage.key === "paid" ? "success" : "primary"}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ---------------------------- cohorts ---------------------------- */}
          <Card>
            <CardHeader
              title="Cohort retention"
              description="Of the customers who joined each month, how many are still active."
            />
            <CardContent>
              {cohorts.length === 0 ? (
                <EmptyState
                  title="No cohorts yet"
                  description="Cohorts appear once customers have join dates."
                />
              ) : (
                <div className="overflow-x-auto scrollbar-slim">
                  <table className="w-full border-collapse text-sm">
                    <caption className="sr-only">Monthly cohort retention</caption>
                    <thead>
                      <tr className="border-b border-border">
                        <th scope="col" className="py-2 pr-4 text-left font-semibold text-muted-foreground">
                          Cohort
                        </th>
                        <th scope="col" className="py-2 px-4 text-right font-semibold text-muted-foreground">
                          Customers
                        </th>
                        <th scope="col" className="py-2 px-4 text-right font-semibold text-muted-foreground">
                          Still active
                        </th>
                        <th scope="col" className="py-2 pl-4 text-right font-semibold text-muted-foreground">
                          Retention
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohorts.map((row) => (
                        <tr key={row.cohort} className="border-b border-border/60">
                          <td className="py-2.5 pr-4 text-foreground">
                            {pointLabel(row.cohort)}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-muted-foreground">
                            {formatMetric(row.customers)}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-muted-foreground">
                            {formatMetric(row.retained)}
                          </td>
                          <td className="py-2.5 pl-4 text-right font-medium tabular-nums text-foreground">
                            {row.retention === null ? "—" : formatPercent(row.retention)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Filter className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          Every figure on this page uses the selected range only. Exports contain exactly the rows
          you can see here.
        </span>
      </p>
    </div>
  );
}

export default AnalyticsClient;
