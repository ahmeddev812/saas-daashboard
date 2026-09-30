"use client";

import { useMemo, useState } from "react";
import { History, Pencil, Search, Trash2, UserPlus, Users, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TeamFormModal } from "@/components/team/TeamFormModal";
import { MemberActivityModal } from "@/components/team/MemberActivityModal";
import { useBusiness } from "@/hooks/useBusinessData";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/dates";
import { TEAM_ROLES, type TeamMember, type TeamMemberStatus, type TeamRole } from "@/types/business";

const ROLE_TONE: Record<TeamRole, BadgeTone> = {
  owner: "primary",
  admin: "accent",
  member: "neutral",
};

const STATUS_TONE: Record<TeamMemberStatus, BadgeTone> = {
  active: "success",
  invited: "info",
  inactive: "neutral",
};

const ROLE_OPTIONS = TEAM_ROLES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

const STATUS_OPTIONS: { value: TeamMemberStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "inactive", label: "Inactive" },
];

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function TeamClient() {
  const {
    team,
    activities,
    actions: { deleteTeamMember },
    hydrated,
  } = useBusiness();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [activityFor, setActivityFor] = useState<TeamMember | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TeamMember | null>(null);

  const activityCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of activities) {
      if (!entry.entityId) continue;
      counts.set(entry.entityId, (counts.get(entry.entityId) ?? 0) + 1);
    }
    return counts;
  }, [activities]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return team.filter((member) => {
      if (roleFilter !== "all" && member.role !== roleFilter) return false;
      if (statusFilter !== "all" && member.status !== statusFilter) return false;
      if (query === "") return true;
      return (
        member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query)
      );
    });
  }, [team, search, roleFilter, statusFilter]);

  const filtersActive = search.trim() !== "" || roleFilter !== "all" || statusFilter !== "all";

  const counts = useMemo(
    () => ({
      active: team.filter((member) => member.status === "active").length,
      invited: team.filter((member) => member.status === "invited").length,
      admins: team.filter((member) => member.role !== "member").length,
    }),
    [team],
  );

  function clearFilters() {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
  }

  function confirmDelete() {
    const member = pendingDelete;
    if (!member) return;
    if (deleteTeamMember(member.id)) {
      success("Member removed", `${member.name} no longer has access to this workspace.`);
    } else {
      toastError("Could not remove member", "The workspace owner cannot be removed.");
    }
    setPendingDelete(null);
  }

  const columns: DataTableColumn<TeamMember>[] = [
    {
      id: "name",
      header: "Member",
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary"
          >
            {row.avatar || initialsFrom(row.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-foreground">{row.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{row.email}</span>
          </span>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      sortValue: (row) => row.role,
      mobileLabel: "Role",
      cell: (row) => (
        <Badge tone={ROLE_TONE[row.role]} srPrefix="Role:">
          {row.role}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (row) => row.status,
      mobileLabel: "Status",
      cell: (row) => (
        <Badge tone={STATUS_TONE[row.status]} srPrefix="Status:">
          {row.status}
        </Badge>
      ),
    },
    {
      id: "joined",
      header: "Joined",
      sortValue: (row) => row.joinedAt,
      hideBelow: "md",
      mobileLabel: "Joined",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.joinedAt)}</span>,
    },
    {
      id: "activity",
      header: "Activity",
      align: "right",
      sortValue: (row) => activityCounts.get(row.id) ?? 0,
      hideBelow: "lg",
      mobileLabel: "Activity",
      cell: (row) => (
        <span className="tabular-nums text-muted-foreground">
          {activityCounts.get(row.id) ?? 0}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (row) => (
        <div className="flex justify-end gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            aria-label={`View activity for ${row.name}`}
            title="Activity log"
            onClick={() => setActivityFor(row)}
          >
            <History className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Edit ${row.name}`}
            title="Edit member"
            onClick={() => {
              setEditing(row);
              setInviting(false);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Remove ${row.name}`}
            title={row.role === "owner" ? "The owner cannot be removed" : "Remove member"}
            disabled={row.role === "owner"}
            className={row.role === "owner" ? "" : "text-destructive hover:bg-destructive-soft"}
            onClick={() => setPendingDelete(row)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          label="Search members"
          containerClassName="sm:max-w-xs sm:flex-1"
          placeholder="Name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          prefix={<Search className="size-4" aria-hidden="true" />}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Select
            label="Role"
            containerClassName="w-auto"
            className="h-10 min-w-28 pr-9"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            options={[{ value: "all", label: "All roles" }, ...ROLE_OPTIONS]}
          />
          <Select
            label="Status"
            containerClassName="w-auto"
            className="h-10 min-w-32 pr-9"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[{ value: "all", label: "All statuses" }, ...STATUS_OPTIONS]}
          />
          {filtersActive ? (
            <Button variant="ghost" size="sm" onClick={clearFilters} icon={<X className="size-4" />}>
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} of {team.length} teammate{team.length === 1 ? "" : "s"}
        {filtersActive ? " match your filters" : ""}.
      </p>
    </div>
  );

  const emptyState = filtersActive ? (
    <EmptyState
      icon={<Search className="size-5" />}
      title="No members match those filters"
      description="Try another name, or clear the filters to see the whole team."
      action={
        <Button size="sm" variant="outline" onClick={clearFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={<Users className="size-5" />}
      title="No teammates yet"
      description="Invite teammates to see who is working in this workspace. This is a demo workflow — no email is ever sent."
      action={
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setInviting(true);
            setFormOpen(true);
          }}
        >
          Invite teammate
        </Button>
      }
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operate"
        title="Team"
        description="Owner, admin and member roles with a per-member activity log."
        actions={
          <>
            <Button
              variant="outline"
              icon={<UserPlus className="size-4" />}
              onClick={() => {
                setEditing(null);
                setInviting(false);
                setFormOpen(true);
              }}
            >
              Add member
            </Button>
            <Button
              icon={<UserPlus className="size-4" />}
              onClick={() => {
                setEditing(null);
                setInviting(true);
                setFormOpen(true);
              }}
            >
              Invite teammate
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card flush className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {counts.active}
          </p>
        </Card>
        <Card flush className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Invited
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {counts.invited}
          </p>
        </Card>
        <Card flush className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Admins &amp; owners
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {counts.admins}
          </p>
        </Card>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-info/40 bg-info-soft px-4 py-3">
        <p className="text-sm leading-relaxed text-foreground">
          <strong>Demo roles only.</strong> Owner, admin and member are UI labels for this prototype —
          they are not enforced as permissions anywhere, and invites never leave this browser.
        </p>
      </div>

      <DataTable
        caption="Team members"
        rows={hydrated ? filtered : []}
        columns={columns}
        getRowId={(row) => row.id}
        defaultSort={{ id: "name", direction: "asc" }}
        toolbar={toolbar}
        emptyState={emptyState}
      />

      {formOpen ? (
        <TeamFormModal
          open
          member={editing}
          invite={inviting}
          onClose={() => {
            setFormOpen(false);
            setInviting(false);
            setEditing(null);
          }}
        />
      ) : null}

      <MemberActivityModal
        open={activityFor !== null}
        member={activityFor}
        onClose={() => setActivityFor(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete ? `Remove ${pendingDelete.name}?` : "Remove member?"}
        description="They lose access to this workspace demo. Their past activity entries stay in the log for context."
        confirmLabel="Remove"
        tone="destructive"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default TeamClient;
