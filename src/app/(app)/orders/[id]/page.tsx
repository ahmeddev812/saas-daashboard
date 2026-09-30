import type { Metadata } from "next";
import { OrderDetailClient } from "@/components/orders/OrderDetailClient";

export const metadata: Metadata = {
  title: "Order",
  description: "Receipt, line items, status workflow and customer link for this order.",
  alternates: { canonical: "/orders" },
};

export default function OrderDetailPage() {
  return <OrderDetailClient />;
}
