"use client";

import { useCallback, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { CommandPalette } from "@/components/search/CommandPalette";

export interface AppShellProps {
  children: ReactNode;
}

/**
 * Authenticated application frame.
 *
 *   >=1024px : fixed sidebar + top bar + content
 *   768–1024 : top bar + slide-in drawer (no permanent sidebar)
 *   <768px   : single column, top bar + drawer, full-width content
 */
export function AppShell({ children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openMenu = useCallback(() => setMenuOpen(true), []);

  return (
    <AuthGuard>
      <div className="flex min-h-dvh w-full flex-col bg-background">
        <TopBar onOpenMenu={openMenu} />
        <MobileNav open={menuOpen} onClose={closeMenu} />
        <CommandPalette />

        <div className="flex w-full flex-1 items-stretch">
          {/* Permanent sidebar only on large screens */}
          <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 border-r border-border bg-card/50 lg:block print:hidden">
            <Sidebar />
          </aside>

          <main
            id="main-content"
            className={cn("min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 print:px-0 print:py-0")}
          >
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

export default AppShell;
