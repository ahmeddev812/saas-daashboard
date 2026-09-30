"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Package,
  Plus,
  Receipt,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useBusiness, useBusinessData } from "@/hooks/useBusinessData";
import { useToast } from "@/context/ToastContext";
import { buildSampleData } from "@/lib/seed";

const ACTIONS = [
  {
    href: "/customers",
    label: "Add customer",
    description: "Record a new account",
    icon: Users,
  },
  {
    href: "/products",
    label: "Add product",
    description: "Extend your catalogue",
    icon: Package,
  },
  {
    href: "/orders",
    label: "New order",
    description: "Log a sale or invoice",
    icon: Receipt,
  },
  {
    href: "/settings",
    label: "Import data",
    description: "Restore a JSON backup",
    icon: Upload,
  },
] as const;

/** Shortcuts to the four things people do most from the dashboard. */
export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader
        title="Quick actions"
        description="Jump straight into a workflow"
      />
      <CardContent>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"
                  >
                    <Icon className="size-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-sm font-medium text-foreground group-hover:text-primary">
                      {action.label}
                      <ArrowUpRight
                        className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

/** Inline "add your first record" prompt shown when the workspace is empty. */
export function EmptyWorkspaceCta() {
  const { business, hydrated } = useBusinessData();
  const {
    actions: { loadDataset },
  } = useBusiness();
  const { success, error: toastError } = useToast();
  const [busy, setBusy] = useState(false);

  function loadDemoData() {
    if (busy || !hydrated) return;
    setBusy(true);
    try {
      loadDataset({
        ...buildSampleData(),
        business: { ...business, onboardingDone: true },
      });
      success("Demo data loaded", "90 days of sample customers, products and orders are now in this browser.");
    } catch {
      toastError("Could not load demo data", "Your existing records were left untouched.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-panel border border-dashed border-primary/40 bg-primary-soft/40 px-5 py-4">
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg gradient-primary text-primary-foreground">
        <Plus className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Your workspace is empty</p>
        <p className="text-sm text-muted-foreground">
          Add a customer, product and order — every metric on this page derives from them.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        loading={busy}
        onClick={loadDemoData}
        icon={<Sparkles className="size-4" aria-hidden="true" />}
      >
        Load demo data
      </Button>
      <Link
        href="/customers"
        className="inline-flex h-9 shrink-0 items-center rounded-lg gradient-primary px-4 text-sm font-medium text-primary-foreground shadow-glow transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Add your first customer
      </Link>
    </div>
  );
}

export default QuickActionsCard;
