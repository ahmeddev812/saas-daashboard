"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Download,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { CustomerFormModal } from "@/components/customers/CustomerFormModal";
import { exportCustomersCsv, parseCustomerCsv } from "@/components/customers/customersCsv";
import { useBusiness } from "@/hooks/useBusinessData";
import { useToast } from "@/context/ToastContext";
import { formatCurrency, formatMetric } from "@/lib/calculations";
import { formatDate } from "@/lib/dates";
import { CUSTOMER_STATUSES, PLAN_NAMES, type Customer, type CustomerStatus } from "@/types/business";

const STATUS_TONE: Record<CustomerStatus, BadgeTone> = {
  active: "success",
  churned: "neutral",
  trial: "info",
};

const STATUS_OPTIONS = CUSTOMER_STATUSES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

const PLAN_OPTIONS = PLAN_NAMES.map((value) => ({ value, label: value }));

export function CustomersClient() {
  const {
    customers,
    business,
    actions: { bulkUpdateCustomers, bulkDeleteCustomers, importCustomers },
  } = useBusiness();
  const { success, error: toastError, warning } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<ReturnType<typeof parseCustomerCsv> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const customer of customers) for (const tag of customer.tags) set.add(tag);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [customers]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers.filter((customer) => {
      if (statusFilter !== "all" && customer.status !== statusFilter) return false;
      if (planFilter !== "all" && customer.plan !== planFilter) return false;
      if (tagFilter !== "all" && !customer.tags.includes(tagFilter)) return false;
      if (query === "") return true;
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.company.toLowerCase().includes(query) ||
        customer.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [customers, search, statusFilter, planFilter, tagFilter]);

  const filtersActive =
    search.trim() !== "" || statusFilter !== "all" || planFilter !== "all" || tagFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setPlanFilter("all");
    setTagFilter("all");
  }

  function handleExport() {
    const rows = selectedIds.length > 0 ? filtered.filter((c) => selectedIds.includes(c.id)) : filtered;
    if (rows.length === 0) {
      warning("Nothing to export", "No customers match the current filters.");
      return;
    }
    if (exportCustomersCsv(rows)) {
      success("CSV exported", `${rows.length} customer${rows.length === 1 ? "" : "s"} downloaded.`);
    } else {
      toastError("Export failed", "The browser blocked the download.");
    }
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setImportResult(parseCustomerCsv(text));
      setImportOpen(true);
    };
    reader.onerror = () => toastError("Import failed", "That file could not be read.");
    reader.readAsText(file);
  }

  function commitImport() {
    if (!importResult?.ok) return;
    const count = importCustomers(importResult.rows);
    success(
      "Import complete",
      `${count} customer${count === 1 ? "" : "s"} added.`,
    );
    setImportOpen(false);
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function bulkSetStatus(status: CustomerStatus) {
    if (selectedIds.length === 0) return;
    const count = bulkUpdateCustomers(selectedIds, { status });
    success("Status updated", `${count} customer${count === 1 ? "" : "s"} set to ${status}.`);
    setSelectedIds([]);
  }

  function bulkDelete() {
    const count = bulkDeleteCustomers(selectedIds);
    success("Customers deleted", `${count} record${count === 1 ? "" : "s"} removed.`);
    setSelectedIds([]);
    setDeleteOpen(false);
  }

  const columns: DataTableColumn<Customer>[] = [
    {
      id: "name",
      header: "Customer",
      sortValue: (row) => row.name,
      cell: (row) => (
        <Link
          href={`/customers/${row.id}`}
          className="block min-w-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="block truncate font-medium text-foreground hover:text-primary">
            {row.name}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {row.email || row.company || "—"}
          </span>
        </Link>
      ),
    },
    {
      id: "company",
      header: "Company",
      sortValue: (row) => row.company,
      hideBelow: "lg",
      mobileLabel: "Company",
      cell: (row) => <span className="text-muted-foreground">{row.company || "—"}</span>,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (row) => row.status,
      mobileLabel: "Status",
      cell: (row) => (
        <Badge tone={STATUS_TONE[row.status]} srPrefix="Status:">
          {row.status}
        </Badge>
      ),
    },
    {
      id: "plan",
      header: "Plan",
      sortValue: (row) => row.plan,
      hideBelow: "md",
      mobileLabel: "Plan",
      cell: (row) => <span className="text-muted-foreground">{row.plan}</span>,
    },
    {
      id: "mrr",
      header: "MRR",
      align: "right",
      sortValue: (row) => row.mrr,
      mobileLabel: "MRR",
      cell: (row) => (
        <span className="tabular-nums font-medium">
          {row.mrr > 0 ? formatCurrency(row.mrr, business.currency) : "—"}
        </span>
      ),
    },
    {
      id: "lastActive",
      header: "Last active",
      sortValue: (row) => row.lastActive,
      hideBelow: "md",
      mobileLabel: "Last active",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.lastActive)}</span>,
    },
    {
      id: "tags",
      header: "Tags",
      hideBelow: "lg",
      mobileLabel: "Tags",
      cell: (row) =>
        row.tags.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="flex flex-wrap justify-end gap-1 md:justify-start">
            {row.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} tone="accent">
                {tag}
              </Badge>
            ))}
            {row.tags.length > 2 ? (
              <span className="text-xs text-muted-foreground">+{row.tags.length - 2}</span>
            ) : null}
          </span>
        ),
    },
  ];

  const toolbar = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          label="Search customers"
          containerClassName="sm:max-w-xs sm:flex-1"
          placeholder="Name, email, company or tag"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          prefix={
            <Search className="size-4" aria-hidden="true" />
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          <Select
            label="Status"
            containerClassName="w-auto"
            className="h-10 min-w-32 pr-9"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[{ value: "all", label: "All statuses" }, ...STATUS_OPTIONS]}
          />
          <Select
            label="Plan"
            containerClassName="w-auto"
            className="h-10 min-w-28 pr-9"
            value={planFilter}
            onChange={(event) => setPlanFilter(event.target.value)}
            options={[{ value: "all", label: "All plans" }, ...PLAN_OPTIONS]}
          />
          {allTags.length > 0 ? (
            <Select
              label="Tag"
              containerClassName="w-auto"
              className="h-10 min-w-28 pr-9"
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
              options={[
                { value: "all", label: "All tags" },
                ...allTags.map((tag) => ({ value: tag, label: tag })),
              ]}
            />
          ) : null}

          {filtersActive ? (
            <Button variant="ghost" size="sm" onClick={clearFilters} icon={<X className="size-4" />}>
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {formatMetric(filtered.length)} of {formatMetric(customers.length)} customers
        {filtersActive ? " match your filters" : ""}.
      </p>

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-primary-soft/50 px-3 py-2.5">
          <span className="text-sm font-medium text-foreground">
            {formatMetric(selectedIds.length)} selected
          </span>
          <span className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => bulkSetStatus("active")}>
              Mark active
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkSetStatus("churned")}>
              Mark churned
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkSetStatus("trial")}>
              Mark trial
            </Button>
            <Button
              size="sm"
              variant="destructive"
              icon={<Trash2 className="size-4" />}
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setSelectedIds([])}
          >
            Clear selection
          </Button>
        </div>
      ) : null}
    </div>
  );

  const emptyState = filtersActive ? (
    <EmptyState
      icon={<Search className="size-5" />}
      title="No customers match those filters"
      description="Try a different search term, or clear the filters to see your whole book."
      action={
        <Button size="sm" variant="outline" onClick={clearFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={<Users className="size-5" />}
      title="No customers yet"
      description="Add your first customer — MRR, top customers and every other metric build from this record."
      action={
        <Button size="sm" onClick={() => setFormOpen(true)}>
          Add customer
        </Button>
      }
      secondaryAction={
        <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          Import CSV
        </Button>
      }
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operate"
        title="Customers"
        description="Search, filter and maintain your book of business."
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              aria-label="Choose a customers CSV file to import"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleImportFile(file);
              }}
            />
            <Button
              variant="outline"
              icon={<Upload className="size-4" />}
              onClick={() => setImportOpen(true)}
            >
              Import
            </Button>
            <Button variant="outline" icon={<Download className="size-4" />} onClick={handleExport}>
              Export CSV
            </Button>
            <Button icon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
              New customer
            </Button>
          </>
        }
      />

      <DataTable
        caption="Customers"
        rows={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        defaultSort={{ id: "name", direction: "asc" }}
        toolbar={toolbar}
        emptyState={emptyState}
      />

      {/* Mounted only while open so the draft always starts from the target record. */}
      {formOpen ? <CustomerFormModal open onClose={() => setFormOpen(false)} /> : null}

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete ${selectedIds.length} customer${selectedIds.length === 1 ? "" : "s"}?`}
        description="This permanently removes the records and their contribution to every metric. It cannot be undone."
        confirmLabel="Delete"
        tone="destructive"
        onConfirm={bulkDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <ImportDialog
        open={importOpen}
        result={importResult}
        onPick={() => fileRef.current?.click()}
        onCommit={commitImport}
        onClose={() => {
          setImportOpen(false);
          setImportResult(null);
        }}
      />
    </div>
  );
}

interface ImportDialogProps {
  open: boolean;
  result: ReturnType<typeof parseCustomerCsv> | null;
  onPick: () => void;
  onCommit: () => void;
  onClose: () => void;
}

function ImportDialog({ open, result, onPick, onCommit, onClose }: ImportDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import customers from CSV"
      description="Expected columns: Name, Email, Phone, Company, Status, Plan, MRR, Join Date, Last Active, Tags, Notes."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {result?.ok ? (
            <Button onClick={onCommit}>
              Import {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
            </Button>
          ) : (
            <Button variant="outline" onClick={onPick}>
              Choose file
            </Button>
          )}
        </>
      }
    >
      {!result ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <Upload className="size-6 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-foreground">No file selected yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a .csv file exported from ATLARIS or any spreadsheet.
            </p>
          </div>
          <Button variant="outline" onClick={onPick}>
            Choose file
          </Button>
        </div>
      ) : !result.ok ? (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive-soft px-3.5 py-2.5 text-sm text-destructive">
          {result.error}
        </p>
      ) : (
        <div className="space-y-4">
          <p className="rounded-xl border border-success/40 bg-success-soft px-3.5 py-2.5 text-sm text-success">
            {result.rows.length} row{result.rows.length === 1 ? "" : "s"} ready to import
            {result.skipped > 0 ? ` · ${result.skipped} skipped` : ""}.
          </p>

          {result.issues.length > 0 ? (
            <div className="max-h-48 overflow-y-auto scrollbar-slim rounded-xl border border-border">
              <ul className="divide-y divide-border">
                {result.issues.map((issue, index) => (
                  <li key={`${issue.row}-${index}`} className="px-3.5 py-2 text-xs text-muted-foreground">
                    Row {issue.row}: {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}

export default CustomersClient;
