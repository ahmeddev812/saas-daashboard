import type { Metadata } from "next";
import { CustomersClient } from "@/components/customers/CustomersClient";

export const metadata: Metadata = {
  title: "Customers",
  description: "Search, filter and maintain your book of business.",
  alternates: { canonical: "/customers" },
};

export default function CustomersPage() {
  return <CustomersClient />;
}
