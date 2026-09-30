"use client";

/**
 * ATLARIS ToastProvider — context-based notifications.
 * No extra packages: a small React context renders an accessible live region.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { generateId } from "@/lib/id";

export type ToastVariant = "success" | "info" | "warning" | "error";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** Milliseconds before auto-dismiss. 0 keeps it until dismissed. */
  duration: number;
}

export interface ToastInput {
  title: string;
  description?: string;
  duration?: number;
}

export interface ToastContextValue {
  toasts: Toast[];
  /** Low-level API. */
  push: (input: ToastInput & { variant: ToastVariant }) => string;
  success: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4200;
const MAX_VISIBLE = 4;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback<ToastContextValue["push"]>(
    (input) => {
      const id = generateId();
      const toast: Toast = {
        id,
        variant: input.variant,
        title: input.title,
        description: input.description,
        duration: input.duration ?? DEFAULT_DURATION,
      };

      setToasts((prev) => [...prev, toast].slice(-MAX_VISIBLE));

      if (toast.duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => {
            timers.current.delete(id);
            setToasts((prev) => prev.filter((t) => t.id !== id));
          }, toast.duration),
        );
      }
      return id;
    },
    [],
  );

  const success = useCallback(
    (title: string, description?: string): string => push({ variant: "success", title, description }),
    [push],
  );
  const info = useCallback(
    (title: string, description?: string): string => push({ variant: "info", title, description }),
    [push],
  );
  const warning = useCallback(
    (title: string, description?: string): string => push({ variant: "warning", title, description }),
    [push],
  );
  const error = useCallback(
    (title: string, description?: string): string => push({ variant: "error", title, description }),
    [push],
  );

  const clear = useCallback(() => {
    for (const timer of timers.current.values()) clearTimeout(timer);
    timers.current.clear();
    setToasts([]);
  }, []);

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const timer of map.values()) clearTimeout(timer);
      map.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, push, success, info, warning, error, dismiss, clear }),
    [toasts, push, success, info, warning, error, dismiss, clear],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider> (see src/app/providers.tsx).");
  }
  return ctx;
}
