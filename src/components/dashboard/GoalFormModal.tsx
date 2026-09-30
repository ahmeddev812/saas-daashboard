"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useBusiness } from "@/hooks/useBusinessData";
import { addDays, todayKey, toDateKey } from "@/lib/dates";
import { type BusinessGoal, type GoalType } from "@/types/business";

const TYPE_OPTIONS: { value: GoalType; label: string }[] = [
  { value: "revenue", label: "Revenue" },
  { value: "customers", label: "Customers" },
  { value: "orders", label: "Orders" },
];

interface FormState {
  title: string;
  type: GoalType;
  target: string;
  deadline: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

function toFormState(goal: BusinessGoal | null): FormState {
  if (!goal) {
    return {
      title: "Quarterly revenue target",
      type: "revenue",
      target: "",
      deadline: toDateKey(addDays(new Date(), 90)),
    };
  }
  return {
    title: goal.title,
    type: goal.type,
    target: String(goal.target),
    deadline: goal.deadline,
  };
}

/**
 * Create / edit the revenue target shown on the dashboard.
 * Mounted only while open, so the draft always starts from the target goal.
 */
export function GoalFormModal({
  open,
  goal,
  onClose,
}: {
  open: boolean;
  goal?: BusinessGoal | null;
  onClose: () => void;
}) {
  const {
    actions: { addGoal, updateGoal },
    hydrated,
  } = useBusiness();
  const [state, setState] = useState<FormState>(() => toFormState(goal ?? null));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  if (!open || !hydrated) return null;

  const isEdit = Boolean(goal);

  function patch(partial: Partial<FormState>) {
    setState((prev) => ({ ...prev, ...partial }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(partial)) delete next[key as keyof FormState];
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const found: FieldErrors = {};
    if (state.title.trim().length < 3) found.title = "Give the target a short name.";
    const target = Number(state.target);
    if (!Number.isFinite(target) || target <= 0) found.target = "Enter a target greater than 0.";
    if (state.deadline === "") found.deadline = "Pick a deadline.";

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);

    const payload = {
      title: state.title.trim(),
      type: state.type,
      target,
      deadline: state.deadline,
    };

    if (goal) updateGoal(goal.id, payload);
    else addGoal(payload);

    onClose();
  }

  return (
    <Modal
      open
      onClose={saving ? () => undefined : onClose}
      title={isEdit ? "Edit target" : "Set a target"}
      description="Progress is calculated from real data — nothing here is invented."
      dismissOnBackdrop={!saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="goal-form" loading={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create target"}
          </Button>
        </>
      }
    >
      <form id="goal-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          label="Target name"
          value={state.title}
          onChange={(event) => patch({ title: event.target.value })}
          error={errors.title}
          data-autofocus
          required
        />

        <div className="grid gap-5 sm:grid-cols-3">
          <Select
            label="Measure"
            value={state.type}
            onChange={(event) => patch({ type: event.target.value as GoalType })}
            options={TYPE_OPTIONS}
            hint="Revenue, customers or orders."
          />
          <Input
            label="Target"
            type="number"
            min={1}
            step="any"
            inputMode="decimal"
            value={state.target}
            onChange={(event) => patch({ target: event.target.value })}
            error={errors.target}
            placeholder="50000"
            required
          />
          <Input
            label="Deadline"
            type="date"
            value={state.deadline}
            onChange={(event) => patch({ deadline: event.target.value })}
            error={errors.deadline}
            min={todayKey()}
            required
          />
        </div>
      </form>
    </Modal>
  );
}

export default GoalFormModal;
