"use client";

import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  RANGE_PRESETS,
  activePreset,
  normalizeRange,
  rangeForDays,
  rangeLabel,
  type DateRange,
} from "@/components/analytics/analyticsLib";

export interface DateRangeControlProps {
  value: DateRange;
  onChange: (next: DateRange) => void;
  /** Shows the resolved "1 Jan – 26 Sep 2026" summary. Default true. */
  showLabel?: boolean;
}

/**
 * Shared date-range picker: preset chips plus explicit from/to inputs.
 * State is lifted to the page — never read from the URL (no Suspense needed).
 */
export function DateRangeControl({ value, onChange, showLabel = true }: DateRangeControlProps) {
  function setFrom(next: string) {
    onChange(normalizeRange(next, value.to));
  }

  function setTo(next: string) {
    onChange(normalizeRange(value.from, next));
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-4 shadow-card lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
          <CalendarRange className="size-4 text-primary" aria-hidden="true" />
          Date range
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Date range presets">
          {RANGE_PRESETS.map((preset) => {
            const isActive = activePreset(value, preset);
            return (
              <Button
                key={preset.id}
                size="sm"
                variant={isActive ? "secondary" : "outline"}
                aria-pressed={isActive}
                onClick={() => onChange(rangeForDays(preset.days))}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="From"
          type="date"
          value={value.from}
          max={value.to || undefined}
          onChange={(event) => setFrom(event.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={value.to}
          min={value.from || undefined}
          onChange={(event) => setTo(event.target.value)}
        />
      </div>

      {showLabel ? (
        <p className="text-sm text-muted-foreground lg:pb-2.5" aria-live="polite">
          {rangeLabel(value)}
        </p>
      ) : null}
    </div>
  );
}

export default DateRangeControl;
