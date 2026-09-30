import type { Customer } from "@/types/business";
import { downloadCSV, parseCSVObjects, toCSV, type CSVColumn } from "@/lib/export";
import { todayKey, toDateKey } from "@/lib/dates";
import { isEmail } from "@/lib/auth";

/** Column definitions for the customer CSV export. */
export const CUSTOMER_CSV_COLUMNS: CSVColumn<Customer>[] = [
  { header: "Name", value: (row) => row.name },
  { header: "Email", value: (row) => row.email },
  { header: "Phone", value: (row) => row.phone },
  { header: "Company", value: (row) => row.company },
  { header: "Status", value: (row) => row.status },
  { header: "Plan", value: (row) => row.plan },
  { header: "MRR", value: (row) => row.mrr },
  { header: "Join Date", value: (row) => row.joinDate },
  { header: "Last Active", value: (row) => row.lastActive },
  { header: "Tags", value: (row) => row.tags.join("; ") },
  { header: "Notes", value: (row) => row.notes },
];

/** Downloads the supplied customers as a date-stamped CSV. */
export function exportCustomersCsv(customers: readonly Customer[]): boolean {
  return downloadCSV(customers, CUSTOMER_CSV_COLUMNS, "customers");
}

/** Raw CSV text for the supplied customers (used by the preview step). */
export function customersToCsv(customers: readonly Customer[]): string {
  return toCSV(customers, CUSTOMER_CSV_COLUMNS);
}

export type CustomerImportStatus = "active" | "churned" | "trial";

export interface CustomerImportIssue {
  row: number;
  message: string;
}

export interface CustomerImportResult {
  ok: boolean;
  error?: string;
  rows: Customer[];
  issues: CustomerImportIssue[];
  skipped: number;
}

const VALID_STATUSES: CustomerImportStatus[] = ["active", "churned", "trial"];

function normalizeStatus(value: string): CustomerImportStatus {
  const lower = value.trim().toLowerCase();
  if (lower === "churned" || lower === "churned customer") return "churned";
  if (lower === "trial" || lower === "trialing") return "trial";
  return "active";
}

function normalizeDate(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") return todayKey();
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return todayKey();
  return toDateKey(parsed);
}

function normalizeTags(value: string): string[] {
  return value
    .split(/[;,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toNumber(value: string, fallback = 0): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/**
 * Converts parsed CSV records into Customer rows.
 *
 * Hard failures (unreadable file, no usable columns) return `ok: false`.
 * Row-level problems are collected in `issues` and those rows are skipped so
 * one bad line never blocks the whole import.
 */
export function parseCustomerCsv(raw: string): CustomerImportResult {
  const records = parseCSVObjects(raw);

  if (records.length === 0) {
    return {
      ok: false,
      error: "That file has no data rows. Expected a header row plus at least one customer.",
      rows: [],
      issues: [],
      skipped: 0,
    };
  }

  const headers = Object.keys(records[0]);
  const hasName = headers.some((header) => header.toLowerCase().includes("name"));
  if (!hasName) {
    return {
      ok: false,
      error: 'Missing a "Name" column — that is the minimum ATLARIS needs to import a row.',
      rows: [],
      issues: [],
      skipped: 0,
    };
  }

  const pick = (record: Record<string, string>, ...keys: string[]): string => {
    for (const key of keys) {
      const match = Object.keys(record).find(
        (header) => header.toLowerCase() === key.toLowerCase(),
      );
      if (match && record[match] !== undefined) return record[match];
    }
    return "";
  };

  const rows: Customer[] = [];
  const issues: CustomerImportIssue[] = [];
  let skipped = 0;

  records.forEach((record, index) => {
    const rowNumber = index + 2; // header is row 1
    const name = pick(record, "Name", "Customer", "Customer Name").trim();

    if (name === "") {
      issues.push({ row: rowNumber, message: "Missing name — row skipped." });
      skipped += 1;
      return;
    }

    const email = pick(record, "Email", "E-mail").trim();
    if (email !== "" && !isEmail(email)) {
      issues.push({ row: rowNumber, message: `Invalid email "${email}" — imported anyway.` });
    }

    const statusRaw = pick(record, "Status");
    if (statusRaw !== "" && !VALID_STATUSES.includes(normalizeStatus(statusRaw))) {
      issues.push({
        row: rowNumber,
        message: `Unknown status "${statusRaw}" — defaulted to "active".`,
      });
    }

    rows.push({
      id: `import_${todayKey()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      email,
      phone: pick(record, "Phone", "Telephone"),
      company: pick(record, "Company", "Organisation", "Organization"),
      status: normalizeStatus(statusRaw),
      plan: pick(record, "Plan", "Tier") || "Free",
      mrr: toNumber(pick(record, "MRR", "Monthly Revenue")),
      joinDate: normalizeDate(pick(record, "Join Date", "JoinDate", "Created")),
      lastActive: normalizeDate(pick(record, "Last Active", "LastActive", "Updated")),
      tags: normalizeTags(pick(record, "Tags", "Labels")),
      notes: pick(record, "Notes", "Note"),
    });
  });

  if (rows.length === 0) {
    return {
      ok: false,
      error: "Every row failed validation — nothing was imported.",
      rows: [],
      issues,
      skipped,
    };
  }

  return { ok: true, rows, issues, skipped };
}
