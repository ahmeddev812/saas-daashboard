import { canTransition } from "@/context/BusinessDataProvider";
import type { BadgeTone } from "@/components/ui/Badge";
import type { OrderItem, OrderStatus, PaymentMethod } from "@/types/business";

/** All statuses in workflow order. */
export const ORDER_STATUSES: OrderStatus[] = ["pending", "paid", "fulfilled", "refunded"];

export const ORDER_STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  pending: "warning",
  paid: "info",
  fulfilled: "success",
  refunded: "neutral",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  paypal: "PayPal",
  other: "Other",
};

export function paymentLabel(method: PaymentMethod): string {
  return PAYMENT_LABELS[method] ?? "Other";
}

/** Statuses the workflow allows from `from`, excluding `from` itself. */
export function allowedStatusTargets(from: OrderStatus): OrderStatus[] {
  return ORDER_STATUSES.filter((status) => status !== from && canTransition(from, status));
}

/**
 * The forward step of the workflow (refunded is terminal, so it never has one).
 * pending → paid → fulfilled → null.
 */
export function nextStatus(from: OrderStatus): OrderStatus | null {
  return allowedStatusTargets(from).find((status) => status !== "refunded") ?? null;
}

/** Single-line money value for one row, rounded to cents. */
export function lineTotal(item: Pick<OrderItem, "qty" | "price">): number {
  const total = item.qty * item.price;
  return Number.isFinite(total) ? Math.round(total * 100) / 100 : 0;
}

/** Sum of all line totals — the order total is ALWAYS derived, never typed. */
export function itemsTotal(items: readonly Pick<OrderItem, "qty" | "price">[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

/** Compact "3 items" / "1 item" label. */
export function itemLabel(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

/** Short, human-readable summary of what an order contains. */
export function summarizeItems(items: readonly OrderItem[], max = 2): string {
  if (items.length === 0) return "No items";
  const names = items.slice(0, max).map((item) => item.productName || "Line item");
  const suffix = items.length > max ? ` +${items.length - max}` : "";
  return `${names.join(", ")}${suffix}`;
}

/**
 * Stable pseudo-id for a hand-typed line that has no catalog product, so
 * revenue-by-product still groups custom lines by name instead of merging
 * every one of them under an empty key.
 */
export function customProductId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `custom:${slug || "line"}`;
}

/** Receipt-friendly short reference (falls back to the id). */
export function orderReference(order: { id: string; reference?: string }): string {
  const ref = order.reference?.trim();
  if (ref) return ref;
  return `#${order.id.slice(-6).toUpperCase()}`;
}
