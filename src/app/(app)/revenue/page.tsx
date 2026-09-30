import type { Metadata } from "next";
import { RevenueClient } from "@/components/revenue/RevenueClient";

export const metadata: Metadata = {
  title: "Revenue",
  description: "MRR, ARR, ARPU, churn, LTV, CAC and revenue breakdowns.",
  alternates: { canonical: "/revenue" },
};

export default function RevenuePage() {
  return <RevenueClient />;
}
