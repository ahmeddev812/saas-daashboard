"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useBusiness } from "@/hooks/useBusinessData";
import { todayKey } from "@/lib/dates";
import { isEmail } from "@/lib/auth";
import { CUSTOMER_STATUSES, PLAN_NAMES, type Customer, type CustomerStatus } from "@/types/business";

export interface CustomerFormModalProps {
  open: boolean;
  /** Present → edit mode; absent → create mode. */
  customer?: Customer | null;
  onClose: () => void;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
  plan: string;
  mrr: string;
  joinDate: string;
  lastActive: string;
  notes: string;
  tags: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  status: "active",
  plan: PLAN_NAMES[0] ?? "Free",
  mrr: "0",
  joinDate: todayKey(),
  lastActive: todayKey(),
  notes: "",
  tags: "",
};

function toFormState(customer: Customer | null | undefined): FormState {
  if (!customer) return EMPTY;
  return {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    company: customer.company,
    status: customer.status,
    plan: customer.plan,
    mrr: String(customer.mrr),
    joinDate: customer.joinDate,
    lastActive: customer.lastActive,
    notes: customer.notes,
    tags: customer.tags.join(", "),
  };
}

/**
 * Create / edit dialog for a single customer.
 *
 * The parent mounts this component only while the dialog is open, so state
 * always starts from the target record — no sync effect, no stale drafts.
 */
export function CustomerFormModal({ open, customer, onClose }: CustomerFormModalProps) {
  const { actions: { addCustomer, updateCustomer }, hydrated } = useBusiness();
  const [state, setState] = useState<FormState>(() => toFormState(customer));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  if (!open || !hydrated) return null;

  const isEdit = Boolean(customer);

  function patch(partial: Partial<FormState>) {
    setState((prev) => ({ ...prev, ...partial }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(partial)) delete next[key as keyof FormState];
      return next;
    });
  }

  function validate(): FieldErrors {
    const found: FieldErrors = {};
    if (state.name.trim().length < 2) found.name = "Enter a name of at least 2 characters.";
    if (state.email.trim() !== "" && !isEmail(state.email)) {
      found.email = "Enter a valid email address.";
    }

    const mrr = Number(state.mrr);
    if (!Number.isFinite(mrr) || mrr < 0) found.mrr = "MRR must be 0 or more.";
    if (state.joinDate === "") found.joinDate = "Pick a join date.";
    if (state.lastActive === "") found.lastActive = "Pick a last-active date.";

    return found;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);

    const payload = {
      name: state.name.trim(),
      email: state.email.trim(),
      phone: state.phone.trim(),
      company: state.company.trim(),
      status: state.status,
      plan: state.plan.trim() || "Free",
      mrr: Number(state.mrr),
      joinDate: state.joinDate,
      lastActive: state.lastActive,
      notes: state.notes.trim(),
      tags: state.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (isEdit && customer) updateCustomer(customer.id, payload);
    else addCustomer(payload);

    onClose();
  }

  return (
    <Modal
      open
      onClose={saving ? () => undefined : onClose}
      title={isEdit ? "Edit customer" : "New customer"}
      description={
        isEdit
          ? "Changes apply to every report and metric immediately."
          : "Add a customer to your book — all metrics derive from this record."
      }
      size="lg"
      dismissOnBackdrop={!saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="customer-form" loading={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create customer"}
          </Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Name"
            value={state.name}
            onChange={(event) => patch({ name: event.target.value })}
            error={errors.name}
            data-autofocus
            required
          />
          <Input
            label="Email"
            type="email"
            value={state.email}
            onChange={(event) => patch({ email: event.target.value })}
            error={errors.email}
            placeholder="jane@company.com"
          />
          <Input
            label="Phone"
            value={state.phone}
            onChange={(event) => patch({ phone: event.target.value })}
            placeholder="+1 555 0100"
          />
          <Input
            label="Company"
            value={state.company}
            onChange={(event) => patch({ company: event.target.value })}
            placeholder="Northwind Labs"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Select
            label="Status"
            value={state.status}
            onChange={(event) => patch({ status: event.target.value as CustomerStatus })}
            options={CUSTOMER_STATUSES.map((value) => ({
              value,
              label: value.charAt(0).toUpperCase() + value.slice(1),
            }))}
          />
          <Select
            label="Plan"
            value={state.plan}
            onChange={(event) => patch({ plan: event.target.value })}
            options={PLAN_NAMES.map((value) => ({ value, label: value }))}
          />
          <Input
            label="MRR"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={state.mrr}
            onChange={(event) => patch({ mrr: event.target.value })}
            error={errors.mrr}
            hint="Monthly recurring revenue."
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Join date"
            type="date"
            value={state.joinDate}
            onChange={(event) => patch({ joinDate: event.target.value })}
            error={errors.joinDate}
          />
          <Input
            label="Last active"
            type="date"
            value={state.lastActive}
            onChange={(event) => patch({ lastActive: event.target.value })}
            error={errors.lastActive}
          />
        </div>

        <Input
          label="Tags"
          value={state.tags}
          onChange={(event) => patch({ tags: event.target.value })}
          hint="Comma separated, e.g. enterprise, referral, priority."
          placeholder="enterprise, referral"
        />

        <Textarea
          label="Notes"
          rows={3}
          value={state.notes}
          onChange={(event) => patch({ notes: event.target.value })}
          placeholder="Context your team should see on the detail page."
        />
      </form>
    </Modal>
  );
}

export default CustomerFormModal;
