"use client";

import { useMemo } from "react";
import { History } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useBusiness } from "@/hooks/useBusinessData";
import { formatRelative } from "@/lib/dates";
import type { ActivityAction, TeamMember } from "@/types/business";

const ACTION_TONE: Record<ActivityAction, BadgeTone> = {
  create: "success",
  update: "info",
  delete: "destructive",
  status_change: "warning",
  login: "neutral",
  logout: "neutral",
  import: "accent",
  export: "accent",
  reset: "destructive",
  invite: "primary",
};

export interface MemberActivityModalProps {
  open: boolean;
  member: TeamMember | null;
  onClose: () => void;
}

/** Activity log for a single member — entries written by or about them. */
export function MemberActivityModal({ open, member, onClose }: MemberActivityModalProps) {
  const { activities } = useBusiness();

  const entries = useMemo(() => {
    if (!member) return [];
    const name = member.name.trim().toLowerCase();
    return activities
      .filter(
        (entry) =>
          entry.entityId === member.id || entry.actor.trim().toLowerCase() === name,
      )
      .slice()
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 50);
  }, [activities, member]);

  if (!open || !member) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Activity · ${member.name}`}
      description="The latest entries this member triggered or is named in."
      size="lg"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      {entries.length === 0 ? (
        <EmptyState
          icon={<History className="size-5" />}
          title="No activity yet"
          description="Actions performed by this member will show up here."
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{entry.description}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatRelative(entry.timestamp)} · by {entry.actor}
                </p>
              </div>
              <Badge tone={ACTION_TONE[entry.action]} srPrefix="Action:">
                {entry.action.replace("_", " ")}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export default MemberActivityModal;
