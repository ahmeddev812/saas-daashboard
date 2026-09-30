"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Database,
  Download,
  HardDrive,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Checkbox } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { useBusiness } from "@/hooks/useBusinessData";
import { useToast } from "@/context/ToastContext";
import { downloadJSON } from "@/lib/export";
import { INDUSTRIES, CURRENCY_CODES, type ThemePreference } from "@/types/business";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Moscow",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const DATE_RANGE_OPTIONS = [7, 14, 30, 90, 365].map((days) => ({
  value: String(days),
  label: days === 365 ? "Last 365 days" : `Last ${days} days`,
}));

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Match system" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const MOTION_OPTIONS = [
  { value: "system", label: "Follow system preference" },
  { value: "reduce", label: "Always reduce motion" },
  { value: "allow", label: "Always allow motion" },
];

const INDUSTRY_OPTIONS = INDUSTRIES.map((value) => ({ value, label: value }));
const CURRENCY_OPTIONS = CURRENCY_CODES.map((value) => ({ value, label: value }));
const MONTH_OPTIONS = MONTHS.map((label, index) => ({
  value: String(index + 1),
  label,
}));

interface ImportPreview {
  raw: string;
  fileName: string;
  counts: { customers: number; products: number; orders: number; team: number };
  error?: string;
}

function countArray(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null;
}

/**
 * Local pre-flight check so nothing is replaced until the file is confirmed.
 * `importData` re-validates and is the only thing that writes state.
 */
function previewJson(raw: string): Omit<ImportPreview, "raw" | "fileName"> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { counts: { customers: 0, products: 0, orders: 0, team: 0 }, error: "That file is not valid JSON." };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      counts: { customers: 0, products: 0, orders: 0, team: 0 },
      error: "Expected a JSON object exported from ATLARIS.",
    };
  }

  const candidate = parsed as Record<string, unknown>;
  const counts = {
    customers: countArray(candidate.customers) ?? 0,
    products: countArray(candidate.products) ?? 0,
    orders: countArray(candidate.orders) ?? 0,
    team: countArray(candidate.team) ?? 0,
  };

  if (
    countArray(candidate.customers) === null &&
    countArray(candidate.products) === null &&
    countArray(candidate.orders) === null
  ) {
    return {
      counts,
      error: "No recognisable data found. The file must contain customers, products or orders.",
    };
  }

  return { counts };
}

