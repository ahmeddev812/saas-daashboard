"use client";

import { useMemo, useState } from "react";
import { Archive, ArchiveRestore, Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { useBusiness } from "@/hooks/useBusinessData";
import { useToast } from "@/context/ToastContext";
import { formatCurrency, formatMetric, revenueByProduct } from "@/lib/calculations";
import { PRODUCT_STATUSES, type Product, type ProductStatus } from "@/types/business";

const LOW_STOCK = 5;

const STATUS_TONE: Record<ProductStatus, BadgeTone> = {
  active: "success",
  draft: "warning",
  archived: "neutral",
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
};

export function ProductsClient() {
  const { products, orders, business, actions } = useBusiness();
  const { updateProduct, deleteProduct } = actions;
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [pendingArchive, setPendingArchive] = useState<Product | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (product.category.trim()) set.add(product.category.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const salesById = useMemo(() => {
    const map = new Map<string, { revenue: number; units: number }>();
    for (const entry of revenueByProduct(orders, products)) {
      map.set(entry.id, { revenue: entry.value, units: entry.count });
    }
    return map;
  }, [orders, products]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      if (statusFilter !== "all" && product.status !== statusFilter) return false;
      if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
      if (query === "") return true;
      return (
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    });
  }, [products, search, statusFilter, categoryFilter]);

  const filtersActive =
    search.trim() !== "" || statusFilter !== "all" || categoryFilter !== "all";

  const summary = useMemo(() => {
    const revenue = filtered.reduce(
      (sum, product) => sum + (salesById.get(product.id)?.revenue ?? 0),
      0,
    );
    const units = filtered.reduce(
      (sum, product) => sum + (salesById.get(product.id)?.units ?? 0),
      0,
    );
    const low = filtered.filter((product) => product.stock <= LOW_STOCK).length;
    return { revenue, units, low };
  }, [filtered, salesById]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setFormOpen(true);
  }

  function confirmArchive() {
    if (!pendingArchive) return;
    const next: ProductStatus = pendingArchive.status === "archived" ? "active" : "archived";
    const updated = updateProduct(pendingArchive.id, { status: next });
    if (updated) {
      success(
        next === "archived" ? "Product archived" : "Product restored",
        `${pendingArchive.name} is now ${next}.`,
      );
    } else {
      toastError("Could not update", "That product could not be found.");
    }
    setPendingArchive(null);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const removed = deleteProduct(pendingDelete.id);
    if (removed) success("Product deleted", `${pendingDelete.name} was removed.`);
    else toastError("Delete failed", "That product could not be found.");
    setPendingDelete(null);
  }

  function stockCell(product: Product) {
    if (product.stock === 0) {
      return (
        <span className="inline-flex flex-col items-end gap-0.5 md:items-end">
          <span className="font-medium tabular-nums text-destructive">0</span>
          <span className="text-[11px] text-destructive">Out of stock</span>
        </span>
      );
    }
    if (product.stock <= LOW_STOCK) {
      return (
        <span className="inline-flex flex-col items-end gap-0.5">
          <span className="font-medium tabular-nums text-warning">{product.stock}</span>
          <span className="text-[11px] text-warning">Low stock</span>
        </span>
      );
    }
    return <span className="tabular-nums text-muted-foreground">{product.stock}</span>;
  }

  const columns: DataTableColumn<Product>[] = [
    {
      id: "name",
      header: "Product",
      sortValue: (row) => row.name,
      cell: (row) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium text-foreground">{row.name}</span>
          {row.description ? (
            <span className="block truncate text-xs text-muted-foreground">{row.description}</span>
          ) : null}
        </span>
      ),
    },
    {
      id: "category",
      header: "Category",
      sortValue: (row) => row.category,
      hideBelow: "md",
      mobileLabel: "Category",
      cell: (row) => <span className="text-muted-foreground">{row.category}</span>,
    },
    {
      id: "price",
      header: "Price",
      align: "right",
      sortValue: (row) => row.price,
      mobileLabel: "Price",
      cell: (row) => (
        <span className="tabular-nums font-medium">
          {formatCurrency(row.price, business.currency)}
        </span>
      ),
    },
    {
      id: "stock",
      header: "Stock",
      align: "right",
      sortValue: (row) => row.stock,
      mobileLabel: "Stock",
      cell: (row) => stockCell(row),
    },
    {
      id: "sold",
      header: "Units sold",
      align: "right",
      sortValue: (row) => salesById.get(row.id)?.units ?? 0,
      hideBelow: "lg",
      mobileLabel: "Units sold",
      cell: (row) => (
        <span className="tabular-nums text-muted-foreground">
          {formatMetric(salesById.get(row.id)?.units ?? 0)}
        </span>
      ),
    },
    {
      id: "revenue",
      header: "Revenue",
      align: "right",
      sortValue: (row) => salesById.get(row.id)?.revenue ?? 0,
      hideBelow: "lg",
      mobileLabel: "Revenue",
      cell: (row) => {
        const revenue = salesById.get(row.id)?.revenue ?? 0;
        return (
          <span className={`tabular-nums ${revenue > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            {revenue > 0 ? formatCurrency(revenue, business.currency) : "—"}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      sortValue: (row) => row.status,
      mobileLabel: "Status",
      cell: (row) => (
        <Badge tone={STATUS_TONE[row.status]} srPrefix="Status:">
          {STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      mobileLabel: "Actions",
      cell: (row) => (
        <span className="flex items-center justify-end gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Edit ${row.name}`}
            title="Edit"
            onClick={() => openEdit(row)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={
              row.status === "archived" ? `Restore ${row.name}` : `Archive ${row.name}`
            }
            title={row.status === "archived" ? "Restore" : "Archive"}
            onClick={() => setPendingArchive(row)}
          >
            {row.status === "archived" ? (
              <ArchiveRestore className="size-4" />
            ) : (
              <Archive className="size-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Delete ${row.name}`}
            title="Delete"
            onClick={() => setPendingDelete(row)}
          >
            <Trash2 className="size-4" />
          </Button>
        </span>
      ),
    },
  ];

  const toolbar = (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          label="Search"
          placeholder="Name, description or category"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          prefix={<Search className="size-4" aria-hidden="true" />}
        />
        <Select
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          options={[
            { value: "all", label: "All statuses" },
            ...PRODUCT_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
          ]}
        />
        <Select
          label="Category"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          options={[
            { value: "all", label: "All categories" },
            ...categories.map((value) => ({ value, label: value })),
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {formatMetric(filtered.length)} of {formatMetric(products.length)} products ·{" "}
          {formatCurrency(summary.revenue, business.currency)} revenue ·{" "}
          {formatMetric(summary.units)} units sold
          {summary.low > 0 ? ` · ${summary.low} low on stock` : ""}
        </p>

        {filtersActive ? (
          <Button variant="ghost" size="sm" icon={<X className="size-4" />} onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );

  const emptyState = filtersActive ? (
    <EmptyState
      icon={<Search className="size-5" />}
      title="No products match those filters"
      description="Try a different search term, status or category."
      action={
        <Button size="sm" variant="outline" onClick={clearFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={<Package className="size-5" />}
      title="No products yet"
      description="Add your catalog so orders can pull products, prices and stock from here."
      action={
        <Button size="sm" onClick={openCreate}>
          Add product
        </Button>
      }
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operate"
        title="Products"
        description="Your catalog — pricing, stock and revenue per product."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={openCreate}>
            New product
          </Button>
        }
      />

      <p className="rounded-xl border border-border bg-subtle/50 px-4 py-3 text-sm text-muted-foreground">
        Prices are captured on each order line at sale time. Editing a price here never rewrites
        historical orders.
      </p>

      <DataTable
        caption="Products"
        rows={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        defaultSort={{ id: "name", direction: "asc" }}
        toolbar={toolbar}
        emptyState={emptyState}
      />

      {formOpen ? (
        <ProductFormModal
          open
          product={editing}
          categories={categories}
          onClose={() => setFormOpen(false)}
        />
      ) : null}

      <ConfirmDialog
        open={pendingArchive !== null}
        title={
          pendingArchive?.status === "archived"
            ? `Restore ${pendingArchive.name}?`
            : `Archive ${pendingArchive?.name ?? ""}?`
        }
        description={
          pendingArchive?.status === "archived"
            ? "The product returns to the active catalog and can be added to new orders again."
            : "Archiving hides the product from the active catalog. Past orders keep their captured price and revenue."
        }
        confirmLabel={pendingArchive?.status === "archived" ? "Restore" : "Archive"}
        onConfirm={confirmArchive}
        onCancel={() => setPendingArchive(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name ?? ""}?`}
        description="This permanently removes the product from the catalog. Past orders keep their captured lines, but this cannot be undone."
        confirmLabel="Delete product"
        tone="destructive"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default ProductsClient;
