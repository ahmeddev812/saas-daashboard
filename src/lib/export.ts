import { todayKey } from "@/lib/dates";

/**
 * ATLARIS export helpers (CSV + JSON).
 *
 * Everything is generated client-side from the current in-memory state,
 * so an export always reflects exactly what is on screen (current filters,
 * current date range) — never stale or unrelated data.
 */

export interface CSVColumn<T> {
  /** Heading written into the CSV header row. */
  header: string;
  /** Reads the value for a row. Objects/arrays are JSON-stringified. */
  value: (row: T) => string | number | boolean | null | undefined;
  /** Optional raw override (wins over `value` when provided). */
  raw?: (row: T) => string;
}

/** Escapes a single CSV field per RFC 4180. */
export function escapeCSVField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function stringifyCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return value;
}

/**
 * Converts rows to a CSV document (CRLF line endings, BOM-free).
 * Returns an empty string when there are no rows (header only is still
 * produced so an empty export remains a valid CSV).
 */
export function toCSV<T>(data: readonly T[], columns: readonly CSVColumn<T>[]): string {
  const header = columns.map((c) => escapeCSVField(c.header)).join(",");

  const lines = data.map((row) =>
    columns
      .map((column) => {
        const cell = column.raw ? column.raw(row) : stringifyCell(column.value(row));
        return escapeCSVField(cell);
      })
      .join(","),
  );

  return [header, ...lines].join("\r\n");
}

/**
 * Slugifies a base name and stamps it with a date:
 *   buildExportFilename("customers", "csv") -> "atlaris-customers-2026-09-26.csv"
 */
export function buildExportFilename(base: string, extension: string, dateKey = todayKey()): string {
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "export";
  const ext = extension.replace(/^\.+/, "");
  return `atlaris-${slug}-${dateKey}.${ext}`;
}

/**
 * Triggers a browser download. No-op during SSR.
 * The object URL is revoked immediately after the click is dispatched.
 */
export function downloadFile(content: string, filename: string, mime = "text/plain;charset=utf-8"): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    // Give the browser a tick to start the download before revoking.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

/** Pretty-printed JSON for full dataset exports. */
export function toJSON(payload: unknown): string {
  return JSON.stringify(payload, null, 2);
}

/** Convenience: CSV download with the standard ATLARIS filename. */
export function downloadCSV<T>(data: readonly T[], columns: readonly CSVColumn<T>[], baseName: string): boolean {
  const csv = toCSV(data, columns);
  return downloadFile(csv, buildExportFilename(baseName, "csv"), "text/csv;charset=utf-8");
}

/** Convenience: JSON download with the standard ATLARIS filename. */
export function downloadJSON(payload: unknown, baseName: string): boolean {
  return downloadFile(toJSON(payload), buildExportFilename(baseName, "json"), "application/json");
}

/* --------------------------------------------------------------------------
   CSV parsing (used by customer import)
   -------------------------------------------------------------------------- */

/** Splits a CSV document into rows of cells (handles quotes, escapes, CRLF). */
export function parseCSV(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;

  const text = input.replace(/^\uFEFF/, "");

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }
    if (char === "\r") {
      i += 1;
      continue;
    }
    if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i += 1;
      continue;
    }

    cell += char;
    i += 1;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Maps the first CSV row to headers and returns the remaining rows as objects. */
export function parseCSVObjects(input: string): Record<string, string>[] {
  const rows = parseCSV(input);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = (cells[index] ?? "").trim();
    });
    return obj;
  });
}
