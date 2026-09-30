"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LineChart } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { MetricChart } from "@/components/charts/MetricChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { useBusinessData } from "@/hooks/useBusinessData";
import { formatCurrency, mrrSeries } from "@/lib/calculations";
import { addDays, formatMonthYear, toDateKey, todayKey } from "@/lib/dates";
import { Button } from "@/components/ui/Button";

const RANGES = [30, 90, 180] as const;
type RangeDays = (typeof RANGES)[number];

/** MRR growth area chart over the selected trailing window. */
export function MrrChartCard() {
  const { customers, business, hydrated } = useBusinessData();
  const [range, setRange] = useState<RangeDays>(90);

  const data = useMemo(() => {
    if (!hydrated) return [];
    const keys = Array.from({ length: range }, (_, index) =>
      toDateKey(addDays(new Date(), index - (range - 1))),
    );
    return mrrSeries(customers, keys);
  }, [customers, range, hydrated]);

  const hasData = hydrated && customers.some((c) => c.status === "active");

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="MRR growth"
        description="Monthly recurring revenue over time"
        action={
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/60 p-1">
            {RANGES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                aria-pressed={range === value}
                className={
                  range === value
                    ? "rounded-md bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-sm"
                    : "rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {value}d
              </button>
            ))}
          </div>
        }
      />

      <CardContent className="min-w-0 flex-1">
        {hasData ? (
          <MetricChart
            data={data}
            ariaLabel={`MRR over the last ${range} days`}
            formatValue={(value) => formatCurrency(value, business.currency, { compact: true })}
            formatKey={(key) => formatMonthYear(key)}
            height={250}
          />
        ) : (
          <EmptyState
            icon={<LineChart className="size-5" />}
            title="No recurring revenue yet"
            description="Add active customers with an MRR figure and this chart will fill in."
            action={
              <Link href="/customers">
                <Button size="sm">Add a customer</Button>
              </Link>
            }
          />
        )}
      </CardContent>

      <p className="sr-only">
        {hasData
          ? `Current MRR is ${formatCurrency(
              data[data.length - 1]?.value ?? 0,
              business.currency,
            )} over the last ${range} days.`
          : "No MRR data in this period."}
      </p>
      <p className="mt-2 text-xs text-muted-foreground" aria-hidden="true">
        Window ends {formatMonthYear(todayKey())}
      </p>
    </Card>
  );
}

export default MrrChartCard;
