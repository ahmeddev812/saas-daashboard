import type { Metadata } from "next";
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Revenue trends, customer growth, product performance and conversion funnel.",
  alternates: { canonical: "/analytics" },
};

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
