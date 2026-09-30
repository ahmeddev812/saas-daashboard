"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useBusiness } from "@/hooks/useBusinessData";
import { todayKey } from "@/lib/dates";
import { formatCurrency } from "@/lib/calculations";
import {
  PAYMENT_METHODS,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentMethod,
} from "@/types/business";
import {
  ORDER_STATUSES,
  allowedStatusTargets,
  customProductId,
  itemsTotal,
  lineTotal,
  paymentLabel,
} from "@/components/orders/orderLogic";

const CUSTOM = "__custom";
const MAX_LINES = 12;

export interface OrderFormModalProps {
  open: boolean;
  /** Present → edit mode; absent → create mode. */
  order?: Order | null;
  onClose: () => void;
}

interface LineDraft {
  key: string;
  /** `""` unselected · `CUSTOM` hand-typed line · otherwise a catalog id. */
  productId: string;
  productName: string;
  qty: string;
  price: string;
}

type LineError = Partial<Record<"product" | "name" | "qty" | "price", string>>;
type FieldErrors = Partial<Record<"customerId" | "date" | "lines", string>>;

let keySeed = 0;
function newKey(): string {
  keySeed += 1;
  return `line_${keySeed}`;
}

function blankLine(productsHaveStock: boolean): LineDraft {
  return {
    key: newKey(),
    productId: productsHaveStock ? "" : CUSTOM,
    productName: "",
    qty: "1",
    price: "0",
  };
}

function toLineDrafts(order: Order | null | undefined, hasProducts: boolean): LineDraft[] {
  if (!order) return [blankLine(hasProducts)];
  // Captured product ids are preserved exactly — even if the catalog product
  // has since been archived or deleted, the option is synthesized below.
  return order.items.map((item) => ({
    key: newKey(),
    productId: item.productId,
    productName: item.productName,
    qty: String(item.qty),
    price: String(item.price),
  }));
}

/**
 * Create / edit dialog for an order: customer, line items, captured prices
 * and an automatically derived total.
 *
 * Mounted only while open so every draft starts from the target record.
 */
