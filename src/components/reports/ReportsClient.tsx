"use client";

import { useMemo, useState } from "react";
import { Download, FileJson, Printer, Table2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { DateRangeControl } from "@/components/analytics/DateRangeControl";
import { rangeForDays, rangeLabel, type DateRange } from "@/components/analytics/analyticsLib";
import {
  REPORT_TEMPLATES,
  findReportTemplate,
  formatCell,
  reportOrders,
  type ReportCell,
  type ReportContext,
} from "@/components/reports/reportTemplates";
import { useBusiness } from "@/hooks/useBusinessData";
import { useToast } from "@/context/ToastContext";
import { downloadCSV, downloadJSON, type CSVColumn } from "@/lib/export";
import { formatMetric } from "@/lib/calculations";

export function ReportsClient() {
  const { customers, orders, products, settings, business } = useBusiness();
  const { success, error: toastError } = useToast();

  const [templateId, setTemplateId] = useState(REPORT_TEMPLATES[0].id);
  const [range, setRange] = useState<DateRange>(() =>
    rangeForDays(Math.max(1, settings.defaultDateRange)),
  );

  const template = findReportTemplate(templateId);

  const context: ReportContext = useMemo(
    () => ({
      range,
      orders: reportOrders(orders, range),
      customers,
      products,
      currency: business.currency,
    }),
    [range, orders, customers, products, business.currency],
  );

  const rows = useMemo(() => template.build(context), [template, context]);
  const hasRows = rows.length > 0;

  const baseName = `${template.id}_${range.from}_to_${range.to}`;

  function exportCsv() {
    if (!hasRows) {
      toastError("Nothing to export", "This report has no rows for the selected range.");
      return;
    }
    const columns: CSVColumn<ReportCell[]>[] = template.columns.map((column, index) => ({
      header: column.header,
      value: (row) => row[index],
    }));
    if (downloadCSV(rows, columns, baseName)) {
      success("CSV exported", `${template.title} · ${rangeLabel(range)} · ${rows.length} rows.`);
    } else {
      toastError("Export failed", "The browser blocked the download.");
    }
  }

  function exportJson() {
    if (!hasRows) {
      toastError("Nothing to export", "This report has no rows for the selected range.");
      return;
    }
    const payload = {
      report: template.title,
      description: template.description,
      range,
      generatedAt: new Date().toISOString(),
      currency: business.currency,
      columns: template.columns.map((column) => ({ key: column.key, header: column.header })),
      rows: rows.map((row) =>
        Object.fromEntries(template.columns.map((column, index) => [column.key, row[index]])),
      ),
    };
    if (downloadJSON(payload, baseName)) {
      success("JSON exported", `${template.title} · ${rangeLabel(range)} · ${rows.length} rows.`);
    } else {
      toastError("Export failed", "The browser blocked the download.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Measure"
        title="Reports"
        description="Pre-built reports over exactly the range you select — export or print them."
        actions={
          <span className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" icon={<Printer className="size-4" />} onClick={() => window.print()}>
              Print
            </Button>
            <Button variant="outline" icon={<FileJson className="size-4" />} onClick={exportJson}>
              JSON
            </Button>
            <Button icon={<Download className="size-4" />} onClick={exportCsv}>
              CSV
            </Button>
          </span>
        }
      />

      <div className="print:hidden">
        <DateRangeControl value={range} onChange={setRange} />
      </div>

      {/* ---------------------------- templates ---------------------------- */}
      <div className="print:hidden">
        <p className="mb-2 text-sm font-medium text-foreground">Report template</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" role="group" aria-label="Report templates">
          {REPORT_TEMPLATES.map((item) => {
            const isActive = item.id === template.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setTemplateId(item.id)}
                className={
                  isActive
                    ? "rounded-card border border-primary/50 bg-primary-soft/60 p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    : "rounded-card border border-border bg-card p-4 text-left transition-colors hover:border-ring/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                }
              >
                <span className="flex items-center gap-2">
                  <Table2
                    className={isActive ? "size-4 text-primary" : "size-4 text-muted-foreground"}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold text-foreground">{item.title}</span>
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{item.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------------------- preview ----------------------------- */}
      <Card>
        <CardHeader
          title={template.title}
          description={`${rangeLabel(range)} · ${formatMetric(rows.length)} rows`}
        />
        <CardContent>
          {!hasRows ? (
            <EmptyState
              icon={<Table2 className="size-5" />}
              title="No rows for this range"
              description="Pick a wider date range, or switch to another report template."
            />
          ) : (
            <div className="overflow-x-auto scrollbar-slim">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">
                  {template.title} for {rangeLabel(range)}
                </caption>
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {template.columns.map((column) => (
                      <th
                        key={column.key}
                        scope="col"
                        className={
                          column.align === "right"
                            ? "px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                            : "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        }
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={`${template.id}-${rowIndex}`} className="border-b border-border/60">
                      {template.columns.map((column, columnIndex) => (
                        <td
                          key={column.key}
                          className={
                            column.align === "right"
                              ? "px-3 py-2.5 text-right tabular-nums text-foreground"
                              : "px-3 py-2.5 text-foreground"
                          }
                        >
                          {formatCell(column, row[columnIndex], context)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Exports contain only these rows — the selected template and the selected range. Filenames
        include the template id and the full date range so they are easy to tell apart.      </p>
    </div>
  );
}

export default ReportsClient;
