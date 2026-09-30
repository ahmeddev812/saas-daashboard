"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Info, PiggyBank, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricChart } from "@/components/charts/MetricChart";
import { useBusiness } from "@/hooks/useBusinessData";
import { useToast } from "@/context/ToastContext";
import {
  calculateARR,
  calculateARPU,
  calculateCAC,
  calculateLTV,
  calculateMRR,
  churnRateForPeriod,
  countActiveCustomers,
  customersJoinedInRange,
  formatCurrency,
  formatMetric,
  formatPercent,
  recognizedRevenue,
  refundedRevenue,
  revenueByCustomer,
  revenueByProduct,
  revenueByMonth,
  type Metric,
} from "@/lib/calculations";
import { rangeForDays, pointLabel, type DateRange } from "@/components/analytics/analyticsLib";
import type { CurrencyCode } from "@/types/business";

interface MoneyValue {
  value: string;
  numericValue?: number;
  formatValue?: (value: number) => string;
}

export function RevenueClient() {
  const { customers, orders, products, settings, business, actions } = useBusiness();
  const { updateSettings } = actions;
  const { success } = useToast();

  const period: DateRange = useMemo(
    () => rangeForDays(Math.max(1, settings.defaultDateRange)),
    [settings.defaultDateRange],
  );

  const [acquisitionInput, setAcquisitionInput] = useState(
    String(settings.acquisitionCost ?? 0),
  );

  const money = (value: Metric): MoneyValue => {
    if (value === null) return { value: "—" };
    return {
      value: formatCurrency(value, business.currency),
      numericValue: value,
      formatValue: (next) => formatCurrency(next, business.currency),
    };
  };

  const pct = (value: Metric): MoneyValue => {
    if (value === null) return { value: "—" };
    return { value: formatPercent(value), numericValue: value, formatValue: (n) => formatPercent(n) };
  };

  const mrr = calculateMRR(customers);
  const arr = calculateARR(mrr);
  const active = countActiveCustomers(customers);
  const arpu = calculateARPU(mrr, active);
  const churn = churnRateForPeriod(customers, period.from, period.to);
  const ltv = calculateLTV(arpu, churn);

  const newCustomers = customersJoinedInRange(customers, period.from, period.to).length;
  const cac = calculateCAC(settings.acquisitionCost, newCustomers);

  const periodOrders = useMemo(
    () => orders.filter((order) => order.date >= period.from && order.date <= period.to),
    [orders, period],
  );
  const periodRevenue = recognizedRevenue(periodOrders);
  const periodRefunded = refundedRevenue(periodOrders);

  const monthly = useMemo(() => revenueByMonth(orders).map((p) => ({ key: p.key, value: p.value })), [orders]);
  const monthlyTotal = monthly.reduce((sum, point) => sum + point.value, 0);

  const byProduct = useMemo(
    () => revenueByProduct(orders, products).filter((entry) => entry.value > 0),
    [orders, products],
  );
  const byCustomer = useMemo(
    () => revenueByCustomer(orders, customers).filter((entry) => entry.value > 0),
    [orders, customers],
  );
  const breakdownMax = Math.max(
    0,
    ...byProduct.map((entry) => entry.value),
    ...byCustomer.map((entry) => entry.value),
  );

  function saveAcquisition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(acquisitionInput);
    const next = Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : 0;
    updateSettings({ acquisitionCost: next });
    setAcquisitionInput(String(next));
    success("Acquisition cost saved", "CAC now uses this figure.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Measure"
        title="Revenue"
        description="MRR, ARR and the SaaS metrics that explain how the business is doing."
      />

      {/* ------------------------------ KPI grid ------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="MRR"
          {...money(mrr)}
          icon={PiggyBank}
          iconTone="primary"
          emptyLabel="No recurring revenue yet"
        />
        <StatCard
          label="ARR"
          {...money(arr)}
          icon={PiggyBank}
          iconTone="accent"
          emptyLabel="No annual run rate yet"
        />
        <StatCard
          label="ARPU"
          {...money(arpu)}
          icon={PiggyBank}
          iconTone="info"
          emptyLabel="No active customers yet"
        />
        <StatCard
          label={`Revenue · ${period.from.slice(0, 4)}–${period.to.slice(0, 4)}`}
          {...money(periodRevenue)}
          icon={PiggyBank}
          iconTone="success"
          emptyLabel="Nothing recognized in this window"
        />
        <StatCard
          label="Churn rate"
          {...pct(churn)}
          icon={PiggyBank}
          iconTone="warning"
          emptyLabel="Not enough history yet"
        />
        <StatCard
          label="LTV"
          {...money(ltv)}
          icon={PiggyBank}
          iconTone="accent"
          emptyLabel="Needs ARPU and churn"
        />
        <StatCard
          label="CAC"
          {...money(cac)}
          icon={PiggyBank}
          iconTone="info"
          emptyLabel="No new customers in window"
        />
        <StatCard
          label="Refunded"
          {...money(periodRefunded)}
          icon={PiggyBank}
          iconTone="neutral"
          emptyLabel="No refunds in this window"
        />
      </div>

      {/* ------------------------------ CAC input ------------------------------ */}
      <Card>
        <CardHeader
          title="Acquisition cost"
          description="CAC is only as good as this number — ATLARIS never invents it."
        />
        <CardContent>
          <form onSubmit={saveAcquisition} className="flex flex-wrap items-end gap-3">
            <Input
              label="Total acquisition spend"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              containerClassName="w-full max-w-xs"
              value={acquisitionInput}
              onChange={(event) => setAcquisitionInput(event.target.value)}
              hint={`Used for the last ${period.to} window · ${formatMetric(newCustomers)} new customers`}
            />
            <Button type="submit" icon={<Save className="size-4" />}>
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------------------------- revenue chart ---------------------------- */}
        <div className="min-w-0 lg:col-span-2">
          <Card className="flex flex-col">
            <CardHeader
              title="Revenue by period"
              description="Recognized (paid + fulfilled) revenue, by month"
            />
            <CardContent className="min-w-0">
              {monthly.length === 0 || monthlyTotal <= 0 ? (
                <EmptyState
                  title="No recognized revenue yet"
                  description="Revenue appears here once an order is marked paid or fulfilled. Refunded orders never count."
                />
              ) : (
                <MetricChart
                  data={monthly}
                  ariaLabel={`Recognized revenue by month, totalling ${formatCurrency(monthlyTotal, business.currency)}`}
                  formatValue={(value) => formatCurrency(value, business.currency, { compact: true })}
                  formatKey={pointLabel}
                  height={260}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* ------------------------------ notes ------------------------------ */}
        <div className="min-w-0">
          <Card className="h-full">
            <CardHeader title="How these numbers work" />
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <Note>
                Recognized revenue = <strong className="text-foreground">paid + fulfilled</strong>{" "}
                orders only. Pending and refunded orders are excluded.
              </Note>
              <Note>
                MRR sums <strong className="text-foreground">active</strong> customers only —
                trial and churned records are left out.
              </Note>
              <Note>
                Churn is measured over{" "}
                <strong className="text-foreground">{settings.defaultDateRange} days</strong> using
                churned customers&apos; last-active date.
              </Note>
              <Note>
                LTV and CAC return <strong className="text-foreground">—</strong> instead of a guess
                when the inputs are missing.
              </Note>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ------------------------------ breakdowns ------------------------------ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownCard
          title="Revenue by product"
          description="Captured line prices, recognized orders"
          entries={byProduct}
          max={breakdownMax}
          currency={business.currency}
          empty="No product has recognized revenue yet."
        />
        <BreakdownCard
          title="Revenue by customer"
          description="Recognized revenue per customer"
          entries={byCustomer}
          max={breakdownMax}
          currency={business.currency}
          empty="No customer has recognized revenue yet."
        />
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

interface BreakdownCardProps {
  title: string;
  description: string;
  entries: { id: string; label: string; value: number }[];
  max: number;
  currency: CurrencyCode;
  empty: string;
}

function BreakdownCard({ title, description, entries, max, currency, empty }: BreakdownCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader title={title} description={description} />
      <CardContent>
        {entries.length === 0 ? (
          <EmptyState title="Nothing to show yet" description={empty} />
        ) : (
          <ul className="space-y-4">
            {entries.slice(0, 8).map((entry) => (
              <li key={entry.id}>
                <ProgressBar
                  label={entry.label}
                  value={max > 0 ? (entry.value / max) * 100 : 0}
                  caption={`${formatCurrency(entry.value, currency)}`}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default RevenueClient;