export function SettingsClient() {
  const {
    business,
    settings,
    actions: { updateBusiness, updateSettings, exportData, importData, resetData },
  } = useBusiness();
  const { success, error: toastError, info } = useToast();

  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const timezoneOptions = TIMEZONES.includes(business.timezone)
    ? TIMEZONES
    : [business.timezone, ...TIMEZONES];

  function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSettings({
      currency: business.currency,
      timezone: business.timezone,
      fiscalYearStart: business.fiscalYearStart,
    });
    success("Profile saved", "Currency, timezone and fiscal year now drive every report.");
  }

  function handleExport() {
    if (downloadJSON(exportData(), "atlaris_backup")) {
      success("Backup exported", "A JSON snapshot of this workspace was downloaded.");
    } else {
      toastError("Export failed", "The browser blocked the download.");
    }
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : "";
      const preview = previewJson(raw);
      setImportPreview({ raw, fileName: file.name, ...preview });
      if (preview.error) {
        toastError("Import blocked", preview.error);
      }
    };
    reader.onerror = () => toastError("Import failed", "That file could not be read.");
    reader.readAsText(file);
  }

  function confirmReplace() {
    const preview = importPreview;
    if (!preview || preview.error) return;

    const result = importData(preview.raw);
    if (result.ok) {
      success("Data replaced", `${result.summary ?? "The workspace was replaced"} from ${preview.fileName}.`);
      setImportPreview(null);
      setReplaceOpen(false);
    } else {
      toastError("Import failed", result.error ?? "The file was rejected.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function confirmReset() {
    resetData();
    setResetOpen(false);
    success("Workspace reset", "Customers, orders, products and team were cleared. Your login is unchanged.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Business profile, appearance, backups and local-storage controls."
      />

      {/* ---------------------------------------------------------------- */}
      {/* Business profile                                                  */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader
          title="Business profile"
          description="Used across every page, chart, export and report."
        />
        <CardContent>
          <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Business name"
                value={business.name}
                onChange={(event) => updateBusiness({ name: event.target.value })}
                required
              />
              <Select
                label="Industry"
                value={business.industry}
                onChange={(event) => updateBusiness({ industry: event.target.value })}
                options={INDUSTRY_OPTIONS}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <Select
                label="Currency"
                value={business.currency}
                onChange={(event) =>
                  updateBusiness({ currency: event.target.value as typeof business.currency })
                }
                options={CURRENCY_OPTIONS}
              />
              <Select
                label="Timezone"
                value={business.timezone}
                onChange={(event) => updateBusiness({ timezone: event.target.value })}
                options={timezoneOptions.map((value) => ({ value, label: value }))}
              />
              <Select
                label="Fiscal year starts"
                value={String(business.fiscalYearStart)}
                onChange={(event) => updateBusiness({ fiscalYearStart: Number(event.target.value) })}
                options={MONTH_OPTIONS}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <p className="mr-auto text-xs text-muted-foreground">
            Edits are written to this browser as you type.
          </p>
          <Button type="submit" form="profile-form" icon={<Save className="size-4" />}>
            Save changes
          </Button>
        </CardFooter>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Appearance & preferences                                          */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader
          title="Appearance & preferences"
          description="Theme and display options for this workspace."
        />
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Theme"
              value={settings.theme}
              onChange={(event) => {
                const theme = event.target.value as ThemePreference;
                updateSettings({ theme });
                info(`Theme set to ${theme === "system" ? "match system" : theme}`);
              }}
              options={THEME_OPTIONS}
              hint="Persisted with this workspace."
            />
            <Select
              label="Default date window"
              value={String(settings.defaultDateRange)}
              onChange={(event) => updateSettings({ defaultDateRange: Number(event.target.value) })}
              options={DATE_RANGE_OPTIONS}
              hint="Initial range on Analytics, Revenue and Reports."
            />
            <Select
              label="Motion"
              value={
                settings.reduceMotion === null
                  ? "system"
                  : settings.reduceMotion
                    ? "reduce"
                    : "allow"
              }
              onChange={(event) => {
                const value = event.target.value;
                updateSettings({
                  reduceMotion: value === "system" ? null : value === "reduce",
                });
              }}
              options={MOTION_OPTIONS}
              hint="Reduced motion disables decorative animation everywhere."
            />
            <div className="flex items-end pb-1">
              <Checkbox
                label="Compact table rows"
                hint="Tighter padding on every data table."
                checked={settings.compactTables}
                onChange={(event) => updateSettings({ compactTables: event.target.checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Data & backup                                                     */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader
          title="Data & backup"
          description="Everything lives in this browser's localStorage — no server, no sync."
        />
        <CardContent className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <HardDrive className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              ATLARIS stores customers, orders, products, team members and preferences in
              localStorage under a few <code className="text-foreground">atlaris.*</code> keys.
              Clearing site data, using private browsing or another device means starting fresh —
              export a backup first.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" icon={<Download className="size-4" />} onClick={handleExport}>
              Export JSON
            </Button>
            <Button variant="outline" icon={<Upload className="size-4" />} onClick={() => fileRef.current?.click()}>
              Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Choose an ATLARIS JSON backup to import"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleImportFile(file);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Danger zone                                                       */}
      {/* ---------------------------------------------------------------- */}
      <Card className="border-destructive/40">
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4" aria-hidden="true" />
              Danger zone
            </span>
          }
          description="Irreversible actions for this browser's copy of your data."
        />
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive-soft/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Reset workspace data</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Deletes every customer, product, order, teammate, goal and activity entry. Your
                login stays active.
              </p>
            </div>
            <Button variant="destructive" icon={<Trash2 className="size-4" />} onClick={() => setResetOpen(true)}>
              Reset data
            </Button>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border px-4 py-3">
            <Database className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              There is no server copy of this data. Resetting cannot be undone unless you exported a
              JSON backup first.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Dialogs                                                           */}
      {/* ---------------------------------------------------------------- */}
      <ConfirmDialog
        open={resetOpen}
        title="Reset all workspace data?"
        description="This clears every record stored in this browser and returns the workspace to its empty state. It cannot be undone."
        confirmLabel="Reset everything"
        tone="destructive"
        onConfirm={confirmReset}
        onCancel={() => setResetOpen(false)}
      />

      <Modal
        open={importPreview !== null}
        onClose={() => setImportPreview(null)}
        title="Import from JSON"
        description={importPreview ? `Selected file: ${importPreview.fileName}` : undefined}
        footer={
          importPreview?.error ? (
            <Button variant="ghost" onClick={() => setImportPreview(null)}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setImportPreview(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => setReplaceOpen(true)}>
                Replace current data
              </Button>
            </>
          )
        }
      >
        {importPreview?.error ? (
          <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive-soft px-3.5 py-2.5 text-sm text-destructive">
            {importPreview.error}
          </p>
        ) : importPreview ? (
          <div className="space-y-3">
            <p className="rounded-xl border border-success/40 bg-success-soft px-3.5 py-2.5 text-sm text-success">
              This file passed validation. Nothing has been written yet.
            </p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Customers", importPreview.counts.customers],
                ["Products", importPreview.counts.products],
                ["Orders", importPreview.counts.orders],
                ["Team", importPreview.counts.team],
              ].map(([label, value]) => (
                <li key={String(label)} className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">{String(label)}</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">{Number(value)}</p>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              Replacing discards everything currently stored in this browser. Invalid rows inside the
              file are skipped rather than applied.
            </p>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={replaceOpen}
        title="Replace your current data?"
        description="Every customer, product, order and setting in this browser is replaced by the contents of the imported file."
        confirmLabel="Replace data"
        tone="destructive"
        onConfirm={confirmReplace}
        onCancel={() => setReplaceOpen(false)}
      />
    </div>
  );
}

export default SettingsClient;
