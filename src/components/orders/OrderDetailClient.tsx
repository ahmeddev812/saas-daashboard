"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Pencil,
  Printer,
  Receipt,
  RotateCcw,
  Trash2,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { OrderFormModal } from "@/components/orders/OrderFormModal";
import { useBusiness } from "@/hooks/useBusinessData";
import { useToast } from "@/context/ToastContext";
import { formatCurrency, formatMetric, isRecognized } from "@/lib/calculations";
import { formatDate } from "@/lib/dates";
import type { OrderStatus } from "@/types/business";
import {
  ORDER_STATUS_TONE,
  allowedStatusTargets,
  itemLabel,
  lineTotal,
  orderReference,
} from "@/components/orders/orderLogic";

export function OrderDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success } = useToast();
  const { orders, customers, business, actions, hydrated } = useBusiness();
  const { setOrderStatus, deleteOrder } = actions;

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const order = useMemo(
    () => orders.find((entry) => entry.id === id) ?? null,
    [orders, id],
  );
  const customer = useMemo(
    () => (order ? customers.find((entry) => entry.id === order.customerId) ?? null : null),
    [customers, order],
  );

  const reference = order ? orderReference(order) : "";

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading order…</p>;
  }

  if (!order) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <EmptyState
          size="page"
          icon={<Receipt className="size-7" />}
          title="Order not found"
          description="This order may have been deleted, or the link is out of date."
          action={
            <Link href="/orders">
              <Button>Back to orders</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + lineTotal(item), 0);
  const targets = allowedStatusTargets(order.status);

  function handleStatus(target: OrderStatus) {
    if (!order) return;
    const updated = setOrderStatus(order.id, target);
    if (updated) success("Status updated", `${reference} is now ${target}.`);
  }

  function handleDelete() {
    if (!order) return;
    deleteOrder(order.id);
    success("Order deleted", `${reference} was removed.`);
    setDeleteOpen(false);
    router.replace("/orders");
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      <PageHeader
        eyebrow="Order"
        title={reference}
        description={
          customer
            ? `${customer.name} · ${formatDate(order.date)}`
            : formatDate(order.date)
        }
        actions={
          <>
            <Button
              variant="outline"
              icon={<Printer className="size-4" />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Button variant="outline" icon={<Pencil className="size-4" />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button
              variant="destructive"
              icon={<Trash2 className="size-4" />}
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ------------------------------ receipt ------------------------------ */}
        <div className="min-w-0 lg:col-span-2">
          <Card className="print:shadow-none print:border-0">
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
                <div>
                  <p className="text-lg font-semibold text-foreground">{business.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {business.industry} · {business.currency}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Invoice
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">{reference}</p>
                </div>
              </div>

              <dl className="grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Billed to
                  </dt>
                  <dd className="mt-1 text-sm">
                    <span className="block font-medium text-foreground">
                      {customer?.name ?? "Unknown customer"}
                    </span>
                    {customer?.company ? (
                      <span className="block text-muted-foreground">{customer.company}</span>
                    ) : null}
                    {customer?.email ? (
                      <span className="block text-muted-foreground">{customer.email}</span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Order date
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">{formatDate(order.date)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Payment
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {order.paymentMethod.replace("_", " ")}
                  </dd>
                </div>
              </dl>

              <div className="overflow-x-auto scrollbar-slim">
                <table className="w-full border-collapse text-sm">
                  <caption className="sr-only">Line items for order {reference}</caption>
                  <thead>
                    <tr className="border-b border-border">
                      <th scope="col" className="py-2 pr-3 text-left font-semibold text-muted-foreground">
                        Item
                      </th>
                      <th scope="col" className="py-2 px-3 text-right font-semibold text-muted-foreground">
                        Qty
                      </th>
                      <th scope="col" className="py-2 px-3 text-right font-semibold text-muted-foreground">
                        Unit price
                      </th>
                      <th scope="col" className="py-2 pl-3 text-right font-semibold text-muted-foreground">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={`${item.productId}-${index}`} className="border-b border-border/60">
                        <td className="py-2.5 pr-3 text-foreground">{item.productName}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                          {item.qty}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                          {formatCurrency(item.price, business.currency)}
                        </td>
                        <td className="py-2.5 pl-3 text-right font-medium tabular-nums text-foreground">
                          {formatCurrency(lineTotal(item), business.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <dl className="w-full max-w-xs space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="tabular-nums text-foreground">
                      {formatCurrency(subtotal, business.currency)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-border pt-2">
                    <dt className="font-semibold text-foreground">Total</dt>
                    <dd className="text-lg font-semibold tabular-nums text-foreground">
                      {formatCurrency(order.total, business.currency)}
                    </dd>
                  </div>
                </dl>
              </div>

              {order.notes ? (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{order.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* ------------------------------ sidebar ------------------------------ */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Status" description="Workflow: pending → paid → fulfilled" />
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge tone={ORDER_STATUS_TONE[order.status]} dot srPrefix="Status:">
                  {order.status}
                </Badge>
                {isRecognized(order) ? (
                  <span className="inline-flex items-center gap-1 text-xs text-success">
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    Counts as revenue
                  </span>
                ) : order.status === "refunded" ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    Excluded from revenue
                  </span>
                ) : null}
              </div>

              {targets.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {targets.map((target) => (
                    <Button
                      key={target}
                      variant={target === "refunded" ? "destructive" : "secondary"}
                      onClick={() => handleStatus(target)}
                    >
                      {target === "refunded"
                        ? "Refund order"
                        : `Mark as ${target}`}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Refunded is a terminal state — no further transitions are available.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Customer" />
            <CardContent className="space-y-3">
              {customer ? (
                <>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-semibold text-primary"
                    >
                      <User className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {customer.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {customer.email || customer.company || "No contact details"}
                      </p>
                    </div>
                  </div>
                  <Link href={`/customers/${customer.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View customer
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This order has no linked customer.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Summary" />
            <CardContent className="space-y-2 text-sm">
              <Row label="Order ID" value={order.id} mono />
              <Row label="Lines" value={itemLabel(order.items.length)} />
              <Row label="Quantity" value={formatMetric(order.items.reduce((s, i) => s + i.qty, 0))} />
              <Row
                label="Gross"
                value={formatCurrency(order.total, business.currency)}
              />
              <Row
                label="Recognized"
                value={isRecognized(order) ? formatCurrency(order.total, business.currency) : "$0"}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {editOpen ? (
        <OrderFormModal open order={order} onClose={() => setEditOpen(false)} />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete order ${reference}?`}
        description="This removes the order and its revenue from every metric. It cannot be undone."
        confirmLabel="Delete order"
        tone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/orders"
      className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to orders
    </Link>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={`min-w-0 truncate text-foreground ${mono ? "font-mono text-xs" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

export default OrderDetailClient;
