"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useBusiness } from "@/hooks/useBusinessData";
import { todayKey } from "@/lib/dates";
import { isEmail } from "@/lib/auth";
import {
  TEAM_ROLES,
  type TeamMember,
  type TeamMemberStatus,
  type TeamRole,
} from "@/types/business";

export interface TeamFormModalProps {
  open: boolean;
  /** Present → edit mode; absent → invite/create mode. */
  member?: TeamMember | null;
  /** Forces the initial status to "invited" for the invite workflow. */
  invite?: boolean;
  onClose: () => void;
}

interface FormState {
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  joinedAt: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  name: "",
  email: "",
  role: "member",
  status: "invited",
  joinedAt: "",
};

function toFormState(member: TeamMember | null | undefined, invite?: boolean): FormState {
  if (!member) {
    return {
      ...EMPTY,
      status: invite === true ? "invited" : "active",
      joinedAt: invite === true ? "" : todayKey(),
    };
  }
  return {
    name: member.name,
    email: member.email,
    role: member.role,
    status: member.status,
    joinedAt: member.joinedAt,
  };
}

const ROLE_OPTIONS = TEAM_ROLES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

const STATUS_OPTIONS: { value: TeamMemberStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "inactive", label: "Inactive" },
];

/**
 * Create / invite / edit dialog for one team member.
 * Mounted only while open, so the draft always starts from the target record.
 */
export function TeamFormModal({ open, member, invite, onClose }: TeamFormModalProps) {
  const {
    team,
    actions: { addTeamMember, updateTeamMember },
    hydrated,
  } = useBusiness();
  const [state, setState] = useState<FormState>(() => toFormState(member, invite));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  if (!open || !hydrated) return null;

  const isEdit = Boolean(member);
  const isInvite = !isEdit && invite === true;
  // The owner role is never assignable here — it only sticks if already held.
  const roleOptions =
    isEdit && member?.role === "owner"
      ? ROLE_OPTIONS
      : ROLE_OPTIONS.filter((option) => option.value !== "owner");

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
    if (!isEmail(state.email)) found.email = "Enter a valid email address.";

    const duplicate = team.some(
      (entry) => entry.email.toLowerCase() === state.email.trim().toLowerCase() && entry.id !== member?.id,
    );
    if (duplicate) found.email = "That email is already on the team.";

    if (isEdit && state.role === "owner" && member?.role !== "owner") {
      found.role = "Only an existing owner can hold the owner role.";
    }

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
      email: state.email.trim().toLowerCase(),
      role: state.role,
      status: state.status,
      joinedAt: state.joinedAt || todayKey(),
    };

    if (isEdit && member) updateTeamMember(member.id, payload);
    else addTeamMember(payload);

    onClose();
  }

  return (
    <Modal
      open
      onClose={saving ? () => undefined : onClose}
      title={
        isEdit
          ? `Edit ${member?.name ?? "team member"}`
          : isInvite
            ? "Invite a teammate"
            : "Add a team member"
      }
      description={
        isEdit
          ? "Roles are demo-only — they are not enforced anywhere in the product."
          : "No email is sent. The invite is stored locally in this browser."
      }
      dismissOnBackdrop={!saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="team-form" loading={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : isInvite ? "Send invite" : "Add member"}
          </Button>
        </>
      }
    >
      <form id="team-form" onSubmit={handleSubmit} noValidate className="space-y-5">
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
            placeholder="teammate@company.com"
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Select
            label="Role"
            value={state.role}
            onChange={(event) => patch({ role: event.target.value as TeamRole })}
            options={roleOptions}
            error={errors.role}
            hint="Owner, admin or member."
          />
          <Select
            label="Status"
            value={state.status}
            onChange={(event) => patch({ status: event.target.value as TeamMemberStatus })}
            options={STATUS_OPTIONS}
            error={errors.status}
            disabled={isInvite}
          />
          <Input
            label="Joined"
            type="date"
            value={state.joinedAt}
            onChange={(event) => patch({ joinedAt: event.target.value })}
            error={errors.joinedAt}
            disabled={isInvite}
          />
        </div>

        {isInvite ? (
          <p className="rounded-xl border border-primary/40 bg-primary-soft/50 px-3.5 py-2.5 text-sm text-foreground">
            Invited teammates appear in the list with an <strong>Invited</strong> badge. This is a
            demo workflow — no email leaves this browser and no invite link is generated.
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

export default TeamFormModal;
