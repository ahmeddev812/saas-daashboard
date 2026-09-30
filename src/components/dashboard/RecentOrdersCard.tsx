"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useBusinessData } from "@/hooks/useBusinessData";
import { formatCurrency } from "@/lib/calculations";
import { formatDate, toDateKey } from "@/lib/dates";
import type { OrderStatus } from "@/types/business";

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  pending: "warning",
  paid: "info",
  fulfilled: "success",
  refunded: "neutral",
};

/** The five most recent orders, newest first. */
export function RecentOrdersCard() {
  const { orders, customers, business } = useBusinessData();

  const customerName = (id: string) =>
    customers.find((customer) => customer.id === id)?.name ?? "Unknown customer";

  const recent = [...orders]
    .sort((a, b) => toDateKey(b.date).localeCompare(toDateKey(a.date)))
    .slice(0, 5);

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Recent orders"
        description="Latest activity across your book"
        action={
          <Link
            href="/orders"
            className="text-xs font-medium text-primary transition-colors hover:underline"
          >
            View all
          </Link>
        }
      />

      <CardContent className="min-w-0 flex-1">
        {recent.length === 0 ? (
          <EmptyState
            icon={<Receipt className="size-5" />}
            title="No orders yet"
            description="Orders you create will show up here, newest first."
            action={
              <Link href="/orders">
                <Button size="sm">Create an order</Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-subtle/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {customerName(order.customerId)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDate(order.date)} · {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <Badge tone={STATUS_TONE[order.status]} srPrefix="Status:">
                      {order.status}
                    </Badge>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(order.total, business.currency)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {recent.length > 0 ? (
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          Totals exclude refunded orders from recognized revenue.
        </p>
      ) : null}
    </Card>
  );
}

export default RecentOrdersCard;
