"use client";

import { useBusinessData } from "@/hooks/useBusinessData";
import { EmptyWorkspaceCta } from "@/components/dashboard/QuickActionsCard";

/**
 * Shown above the KPI cards when the workspace holds no source records yet.
 * Disappears as soon as any customer, product or order exists.
 */
export function WorkspaceSummary() {
  const { customers, products, orders, hydrated } = useBusinessData();

  if (!hydrated) return null;
  if (customers.length > 0 || products.length > 0 || orders.length > 0) return null;

  return <EmptyWorkspaceCta />;
}

export default WorkspaceSummary;
