"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Package, Receipt, Search, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useBusiness } from "@/hooks/useBusinessData";
import {
  SEARCH_GROUP_LABELS,
  buildSearchResults,
  searchResults,
  totalMatches,
} from "@/components/search/searchIndex";

const GROUP_ICONS: Record<"customers" | "products" | "orders", LucideIcon> = {
  customers: UserRound,
  products: Package,
  orders: Receipt,
};

/**
 * Dedicated /search route — the full-page version of the ⌘K palette.
 * Shares `buildSearchResults` so both views always agree on what exists.
 */
export function SearchPageClient({ initialQuery = "" }: { initialQuery?: string }) {
  const { customers, products, orders } = useBusiness();
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(
    () => buildSearchResults({ customers, products, orders }),
    [customers, products, orders],
  );

  const groups = useMemo(
    () => searchResults(results, { customers, products, orders }, query, 20),
    [results, customers, products, orders, query],
  );

  const count = totalMatches(groups);
  const visible = groups.filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Workspace"
        title="Search"
        description="Find any customer, product or order. Results come from the data stored in this browser."
      />

      <Card flush className="p-3 sm:p-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/60 px-4">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email, product, category or ORD- reference…"
            aria-label="Search customers, products and orders"
            autoComplete="off"
            spellCheck={false}
            autoFocus
            className="h-12 w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
            ⌘K
          </kbd>
        </div>

        <p className="mt-3 px-1 text-xs text-muted-foreground" role="status" aria-live="polite">
          {query.trim() === ""
            ? `${count} records indexed across customers, products and orders.`
            : `${count} ${count === 1 ? "match" : "matches"} for “${query.trim()}”.`}
        </p>
      </Card>

      {visible.length === 0 ? (
        <Card className="text-center">
          <Search className="mx-auto size-9 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-4 text-base font-medium text-foreground">No results found</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Nothing matched “{query.trim()}”. Check the spelling, or search by reference (for
            example ORD-1041), email address or product category.
          </p>
          <Button variant="outline" className="mt-5" onClick={() => setQuery("")}>
            Clear search
          </Button>
        </Card>
      ) : (
        visible.map((group) => {
          const Icon = GROUP_ICONS[group.group];
          return (
            <Card key={group.group}>
              <div className="flex items-center gap-2 pb-3">
                <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-foreground">
                  {SEARCH_GROUP_LABELS[group.group]}
                </h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {group.items.length}
                </span>
              </div>

              <ul className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {item.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.subtitle}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-primary">
                        {SEARCH_GROUP_LABELS[group.group].slice(0, -1)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })
      )}
    </div>
  );
}

export default SearchPageClient;
