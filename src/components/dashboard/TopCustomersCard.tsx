"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useBusinessData } from "@/hooks/useBusinessData";
import { formatCurrency, formatMetric, safeDivide, topCustomers } from "@/lib/calculations";

/** Top 5 customers by recognized revenue, with their share of the total. */
export function TopCustomersCard() {
  const { orders, customers, business } = useBusinessData();

  const leaders = topCustomers(orders, customers, 5);
  const total = leaders.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Top customers"
        description="By recognized revenue"
        action={
          <Link
            href="/customers"
            className="text-xs font-medium text-primary transition-colors hover:underline"
          >
            View all
          </Link>
        }
      />

      <CardContent className="min-w-0 flex-1">
        {leaders.length === 0 ? (
          <EmptyState
            icon={<Trophy className="size-5" />}
            title="No paying customers yet"
            description="Customers appear here once they have paid or fulfilled orders."
            action={
              <Link href="/customers">
                <Button size="sm">Add a customer</Button>
              </Link>
            }
          />
        ) : (
          <ol className="space-y-3">
            {leaders.map((entry, index) => {
              const share = safeDivide(entry.value, total);
              const percent = share === null ? 0 : Math.round(share * 100);

              return (
                <li key={entry.id}>
                  <Link
                    href={`/customers/${entry.id}`}
                    className="group block rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-subtle/70"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="grid size-6 shrink-0 place-items-center rounded-md bg-primary-soft text-xs font-semibold text-primary"
                        >
                          {index + 1}
                        </span>
                        <span className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                          {entry.label}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(entry.value, business.currency, { compact: true })}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                      >
                        <span
                          className="gradient-primary block h-full rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {percent}% · {formatMetric(entry.count)}{" "}
                        {entry.count === 1 ? "order" : "orders"}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export default TopCustomersCard;