export function OrderFormModal({ open, order, onClose }: OrderFormModalProps) {
  const { customers, products, business, actions, hydrated } = useBusiness();
  const { addOrder, updateOrder } = actions;

  const hasProducts = products.length > 0;

  const [customerId, setCustomerId] = useState(order?.customerId ?? "");
  const [date, setDate] = useState(order?.date ?? todayKey());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    order?.paymentMethod ?? "card",
  );
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "pending");
  const [reference, setReference] = useState(order?.reference ?? "");
  const [notes, setNotes] = useState(order?.notes ?? "");
  const [lines, setLines] = useState<LineDraft[]>(() => toLineDrafts(order, hasProducts));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [lineErrors, setLineErrors] = useState<Record<string, LineError>>({});
  const [saving, setSaving] = useState(false);

  if (!open || !hydrated) return null;

  const isEdit = Boolean(order);

  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: customer.company ? `${customer.name} — ${customer.company}` : customer.name,
  }));

  // Archived products stay out of the picker, unless this order's existing
  // lines reference them (then the captured line must remain selectable).
  const referencedIds = new Set(
    lines.map((line) => line.productId).filter((value) => value !== "" && value !== CUSTOM),
  );
  const catalog: { id: string; name: string; price: number; archived: boolean }[] = products.map(
    (product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      archived: product.status === "archived",
    }),
  );
  for (const id of referencedIds) {
    if (catalog.some((entry) => entry.id === id)) continue;
    const line = lines.find((entry) => entry.productId === id);
    catalog.push({
      id,
      name: line?.productName || "Removed product",
      price: Number(line?.price ?? 0),
      archived: false,
    });
  }
  const selectable = catalog.filter((entry) => !entry.archived || referencedIds.has(entry.id));

  const productOptions = [
    ...(selectable.length > 0
      ? []
      : [{ value: "", label: "No products yet — use a custom line", disabled: true }]),
    ...selectable.map((entry) => ({
      value: entry.id,
      label: `${entry.name} · ${formatCurrency(entry.price, business.currency)}${
        entry.archived ? " (archived)" : ""
      }`,
    })),
    { value: CUSTOM, label: "Custom line…" },
  ];

  const statusOptions = (isEdit ? [status, ...allowedStatusTargets(status)] : ORDER_STATUSES)
    .filter((value, index, all) => all.indexOf(value) === index)
    .map((value) => ({
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1),
    }));

  const draftTotal = itemsTotal(
    lines.map((line) => ({
      qty: Number(line.qty),
      price: Number(line.price),
    })),
  );

  function patchLine(key: string, partial: Partial<LineDraft>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...partial } : line)));
    setLineErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      const remaining = { ...next[key] };
      for (const field of Object.keys(partial)) delete remaining[field as keyof LineError];
      if (Object.keys(remaining).length === 0) delete next[key];
      else next[key] = remaining;
      return next;
    });
  }

  function selectProduct(key: string, value: string) {
    if (value === CUSTOM) {
      patchLine(key, { productId: CUSTOM, productName: "", price: "" });
      return;
    }
    const product = products.find((entry) => entry.id === value);
    patchLine(key, {
      productId: value,
      ...(product ? { productName: product.name, price: String(product.price) } : {}),
    });
  }

  function addLine() {
    if (lines.length >= MAX_LINES) return;
    setLines((prev) => [...prev, blankLine(selectable.length > 0)]);
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((line) => line.key !== key)));
    setLineErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(): { fields: FieldErrors; rows: Record<string, LineError> } {
    const fields: FieldErrors = {};
    const rows: Record<string, LineError> = {};

    if (!customerId) fields.customerId = "Choose the customer this order belongs to.";
    if (date === "") fields.date = "Pick an order date.";
    if (lines.length === 0) fields.lines = "An order needs at least one line.";

    for (const line of lines) {
      const row: LineError = {};

      if (line.productId === "") row.product = "Choose a product.";
      if (line.productId === CUSTOM && line.productName.trim() === "") {
        row.name = "Name this line.";
      }

      const qty = Number(line.qty);
      if (!Number.isFinite(qty) || qty < 1 || !Number.isInteger(qty)) {
        row.qty = "Min 1.";
      }

      const price = Number(line.price);
      if (!Number.isFinite(price) || price < 0) row.price = "Must be 0 or more.";

      if (Object.keys(row).length > 0) rows[line.key] = row;
    }

    if (lines.length > 0 && Object.keys(rows).length > 0) {
      fields.lines = "Fix the highlighted line items.";
    }

    return { fields, rows };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const { fields, rows } = validate();
    setErrors(fields);
    setLineErrors(rows);
    if (Object.keys(fields).length > 0) return;

    setSaving(true);

    const items: OrderItem[] = lines.map((line) => {
      const qty = Math.max(1, Math.round(Number(line.qty)));
      const price = Math.max(0, Math.round(Number(line.price) * 100) / 100);
      const inCatalog = products.find((product) => product.id === line.productId);
      const isCustom = line.productId === "" || line.productId === CUSTOM;
      return {
        // A catalog or previously captured id is never rewritten — deleting or
        // renaming a product must not rewrite order history.
        productId: inCatalog ? inCatalog.id : isCustom ? customProductId(line.productName) : line.productId,
        productName: inCatalog ? inCatalog.name : line.productName.trim(),
        qty,
        price,
      };
    });

    const payload = {
      customerId,
      items,
      total: itemsTotal(items),
      status,
      date,
      paymentMethod,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (isEdit && order) updateOrder(order.id, payload);
    else addOrder(payload);

    onClose();
  }

  return (
    <Modal
      open
      onClose={saving ? () => undefined : onClose}
      title={isEdit ? "Edit order" : "New order"}
      description={
        isEdit
          ? "Line totals and the order total are recalculated from quantity × price."
          : "Pick a customer, add line items, and the total is calculated for you."
      }
      size="lg"
      dismissOnBackdrop={!saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="order-form" loading={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create order"}
          </Button>
        </>
      }
    >
      <form id="order-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Customer"
            value={customerId}
            onChange={(event) => {
              setCustomerId(event.target.value);
              setErrors((prev) => ({ ...prev, customerId: undefined }));
            }}
            error={errors.customerId}
            placeholder={customerOptions.length > 0 ? "Select a customer…" : "No customers yet"}
            options={customerOptions}
            data-autofocus
            required
          />
          <Input
            label="Order date"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setErrors((prev) => ({ ...prev, date: undefined }));
            }}
            error={errors.date}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatus)}
            options={statusOptions}
            hint={isEdit ? "Refunded is terminal." : undefined}
          />
          <Select
            label="Payment method"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
            options={PAYMENT_METHODS.map((value) => ({ value, label: paymentLabel(value) }))}
          />
          <Input
            label="Reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="INV-1042"
            hint="Optional invoice number."
          />
        </div>

        {/* ---------------- line items ---------------- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Line items</p>
              <p className="text-xs text-muted-foreground">
                Quantity × captured price. Prices never change when the product does.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={<Plus className="size-4" />}
              onClick={addLine}
              disabled={lines.length >= MAX_LINES}
            >
              Add line
            </Button>
          </div>

          {errors.lines ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors.lines}
            </p>
          ) : null}

          <div className="space-y-3">
            {lines.map((line, index) => {
              const row = lineErrors[line.key];
              const qty = Number(line.qty);
              const price = Number(line.price);
              const total =
                Number.isFinite(qty) && Number.isFinite(price)
                  ? lineTotal({ qty, price })
                  : 0;

              return (
                <div
                  key={line.key}
                  className="rounded-xl border border-border bg-subtle/40 p-3.5 sm:p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Line {index + 1}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove line ${index + 1}`}
                      disabled={lines.length === 1}
                      onClick={() => removeLine(line.key)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-5">
                      <Select
                        label="Product"
                        value={line.productId}
                        onChange={(event) => selectProduct(line.key, event.target.value)}
                        options={productOptions}
                        error={row?.product}
                      />
                      {line.productId === CUSTOM ? (
                        <Input
                          label="Line name"
                          containerClassName="mt-2"
                          value={line.productName}
                          onChange={(event) =>
                            patchLine(line.key, { productName: event.target.value })
                          }
                          error={row?.name}
                          placeholder="Onboarding workshop"
                        />
                      ) : null}
                    </div>

                    <div className="sm:col-span-2">
                      <Input
                        label="Qty"
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={line.qty}
                        onChange={(event) => patchLine(line.key, { qty: event.target.value })}
                        error={row?.qty}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <Input
                        label="Unit price"
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={line.price}
                        onChange={(event) => patchLine(line.key, { price: event.target.value })}
                        error={row?.price}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <p className="mb-1.5 text-sm font-medium text-foreground">Line total</p>
                      <p className="flex h-10 items-center justify-end rounded-xl border border-border bg-background px-3.5 text-sm font-semibold tabular-nums text-foreground sm:justify-start">
                        {formatCurrency(total, business.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary-soft/40 px-4 py-3">
            <span className="text-sm font-medium text-foreground">Order total</span>
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {formatCurrency(draftTotal, business.currency)}
            </span>
          </div>
        </div>

        <Textarea
          label="Notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Internal notes shown on the receipt view."
        />
      </form>
    </Modal>
  );
}

export default OrderFormModal;
