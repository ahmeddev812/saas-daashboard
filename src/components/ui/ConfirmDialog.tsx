"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  /** Label of the confirming action. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** `destructive` renders a red confirm button. */
  tone?: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Extra content, e.g. what will be deleted. */
  children?: React.ReactNode;
}

/**
 * Delete / destructive-action confirmation.
 * Focus lands on Cancel so a stray Enter never destroys data.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onCancel}
      title={title}
      description={description}
      size="sm"
      dismissOnBackdrop={!loading}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading} data-autofocus>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "destructive" ? "destructive" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export default ConfirmDialog;
