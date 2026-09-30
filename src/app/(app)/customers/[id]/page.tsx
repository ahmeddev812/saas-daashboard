import type { Metadata } from "next";
import { CustomerDetailClient } from "@/components/customers/CustomerDetailClient";

export const metadata: Metadata = {
  title: "Customer",
  description: "Customer profile, order history, MRR history and notes.",
  alternates: { canonical: "/customers" },
};

export default function CustomerDetailPage() {
  return <CustomerDetailClient />;
}
