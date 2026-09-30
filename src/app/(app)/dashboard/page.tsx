import type { Metadata } from "next";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { MrrChartCard } from "@/components/dashboard/MrrChartCard";
import { RevenueTargetCard } from "@/components/dashboard/RevenueTargetCard";
import { RecentOrdersCard } from "@/components/dashboard/RecentOrdersCard";
import { TopCustomersCard } from "@/components/dashboard/TopCustomersCard";
import { ActivityFeedCard } from "@/components/dashboard/ActivityFeedCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { WorkspaceSummary } from "@/components/dashboard/WorkspaceSummary";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Live MRR, customers, orders and revenue for your workspace.",
  alternates: { canonical: "/dashboard" },
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardGreeting />
      <WorkspaceSummary />
      <MetricCards />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <MrrChartCard />
        </div>
        <div className="min-w-0">
          <RevenueTargetCard />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <RecentOrdersCard />
        </div>
        <div className="min-w-0">
          <QuickActionsCard />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0">
          <TopCustomersCard />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <ActivityFeedCard />
        </div>
      </div>
    </div>
  );
}
