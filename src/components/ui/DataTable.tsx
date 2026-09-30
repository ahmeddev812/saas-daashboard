"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/EmptyState";

export type SortDirection = "asc" | "desc";

export interface SortState {
  id: string;
  direction: SortDirection;
}

export interface DataTableColumn<T> {
  /** Unique column id (also the default sort key). */
  id: string;
  header: ReactNode;
  /** Cell renderer. */
  cell: (row: T, index: number) => ReactNode;
  /** Sort comparator. Omit to make the column unsortable. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "center" | "right";
  /** Tailwind width class, e.g. "w-32". */
  width?: string;
  /** Hidden below this breakpoint (default: always visible). */
  hideBelow?: "sm" | "md" | "lg";
  /** Header-only label for stacked mobile rows. */
  mobileLabel?: string;
}

export interface DataTableProps<T> {
  rows: readonly T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  /** Rendered when `rows` is empty. */
  emptyState?: ReactNode;
  /** Controlled sort. Omit for internal state. */
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  /** Initial internal sort. */
  defaultSort?: SortState;
  /** Enables the checkbox column + toolbar slot. */
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Rendered above the table (filters, bulk actions, search). */
  toolbar?: ReactNode;
  /** Row click handler — rows stay keyboard accessible via the primary cell. */
  onRowClick?: (row: T) => void;
  /** Accessible name for the table. */
  caption: string;
  /** Reduces vertical padding for dense views. */
  compact?: boolean;
  className?: string;
}

const HIDE_CLASSES: Record<NonNullable<DataTableColumn<never>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

const ALIGN_CLASSES = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

/**
 * Sortable, responsive data table.
 *
 * - Desktop: semantic `<table>` with sortable headers (`aria-sort`).
 * - <768px: rows collapse into stacked cards using `mobileLabel`.
 * - Empty data renders the supplied EmptyState instead of a bare table.
 */
export function DataTable<T>({
  rows,
  columns,
  getRowId,
  emptyState,
  sort,
  onSortChange,
  defaultSort,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  toolbar,
  onRowClick,
  caption,
  compact = false,
  className,
}: DataTableProps<T>) {
  const [internalSort, setInternalSort] = useState<SortState | null>(defaultSort ?? null);
  const isControlled = sort !== undefined;
  const activeSort = isControlled ? sort : internalSort;

  const selection = useMemo(() => new Set(selectedIds), [selectedIds]);

  const sortedRows = useMemo(() => {
    if (!activeSort) return rows;
    const column = columns.find((c) => c.id === activeSort.id);
    if (!column?.sortValue) return rows;

    const accessor = column.sortValue;
    const factor = activeSort.direction === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * factor;
    });
  }, [rows, columns, activeSort]);

  const requestSort = (columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    if (!column?.sortValue) return;

    const next: SortState =
      activeSort?.id === columnId
        ? { id: columnId, direction: activeSort.direction === "asc" ? "desc" : "asc" }
        : { id: columnId, direction: "asc" };

    if (isControlled) onSortChange?.(next);
    else setInternalSort(next);
  };

  const allSelected = rows.length > 0 && rows.every((row) => selection.has(getRowId(row)));
  const someSelected = !allSelected && rows.some((row) => selection.has(getRowId(row)));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : rows.map(getRowId));
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selection);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange([...next]);
  };

  if (rows.length === 0 && !toolbar) {
    return <div className="rounded-card border border-border bg-card shadow-card">{emptyState ?? <DefaultEmpty caption={caption} />}</div>;
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {toolbar}

      {rows.length === 0 ? (
        <div className="rounded-card border border-border bg-card shadow-card">
          {emptyState ?? <DefaultEmpty caption={caption} />}
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
          {/* ---- desktop / tablet table ---- */}
          <div className="hidden overflow-x-auto scrollbar-slim md:block">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">{caption}</caption>
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {selectable ? (
                    <th scope="col" className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected;
                        }}
                        onChange={toggleAll}
                        aria-label={allSelected ? "Deselect all rows" : "Select all rows"}
                        className="size-4 cursor-pointer accent-[var(--atl-primary)]"
                      />
                    </th>
                  ) : null}

                  {columns.map((column) => {
                    const isSorted = activeSort?.id === column.id;
                    const ariaSort = !column.sortValue
                      ? undefined
                      : isSorted
                        ? activeSort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none";

                    return (
                      <th
                        key={column.id}
                        scope="col"
                        aria-sort={ariaSort}
                        style={column.width ? { width: column.width } : undefined}
                        className={cn(
                          "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                          ALIGN_CLASSES[column.align ?? "left"],
                          column.hideBelow && HIDE_CLASSES[column.hideBelow],
                        )}
                      >
                        {column.sortValue ? (
                          <button
                            type="button"
                            onClick={() => requestSort(column.id)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md transition-colors hover:text-foreground",
                              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                              isSorted && "text-foreground",
                            )}
                          >
                            <span>{column.header}</span>
                            {isSorted ? (
                              activeSort.direction === "asc" ? (
                                <ArrowUp className="size-3.5" aria-hidden="true" />
                              ) : (
                                <ArrowDown className="size-3.5" aria-hidden="true" />
                              )
                            ) : (
                              <ArrowUpDown className="size-3.5 opacity-40" aria-hidden="true" />
                            )}
                            <span className="sr-only">
                              {isSorted
                                ? `sorted ${activeSort.direction === "asc" ? "ascending" : "descending"}`
                                : "not sorted, activate to sort"}
                            </span>
                          </button>
                        ) : (
                          column.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {sortedRows.map((row, index) => {
                  const id = getRowId(row);
                  const isSelected = selection.has(id);

                  return (
                    <tr
                      key={id}
                      className={cn(
                        "border-b border-border/60 transition-colors last:border-b-0",
                        isSelected && "bg-primary-soft/40",
                        onRowClick && "cursor-pointer hover:bg-muted/60",
                      )}
                    >
                      {selectable ? (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(id)}
                            aria-label={`Select row ${index + 1}`}
                            className="size-4 cursor-pointer accent-[var(--atl-primary)]"
                          />
                        </td>
                      ) : null}

                      {columns.map((column) => (
                        <td
                          key={column.id}
                          className={cn(
                            "px-4 text-foreground",
                            compact ? "py-2" : "py-3.5",
                            ALIGN_CLASSES[column.align ?? "left"],
                            column.hideBelow && HIDE_CLASSES[column.hideBelow],
                          )}
                        >
                          {column.cell(row, index)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ---- mobile stacked list ---- */}
          <ul className="divide-y divide-border md:hidden">
            {sortedRows.map((row, index) => {
              const id = getRowId(row);
              const isSelected = selection.has(id);

              return (
                <li key={id} className={cn("p-4", isSelected && "bg-primary-soft/40")}>
                  {selectable ? (
                    <div className="mb-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(id)}
                        aria-label={`Select row ${index + 1}`}
                        className="size-4 cursor-pointer accent-[var(--atl-primary)]"
                      />
                      <span className="text-xs text-muted-foreground">Select</span>
                    </div>
                  ) : null}

                  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {columns.map((column) => (
                      <div key={column.id} className="flex items-start justify-between gap-3">
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {column.mobileLabel ?? (typeof column.header === "string" ? column.header : "")}
                        </dt>
                        <dd className="min-w-0 text-right text-sm text-foreground">
                          {column.cell(row, index)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function DefaultEmpty({ caption }: { caption: string }) {
  return <EmptyState title="Nothing here yet" description={`${caption} will appear here once you add some.`} />;
}

export default DataTable;
