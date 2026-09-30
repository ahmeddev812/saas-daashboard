"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Mail,
  Pencil,
  Phone,
  Receipt,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MetricChart } from "@/components/charts/MetricChart";
import { CustomerFormModal } from "@/components/customers/CustomerFormModal";
import { useBusiness } from "@/hooks/useBusinessData";
import { useToast } from "@/context/ToastContext";
import {
  formatCurrency,
  formatMetric,
  isRecognized,
  mrrSeries,
  recognizedRevenue,
} from "@/lib/calculations";
import { addDays, formatDate, toDateKey } from "@/lib/dates";
import type { CustomerStatus, OrderStatus } from "@/types/business";

const STATUS_TONE: Record<CustomerStatus, BadgeTone> = {
  active: "success",
  churned: "neutral",
  trial: "info",
};

const ORDER_TONE: Record<OrderStatus, BadgeTone> = {
  pending: "warning",
  paid: "info",
  fulfilled: "success",
  refunded: "neutral",
};

const HISTORY_DAYS = 180;

export function CustomerDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const router = useRouter();
  const { success } = useToast();
  const { customers, orders, business, hydrated, actions: { deleteCustomer } } = useBusiness();

  const customer = customers.find((entry) => entry.id === id) ?? null;

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const customerOrders = useMemo(() => {
    if (!customer) return [];
    return orders
      .filter((order) => order.customerId === customer.id)
      .sort((a, b) => toDateKey(b.date).localeCompare(toDateKey(a.date)));
  }, [orders, customer]);

  const revenue = useMemo(
    () => recognizedRevenue(customerOrders),
    [customerOrders],
  );

  const mrrHistory = useMemo(() => {
    if (!customer) return [];
    const keys = Array.from({ length: HISTORY_DAYS }, (_, index) =>
      toDateKey(addDays(new Date(), index - (HISTORY_DAYS - 1))),
    );
    return mrrSeries([customer], keys);
  }, [customer]);

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading customer…</p>;
  }

  if (!customer) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/customers"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to customers
        </Link>

        <EmptyState
          size="page"
          icon={<Building2 className="size-7" />}
          title="Customer not found"
          description="This record may have been deleted, or the link is out of date."
          action={
            <Link href="/customers">
              <Button>Back to customers</Button>
            </Link>
          }
        />
      </div>
    );
  }

  function handleDelete() {
    deleteCustomer(customer!.id);
    success("Customer deleted", `${customer!.name} was removed.`);
    setDeleteOpen(false);
    router.replace("/customers");
  }

  const lifetimeOrders = customerOrders.length;
  const paidOrders = customerOrders.filter((order) => order.status !== "refunded").length;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/customers"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to customers
      </Link>

      <PageHeader
        eyebrow="Customer"
        title={customer.name}
        description={customer.company || customer.email || undefined}
        actions={
          <>
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

      {/* Identity + status */}
      <Card>
        <div className="flex flex-wrap items-start gap-4">
          <span
            aria-hidden="true"
            className="gradient-primary grid size-14 shrink-0 place-items-center rounded-2xl text-lg font-semibold text-primary-foreground"
          >
            {customer.name
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase() || "?"}
          </span>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[customer.status]} dot>
                {customer.status}
              </Badge>
              <Badge tone="accent">{customer.plan}</Badge>
              {customer.tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </div>

            <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              <DetailRow icon={<Mail className="size-4" />} label="Email" value={customer.email} />
              <DetailRow icon={<Phone className="size-4" />} label="Phone" value={customer.phone} />
              <DetailRow
                icon={<Building2 className="size-4" />}
                label="Company"
                value={customer.company}
              />
              <DetailRow
                icon={<CalendarDays className="size-4" />}
                label="Joined"
                value={formatDate(customer.joinDate)}
              />
            </dl>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="MRR"
          value={customer.mrr > 0 ? formatCurrency(customer.mrr, business.currency) : "—"}
          numericValue={customer.mrr}
          formatValue={(value) => formatCurrency(value, business.currency)}
          icon={Receipt}
          iconTone="primary"
          emptyLabel="No recurring revenue"
        />
        <StatCard
          label="Lifetime revenue"
          value={formatCurrency(revenue, business.currency)}
          numericValue={revenue}
          formatValue={(value) => formatCurrency(value, business.currency)}
          icon={Receipt}
          iconTone="success"
          emptyLabel="No recognized revenue yet"
        />
        <StatCard
          label="Orders"
          value={formatMetric(lifetimeOrders)}
          numericValue={lifetimeOrders}
          formatValue={(value) => formatMetric(value)}
          icon={Receipt}
          iconTone="info"
          emptyLabel="No orders yet"
        />
        <StatCard
          label="Paid orders"
          value={formatMetric(paidOrders)}
          numericValue={paidOrders}
          formatValue={(value) => formatMetric(value)}
          icon={Receipt}
          iconTone="accent"
          emptyLabel="Nothing paid yet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* MRR history */}
        <div className="min-w-0 lg:col-span-2">
          <Card className="flex flex-col">
            <CardHeader
              title="MRR history"
              description={`Trailing ${HISTORY_DAYS} days`}
            />
            <CardContent className="min-w-0">
              {customer.mrr > 0 ? (
                <MetricChart
                  data={mrrHistory}
                  ariaLabel={`MRR history for ${customer.name} over the last ${HISTORY_DAYS} days`}
                  formatValue={(value) => formatCurrency(value, business.currency, { compact: true })}
                  formatKey={(key) => key.slice(5)}
                  height={220}
                />
              ) : (
                <EmptyState
                  icon={<CalendarDays className="size-5" />}
                  title="No recurring revenue"
                  description="Set an MRR figure on this customer and the history will build from their join date."
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        <div className="min-w-0">
          <Card className="flex h-full flex-col">
            <CardHeader title="Notes" description="Visible to your team" />
            <CardContent className="flex-1">
              {customer.notes.trim() === "" ? (
                <EmptyState
                  title="No notes yet"
                  description="Add context from the Edit dialog."
                  action={
                    <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                      Edit customer
                    </Button>
                  }
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {customer.notes}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order history */}
      <Card>
        <CardHeader
          title="Order history"
          description={`${formatMetric(lifetimeOrders)} order${lifetimeOrders === 1 ? "" : "s"} on file`}
          action={
            <Link
              href="/orders"
              className="text-xs font-medium text-primary transition-colors hover:underline"
            >
              Manage orders
            </Link>
          }
        />
        <CardContent>
          {customerOrders.length === 0 ? (
            <EmptyState
              icon={<Receipt className="size-5" />}
              title="No orders for this customer"
              description="Create an order and it will appear here with its status history."
            />
          ) : (
            <ul className="divide-y divide-border">
              {customerOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-subtle/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {order.items.map((item) => item.productName).join(", ") || "Order"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.date)} · {order.items.length}{" "}
                        {order.items.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <Badge tone={ORDER_TONE[order.status]} srPrefix="Status:">
                        {order.status}
                      </Badge>
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          isRecognized(order) ? "text-foreground" : "text-muted-foreground line-through"
                        }`}
                      >
                        {formatCurrency(order.total, business.currency)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Mounted only while open so the draft always starts from the record. */}
      {editOpen ? (
        <CustomerFormModal open customer={customer} onClose={() => setEditOpen(false)} />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete ${customer.name}?`}
        description="This permanently removes the customer. Their orders stay on file but lose their customer link."
        confirmLabel="Delete customer"
        tone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2">
      <dt className="sr-only">{label}</dt>
      <span className="text-muted-foreground" aria-hidden="true">
        {icon}
      </span>
      <dd className="min-w-0 truncate text-foreground">
        <span className="text-muted-foreground">{label}: </span>
        {value}
      </dd>
    </div>
  );
}

export default CustomerDetailClient;
