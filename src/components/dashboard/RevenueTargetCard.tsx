"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { GoalFormModal } from "@/components/dashboard/GoalFormModal";
import { useBusiness } from "@/hooks/useBusinessData";
import {
  computeGoalCurrent,
  formatCurrency,
  formatMetric,
  goalProgress,
  recognizedRevenue,
} from "@/lib/calculations";
import type { BusinessGoal } from "@/types/business";

const GOAL_LABEL: Record<string, string> = {
  revenue: "Revenue",
  customers: "Customers",
  orders: "Orders",
};

/**
 * Revenue vs Target.
 *
 * Uses the most recently created goal that can be evaluated from real data.
 * When no goal exists (or the target is 0) the card shows an explicit
 * "no target set" state instead of 0%.
 */
export function RevenueTargetCard() {
  const { goals, customers, orders, business } = useBusiness();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessGoal | null>(null);

  const revenue = recognizedRevenue(orders);
  const evaluable = goals
    .filter((goal) => goal.target > 0)
    .sort((a, b) => b.deadline.localeCompare(a.deadline));

  const goal = evaluable[0];

  function openEditor(target: BusinessGoal | null) {
    setEditing(target);
    setEditorOpen(true);
  }

  const editor = editorOpen ? (
    <GoalFormModal
      open
      goal={editing}
      onClose={() => {
        setEditorOpen(false);
        setEditing(null);
      }}
    />
  ) : null;

  if (!goal) {
    return (
      <Card className="flex flex-col">
        <CardHeader title="Revenue vs target" description="Track progress toward a goal" />
        <CardContent>
          <EmptyState
            icon={<Target className="size-5" />}
            title="No target set yet"
            description="Set a revenue, customer or order target and this card tracks real progress against it."
            action={
              <Button size="sm" variant="outline" onClick={() => openEditor(null)}>
                Set a target
              </Button>
            }
          />
        </CardContent>
        {editor}
      </Card>
    );
  }

  const current = computeGoalCurrent(goal.type, { customers, orders, revenue });
  const progress = goalProgress({ ...goal, current });
  const isCurrency = goal.type === "revenue";

  const format = (value: number) =>
    isCurrency ? formatCurrency(value, business.currency) : formatMetric(value);

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Revenue vs target"
        description={`${GOAL_LABEL[goal.type] ?? "Target"} · due ${goal.deadline}`}
        action={
          <button
            type="button"
            onClick={() => openEditor(goal)}
            className="rounded-md text-xs font-medium text-primary transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Manage
          </button>
        }
      />

      <CardContent className="flex flex-1 flex-col justify-center gap-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Current</p>
            <p className="mt-0.5 text-3xl font-semibold tabular-nums text-foreground">
              {format(current)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Target</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
              {format(goal.target)}
            </p>
          </div>
        </div>

        <ProgressBar
          value={progress.percent}
          label={goal.title}
          caption={`${format(current)} of ${format(goal.target)}`}
          tone={progress.complete ? "success" : "primary"}
          size="lg"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {progress.complete
              ? "Target reached"
              : `${format(progress.remaining)} to go`}
          </span>
          <span>
            {progress.daysLeft >= 0
              ? `${formatMetric(progress.daysLeft)} days left`
              : `${formatMetric(Math.abs(progress.daysLeft))} days overdue`}
          </span>
        </div>
      </CardContent>
      {editor}
    </Card>
  );
}

export default RevenueTargetCard;
