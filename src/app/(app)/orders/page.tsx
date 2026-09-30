import type { Metadata } from "next";
import { OrdersClient } from "@/components/orders/OrdersClient";

export const metadata: Metadata = {
  title: "Orders",
  description: "Create, filter and manage orders through the pending → paid → fulfilled workflow.",
  alternates: { canonical: "/orders" },
};

export default function OrdersPage() {
  return <OrdersClient />;
}
