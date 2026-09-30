import type { Metadata } from "next";
import { ReportsClient } from "@/components/reports/ReportsClient";

export const metadata: Metadata = {
  title: "Reports",
  description: "Pre-built reports with CSV and JSON export over any date range.",
  alternates: { canonical: "/reports" },
};

export default function ReportsPage() {
  return <ReportsClient />;
}
