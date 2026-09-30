"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { CornerDownLeft, Package, Receipt, Search, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useBusiness } from "@/hooks/useBusinessData";
import { useWindowEvent, useChangedKey } from "@/hooks/useMounted";
import {
  SEARCH_GROUP_LABELS,
  buildSearchResults,
  searchResults,
  totalMatches,
  type SearchGroup,
  type SearchResult,
} from "@/components/search/searchIndex";

const GROUP_ICONS: Record<SearchGroup, LucideIcon> = {
  customers: UserRound,
  products: Package,
  orders: Receipt,
};

/**
 * ⌘K / Ctrl+K command palette.
 *
 * Opens from the global shortcut or the "atlaris:open-search" event dispatched
 * by the top bar. Searches customers, products and orders from shared business
 * state — nothing is queried over the network.
 */
export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { customers, products, orders } = useBusiness();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(
    () => buildSearchResults({ customers, products, orders }),
    [customers, products, orders],
  );

  const groups = useMemo(
    () => searchResults(results, { customers, products, orders }, query),
    [results, customers, products, orders, query],
  );

  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const count = totalMatches(groups);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const openPalette = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
  }, []);

  useWindowEvent("atlaris:open-search", openPalette);

  useWindowEvent("keydown", (event) => {
    const key = (event as KeyboardEvent).key;
    if ((event as KeyboardEvent).metaKey || (event as KeyboardEvent).ctrlKey) {
      if (key === "k" || key === "K") {
        event.preventDefault();
        if (open) close();
        else openPalette();
      }
    }
  });

  // Close whenever the route changes (Enter navigation, sidebar click, back).
  useChangedKey(pathname, () => {
    if (open) close();
  });

  // Keep the highlighted row inside view while arrowing.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const row = listRef.current.querySelector<HTMLElement>(`[data-index="${active}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [open, active, query]);

  const navigate = useCallback(
    (result: SearchResult | undefined) => {
      if (!result) return;
      close();
      router.push(result.href);
    },
    [close, router],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (flat.length > 0) setActive((index) => (index + 1) % flat.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (flat.length > 0) setActive((index) => (index - 1 + flat.length) % flat.length);
      } else if (event.key === "Enter") {
        event.preventDefault();
        navigate(flat[active]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        // First Escape clears the query, second Escape closes the palette.
        if (query.trim() !== "") {
          setQuery("");
          setActive(0);
          return;
        }
        close();
      }
    },
    [active, close, flat, navigate, query],
  );

  if (typeof document === "undefined") return null;

  const renderGroups = groups.filter((group) => group.items.length > 0);
  let runningIndex = 0;

  return createPortal(
    open ? (
      <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          aria-hidden="true"
          onClick={close}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-label="Global search"
          className="relative w-full max-w-xl overflow-hidden rounded-panel border border-border bg-card shadow-card animate-fade-in-up"
        >
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search customers, products, orders…"
              aria-label="Search customers, products and orders"
              role="combobox"
              aria-controls="search-results"
              aria-expanded={true}
              aria-autocomplete="list"
              aria-activedescendant={flat[active] ? `search-result-${active}` : undefined}
              autoComplete="off"
              spellCheck={false}
              autoFocus
              className="h-14 w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="button"
              onClick={close}
              title="Close search"
              className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Esc
            </button>
          </div>

          <div
            id="search-results"
            role="listbox"
            aria-label="Search results"
            ref={listRef}
            className="max-h-[50vh] overflow-y-auto scrollbar-slim p-2"
          >
            {renderGroups.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <Search className="mx-auto size-8 text-muted-foreground/50" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-foreground">No results found</p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Nothing matched “{query}”. Try an email address, a product name or a reference
                  like ORD-.
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Press <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">Esc</kbd>{" "}
                  to close or clear the query.
                </p>
              </div>
            ) : (
              renderGroups.map((group) => {
                const Icon = GROUP_ICONS[group.group];
                const items = group.items.map((item) => {
                  const index = runningIndex;
                  runningIndex += 1;
                  const isActive = index === active;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`search-result-${index}`}
                      role="option"
                      data-index={index}
                      aria-selected={isActive}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => navigate(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                        isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-primary-foreground" : "text-muted-foreground",
                        )}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{item.title}</span>
                        <span
                          className={cn(
                            "block truncate text-xs",
                            isActive ? "text-primary-foreground/80" : "text-muted-foreground",
                          )}
                        >
                          {item.subtitle}
                        </span>
                      </span>
                      {isActive ? (
                        <CornerDownLeft className="size-4 shrink-0 opacity-80" aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                });

                return (
                  <div key={group.group} className="mb-1 last:mb-0">
                    <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {SEARCH_GROUP_LABELS[group.group]}
                    </p>
                    <div className="flex flex-col gap-0.5">{items}</div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
            <span>
              <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">↑</kbd>
              <kbd className="ml-1 rounded border border-border bg-background px-1 py-0.5 font-mono">↓</kbd>{" "}
              navigate ·{" "}
              <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">↵</kbd>{" "}
              open ·{" "}
              <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">Esc</kbd>{" "}
              close
            </span>
            <span>
              {count} {count === 1 ? "match" : "matches"}
            </span>
          </div>
        </div>
      </div>
    ) : null,
    document.body,
  );
}

export default CommandPalette;
