"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";

/* framer-motion is only used by the Logo mark; loaded after hydration so the
   first paint never depends on its chunk being present. */
const Logo = dynamic(
  () => import("@/components/brand/Logo").then((m) => m.Logo),
  {
    ssr: false,
    loading: () => <div className="h-7 w-7" aria-hidden="true" />,
  },
);

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Slide-in navigation drawer for <1024px viewports.
 * Locks background scroll, closes on Escape and on route change.
 */
export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Close whenever the route changes.
  const closeRef = onClose;
  useEffect(() => {
    closeRef();
  }, [pathname, closeRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-fade-in"
      />

      <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-card animate-fade-in">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <Logo size={28} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-slim">
          <Sidebar onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}

export default MobileNav;
