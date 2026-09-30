"use client";

/**
 * Toast UI surface.
 *
 * The state/queue lives in `src/context/ToastContext.tsx` (a plain React
 * context — no extra packages). This module owns the presentational layer so
 * the design stays in `components/ui` where the rest of the primitives live.
 */

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast, type Toast, type ToastVariant } from "@/context/ToastContext";

const VARIANT_META: Record<
  ToastVariant,
  { icon: typeof Info; label: string; bar: string; iconClass: string }
> = {
  success: { icon: CheckCircle2, label: "Success", bar: "bg-success", iconClass: "text-success" },
  info: { icon: Info, label: "Information", bar: "bg-info", iconClass: "text-info" },
  warning: { icon: AlertTriangle, label: "Warning", bar: "bg-warning", iconClass: "text-warning" },
  error: { icon: AlertCircle, label: "Error", bar: "bg-destructive", iconClass: "text-destructive" },
};

export interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

/** A single notification card. */
export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const meta = VARIANT_META[toast.variant];
  const Icon = meta.icon;

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      className="pointer-events-auto flex w-full max-w-sm animate-fade-in-up overflow-hidden rounded-xl border border-border bg-card shadow-card"
    >
      <span className={cn("w-1 shrink-0", meta.bar)} aria-hidden="true" />

      <div className="flex flex-1 items-start gap-3 p-3.5">
        <span
          className={cn(
            "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-muted",
            meta.iconClass,
          )}
          aria-hidden="true"
        >
          <Icon className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            <span className="sr-only">{meta.label}: </span>
            {toast.title}
          </p>
          {toast.description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{toast.description}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label={`Dismiss: ${toast.title}`}
          className="-mr-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Floating stack rendered once by the provider. */
export function ToastStack() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:right-0 sm:left-auto sm:items-end sm:p-6"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}

export { useToast };
