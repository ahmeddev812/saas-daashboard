"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Eye,
  Plus,
  Receipt,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { OrderFormModal } from "@/components/orders/OrderFormModal";
import { useBusiness } from "@/hooks/useBusinessData";
import { useToast } from "@/context/ToastContext";
import { formatCurrency, formatMetric } from "@/lib/calculations";
import { formatDate, isInRange, subtractDays, toDateKey, todayKey } from "@/lib/dates";
import type { Order, OrderStatus } from "@/types/business";
import {
  ORDER_STATUS_TONE,
  nextStatus,
  orderReference,
  summarizeItems,
} from "@/components/orders/orderLogic";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  ...(["pending", "paid", "fulfilled", "refunded"] as OrderStatus[]).map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
  })),
];

const DEFAULT_FROM = toDateKey(subtractDays(new Date(), 365));

export function OrdersClient() {
  const { orders, customers, business, actions } = useBusiness();
  const { setOrderStatus, deleteOrder } = actions;
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Order | null>(null);

  const customerById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );

  const customerOptions = useMemo(
    () => customers.map((customer) => ({ value: customer.id, label: customer.name })),
    [customers],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const fromKey = from || DEFAULT_FROM;
    const toKey = to || todayKey();

    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (customerFilter !== "all" && order.customerId !== customerFilter) return false;
      if (!isInRange(order.date, fromKey, toKey)) return false;
      if (query === "") return true;

      const customer = customerById.get(order.customerId);
      const haystack = [
        order.id,
        order.reference ?? "",
        customer?.name ?? "",
        customer?.company ?? "",
        ...order.items.map((item) => item.productName),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [orders, search, statusFilter, customerFilter, from, to, customerById]);

  const rangeActive = from !== "" || to !== "";
  const filtersActive =
    search.trim() !== "" || statusFilter !== "all" || customerFilter !== "all" || rangeActive;

  const totals = useMemo(() => {
    const gross = filtered.reduce((sum, order) => sum + order.total, 0);
    const recognized = filtered
      .filter((order) => order.status === "paid" || order.status === "fulfilled")
      .reduce((sum, order) => sum + order.total, 0);
    return { gross, recognized };
  }, [filtered]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setCustomerFilter("all");
    setFrom("");
    setTo("");
  }

  function handleAdvance(order: Order) {
    const target = nextStatus(order.status);
    if (!target) return;
    const updated = setOrderStatus(order.id, target);
    if (updated) success("Status updated", `Order ${orderReference(order)} is now ${target}.`);
    else toastError("Status not changed", "That transition is not allowed.");
  }

  function handleDelete() {
    if (!pendingDelete) return;
    const removed = deleteOrder(pendingDelete.id);
    if (removed) {
      success("Order deleted", `Order ${orderReference(pendingDelete)} was removed.`);
    } else {
      toastError("Delete failed", "That order could not be found.");
    }
    setPendingDelete(null);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(order: Order) {
    setEditing(order);
    setFormOpen(true);
  }

  const columns: DataTableColumn<Order>[] = [
    {
      id: "reference",
      header: "Order",
      sortValue: (row) => orderReference(row),
      cell: (row) => (
        <Link
          href={`/orders/${row.id}`}
          className="block min-w-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="block truncate font-medium text-foreground hover:text-primary">
            {orderReference(row)}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {customerById.get(row.customerId)?.name ?? "Unknown customer"}
          </span>
        </Link>
      ),
    },
    {
      id: "items",
      header: "Items",
      sortValue: (row) => row.items.length,
      hideBelow: "lg",
      mobileLabel: "Items",
      cell: (row) => <span className="text-muted-foreground">{summarizeItems(row.items)}</span>,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (row) => row.status,
      mobileLabel: "Status",
      cell: (row) => (
        <Badge tone={ORDER_STATUS_TONE[row.status]} srPrefix="Status:">
          {row.status}
        </Badge>
      ),
    },
    {
      id: "total",
      header: "Total",
      align: "right",
      sortValue: (row) => row.total,
      mobileLabel: "Total",
      cell: (row) => (
        <span className="tabular-nums font-medium">
          {formatCurrency(row.total, business.currency)}
        </span>
      ),
    },
    {
      id: "date",
      header: "Date",
      sortValue: (row) => row.date,
      hideBelow: "md",
      mobileLabel: "Date",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.date)}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      mobileLabel: "Actions",
      cell: (row) => {
        const target = nextStatus(row.status);
        return (
          <span className="flex items-center justify-end gap-1.5">
            {target ? (
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Advance order ${orderReference(row)} from ${row.status} to ${target}`}
                title={`Advance to ${target}`}
                onClick={() => handleAdvance(row)}
              >
                <ChevronRight className="size-4" />
              </Button>
            ) : null}
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Edit order ${orderReference(row)}`}
              title="Edit"
              onClick={() => openEdit(row)}
            >
              <Receipt className="size-4" />
            </Button>
            <Link
              href={`/orders/${row.id}`}
              aria-label={`View order ${orderReference(row)}`}
              title="View"
              className="grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Eye className="size-4" />
            </Link>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Delete order ${orderReference(row)}`}
              title="Delete"
              onClick={() => setPendingDelete(row)}
            >
              <Trash2 className="size-4" />
            </Button>
          </span>
        );
      },
    },
  ];

  const toolbar = (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Search"
          placeholder="Reference, customer or product"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          prefix={<Search className="size-4" aria-hidden="true" />}
        />
        <Select
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          options={STATUS_OPTIONS}
        />
        <Select
          label="Customer"
          value={customerFilter}
          onChange={(event) => setCustomerFilter(event.target.value)}
          options={[{ value: "all", label: "All customers" }, ...customerOptions]}
          hint={customerOptions.length === 0 ? "Add a customer first." : undefined}
        />
        <div className="grid grid-cols-2 gap-2 sm:col-span-2">
          <Input
            label="From"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {formatMetric(filtered.length)} of {formatMetric(orders.length)} orders ·{" "}
          {formatCurrency(totals.gross, business.currency)} gross ·{" "}
          {formatCurrency(totals.recognized, business.currency)} recognized
        </p>

        {filtersActive ? (
          <Button variant="ghost" size="sm" icon={<X className="size-4" />} onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );

  const emptyState = filtersActive ? (
    <EmptyState
      icon={<Search className="size-5" />}
      title="No orders match those filters"
      description="Try a wider date range, a different status, or clear the filters."
      action={
        <Button size="sm" variant="outline" onClick={clearFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={<Receipt className="size-5" />}
      title="No orders yet"
      description="Create an order to start tracking revenue, refunds and fulfilment."
      action={
        <Button size="sm" onClick={openCreate}>
          New order
        </Button>
      }
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operate"
        title="Orders"
        description="Track every sale from pending through fulfilment — or a refund."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={openCreate}>
            New order
          </Button>
        }
      />

      <DataTable
        caption="Orders"
        rows={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        defaultSort={{ id: "date", direction: "desc" }}
        toolbar={toolbar}
        emptyState={emptyState}
      />

      {formOpen ? <OrderFormModal open order={editing} onClose={() => setFormOpen(false)} /> : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete order ${pendingDelete ? orderReference(pendingDelete) : ""}?`}
        description="This removes the order and its revenue from every metric. It cannot be undone."
        confirmLabel="Delete order"
        tone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default OrdersClient;
