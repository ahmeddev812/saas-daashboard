"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LineChart,
  Package,
  Receipt,
  Settings,
  Users,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Marks the route as active for the current path. */
  match?: (pathname: string) => boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const startsWith = (prefix: string) => (pathname: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, match: startsWith("/dashboard") },
      { href: "/revenue", label: "Revenue", icon: LineChart, match: startsWith("/revenue") },
      { href: "/analytics", label: "Analytics", icon: BarChart3, match: startsWith("/analytics") },
      { href: "/reports", label: "Reports", icon: FileText, match: startsWith("/reports") },
    ],
  },
  {
    label: "Operate",
    items: [
      { href: "/customers", label: "Customers", icon: Users, match: startsWith("/customers") },
      { href: "/products", label: "Products", icon: Package, match: startsWith("/products") },
      { href: "/orders", label: "Orders", icon: Receipt, match: startsWith("/orders") },
      { href: "/team", label: "Team", icon: UsersRound, match: startsWith("/team") },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/settings", label: "Settings", icon: Settings, match: startsWith("/settings") },
    ],
  },
];

export const FLAT_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export function isActiveNavItem(item: NavItem, pathname: string): boolean {
  return item.match ? item.match(pathname) : pathname === item.href;
}

export interface SidebarProps {
  /** Called after a navigation (used to close the mobile drawer). */
  onNavigate?: () => void;
  className?: string;
}

/**
 * Desktop sidebar.
 * Rendered inline at >=1024px and inside the mobile drawer below that.
 */
export function Sidebar({ onNavigate, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn("flex h-full flex-col gap-6 overflow-y-auto scrollbar-slim px-3 py-5", className)}
    >
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          <ul className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active = isActiveNavItem(item, pathname);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      active
                        ? "gradient-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="mt-auto rounded-xl border border-border bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">Local-first demo</p>
        <p className="mt-1">
          All data lives in this browser&apos;s localStorage. Nothing is uploaded.
        </p>
      </div>
    </nav>
  );
}

export default Sidebar;
