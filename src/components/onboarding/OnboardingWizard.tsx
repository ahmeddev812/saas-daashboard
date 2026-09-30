"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Gauge,
  Globe2,
  Palette,
  Target,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusinessData";
import { cn } from "@/lib/cn";
import { addDays, toDateKey } from "@/lib/dates";
import {
  CURRENCY_CODES,
  INDUSTRIES,
  type CurrencyCode,
  type GoalType,
  type PrimaryMetric,
  type ThemePreference,
} from "@/types/business";

/* --------------------------------------------------------------------------
   Step definitions
   -------------------------------------------------------------------------- */

const STEPS = [
  { key: "profile", title: "Your details", icon: UserRound },
  { key: "context", title: "Business context", icon: Globe2 },
  { key: "metric", title: "Primary metric", icon: Gauge },
  { key: "preferences", title: "Theme & targets", icon: Palette },
] as const;

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

const DATE_RANGES = [7, 14, 30, 90, 180, 365] as const;

const METRIC_OPTIONS: Array<{
  value: PrimaryMetric;
  title: string;
  description: string;
}> = [
  { value: "mrr", title: "MRR", description: "Monthly recurring revenue from active customers." },
  { value: "revenue", title: "Revenue", description: "Recognized revenue from paid and fulfilled orders." },
  { value: "customers", title: "Customers", description: "How many active customers you currently serve." },
  { value: "orders", title: "Orders", description: "Order volume over the selected window." },
];

const THEME_OPTIONS: Array<{ value: ThemePreference; title: string; description: string }> = [
  { value: "light", title: "Light", description: "Bright surfaces, dark text." },
  { value: "dark", title: "Dark", description: "Low-glare surfaces for evening work." },
  { value: "system", title: "System", description: "Follow the operating system setting." },
];

/** Maps the chosen primary metric onto the goal type it can be tracked as. */
function goalTypeForMetric(metric: PrimaryMetric): GoalType {
  if (metric === "customers") return "customers";
  if (metric === "orders") return "orders";
  return "revenue";
}

/* --------------------------------------------------------------------------
   Draft state
   -------------------------------------------------------------------------- */

interface OnboardingDraft {
  ownerName: string;
  businessName: string;
  industry: string;
  currency: CurrencyCode;
  fiscalYearStart: number;
  primaryMetric: PrimaryMetric;
  goalTarget: string;
  goalDeadline: string;
  theme: ThemePreference;
  defaultDateRange: number;
  acquisitionCost: string;
}

type DraftErrors = Partial<Record<keyof OnboardingDraft, string>>;

/**
 * Four-step onboarding wizard.
 *
 * The wizard owns a local draft for the whole flow and commits everything in a
 * single batch on finish, so `onboardingDone` is only ever written together
 * with the values it describes. It mounts after BusinessDataProvider has
 * hydrated, so no state is ever written from an effect body.
 */
export function OnboardingWizard() {
  const router = useRouter();
  const { success } = useToast();
  const { user, updateProfile } = useAuth();
  const { setTheme } = useTheme();

  const {
    business,
    settings,
    hydrated,
    actions: { updateBusiness, updateSettings, addGoal, addActivity },
  } = useBusiness();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<DraftErrors>({});

  const [draft, setDraft] = useState<OnboardingDraft>(() => ({
    ownerName: user?.name ?? "",
    businessName: business.name,
    industry: business.industry,
    currency: business.currency,
    fiscalYearStart: business.fiscalYearStart,
    primaryMetric: business.primaryMetric,
    goalTarget: "",
    goalDeadline: toDateKey(addDays(new Date(), 90)),
    theme: settings.theme,
    defaultDateRange: settings.defaultDateRange,
    acquisitionCost: settings.acquisitionCost > 0 ? String(settings.acquisitionCost) : "",
  }));

  const progress = useMemo(
    () => Math.round(((step + 1) / STEPS.length) * 100),
    [step],
  );

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function patch(partial: Partial<OnboardingDraft>) {
    setDraft((prev) => ({ ...prev, ...partial }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(partial)) {
        delete next[key as keyof OnboardingDraft];
      }
      return next;
    });
  }

  /* ------------------------------------------------------------------
     Validation — each step validates only its own fields.
     ------------------------------------------------------------------ */

  function validateStep(index: number): DraftErrors {
    const found: DraftErrors = {};

    if (index === 0) {
      if (draft.ownerName.trim().length < 2) {
        found.ownerName = "Please enter your full name.";
      }
      if (draft.businessName.trim().length < 2) {
        found.businessName = "Enter a business name (at least 2 characters).";
      }
    }

    if (index === 1) {
      if (!INDUSTRIES.includes(draft.industry)) {
        found.industry = "Choose an industry from the list.";
      }
      if (!CURRENCY_CODES.includes(draft.currency)) {
        found.currency = "Choose a supported currency.";
      }
      if (!Number.isInteger(draft.fiscalYearStart) || draft.fiscalYearStart < 1 || draft.fiscalYearStart > 12) {
        found.fiscalYearStart = "Pick the month your fiscal year starts.";
      }
    }

    if (index === 3) {
      const target = draft.goalTarget.trim();
      if (target !== "") {
        const parsed = Number(target);
        if (!Number.isFinite(parsed) || parsed < 0) {
          found.goalTarget = "Enter a target of 0 or more.";
        }
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.goalDeadline)) {
        found.goalDeadline = "Choose a deadline date.";
      }

      if (!DATE_RANGES.includes(draft.defaultDateRange as (typeof DATE_RANGES)[number])) {
        found.defaultDateRange = "Choose a default date window.";
      }

      const cost = draft.acquisitionCost.trim();
      if (cost !== "") {
        const parsed = Number(cost);
        if (!Number.isFinite(parsed) || parsed < 0) {
          found.acquisitionCost = "Enter 0 or more (used only for CAC).";
        }
      }
    }

    return found;
  }

  function handleNext() {
    const found = validateStep(step);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function handleBack() {
    setErrors({});
    setStep((prev) => Math.max(prev - 1, 0));
  }

  /* ------------------------------------------------------------------
     Finish — one batched commit.
     ------------------------------------------------------------------ */

  function handleFinish() {
    const found = validateStep(3);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (saving) return;
    setSaving(true);

    const goalTarget = draft.goalTarget.trim() === "" ? 0 : Number(draft.goalTarget);
    const acquisitionCost = draft.acquisitionCost.trim() === "" ? 0 : Number(draft.acquisitionCost);

    if (draft.ownerName.trim().length >= 2) {
      updateProfile({ name: draft.ownerName.trim(), email: user?.email ?? "" });
    }

    updateBusiness({
      name: draft.businessName.trim(),
      industry: draft.industry,
      currency: draft.currency,
      fiscalYearStart: draft.fiscalYearStart,
      primaryMetric: draft.primaryMetric,
      onboardingDone: true,
      ownerId: null,
    });

    updateSettings({
      theme: draft.theme,
      currency: draft.currency,
      fiscalYearStart: draft.fiscalYearStart,
      defaultDateRange: draft.defaultDateRange,
      acquisitionCost,
    });

    if (goalTarget > 0) {
      addGoal({
        title: `Reach ${goalTarget.toLocaleString()} ${draft.currency}`,
        target: goalTarget,
        deadline: draft.goalDeadline,
        type: goalTypeForMetric(draft.primaryMetric),
      });
    }

    addActivity({
      actor: draft.ownerName.trim() || "Owner",
      action: "create",
      entity: "business",
      description: `Completed onboarding for ${draft.businessName.trim()}.`,
    });

    setTheme(draft.theme);
    success("Workspace ready", `${draft.businessName.trim()} is set up.`);

    router.replace("/dashboard");
    router.refresh();
  }

  if (!hydrated) return null;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progress header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
          <p className="text-sm text-muted-foreground">{current.title}</p>
        </div>

        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Onboarding progress"
        >
          <div
            className="gradient-primary h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ol className="mt-4 grid grid-cols-4 gap-2">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            const state = index < step ? "done" : index === step ? "active" : "todo";
            return (
              <li key={item.key} className="min-w-0">
                <span
                  aria-current={state === "active" ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 truncate text-xs font-medium",
                    state === "done" && "text-success",
                    state === "active" && "text-primary",
                    state === "todo" && "text-muted-foreground",
                  )}
                >
                  {state === "done" ? (
                    <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span className="truncate">{item.title}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Step body */}
      <div className="rounded-panel border border-border bg-card p-6 shadow-card sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {step === 0 && "Tell us who you are"}
          {step === 1 && "Set your business context"}
          {step === 2 && "Pick the metric you care about most"}
          {step === 3 && "Choose a theme and set your first target"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {step === 0 &&
            "Used for greetings and the activity log. You can change either later in Settings."}
          {step === 1 &&
            "Currency and fiscal year drive every revenue figure and report in the app."}
          {step === 2 &&
            "This becomes the headline number on your dashboard. All four are always calculated."}
          {step === 3 &&
            "The target is optional — leave it empty if you do not want a goal yet."}
        </p>

        <div className="mt-7 space-y-5">
          {step === 0 ? (
            <>
              <Input
                label="Your name"
                autoComplete="name"
                placeholder="Jordan Blake"
                value={draft.ownerName}
                onChange={(event) => patch({ ownerName: event.target.value })}
                error={errors.ownerName}
                required
              />
              <Input
                label="Business name"
                autoComplete="organization"
                placeholder="Northwind Labs"
                value={draft.businessName}
                onChange={(event) => patch({ businessName: event.target.value })}
                error={errors.businessName}
                hint="Shown in the sidebar, reports and exports."
                required
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Select
                label="Industry"
                value={draft.industry}
                onChange={(event) => patch({ industry: event.target.value })}
                options={INDUSTRIES.map((value) => ({ value, label: value }))}
                error={errors.industry}
                required
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Select
                  label="Currency"
                  value={draft.currency}
                  onChange={(event) => patch({ currency: event.target.value as CurrencyCode })}
                  options={CURRENCY_CODES.map((value) => ({ value, label: value }))}
                  error={errors.currency}
                  hint="Applies to all prices and totals."
                  required
                />
                <Select
                  label="Fiscal year starts"
                  value={String(draft.fiscalYearStart)}
                  onChange={(event) => patch({ fiscalYearStart: Number(event.target.value) })}
                  options={MONTHS.map((label, index) => ({
                    value: String(index + 1),
                    label,
                  }))}
                  error={errors.fiscalYearStart}
                  required
                />
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <fieldset>
              <legend className="text-sm font-medium text-foreground">
                Primary metric <span className="text-destructive">*</span>
              </legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {METRIC_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "relative flex cursor-pointer flex-col rounded-xl border p-4 transition-colors",
                      draft.primaryMetric === option.value
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-background hover:border-ring/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="primaryMetric"
                      value={option.value}
                      checked={draft.primaryMetric === option.value}
                      onChange={() => patch({ primaryMetric: option.value })}
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold text-foreground">{option.title}</span>
                    <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {option.description}
                    </span>
                    {draft.primaryMetric === option.value ? (
                      <CheckCircle2
                        className="absolute right-3 top-3 size-4 text-primary"
                        aria-hidden="true"
                      />
                    ) : null}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {step === 3 ? (
            <>
              <fieldset>
                <legend className="text-sm font-medium text-foreground">Theme</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {THEME_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "relative flex cursor-pointer flex-col rounded-xl border p-4 transition-colors",
                        draft.theme === option.value
                          ? "border-primary bg-primary-soft"
                          : "border-border bg-background hover:border-ring/40",
                      )}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={option.value}
                        checked={draft.theme === option.value}
                        onChange={() => patch({ theme: option.value })}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold text-foreground">{option.title}</span>
                      <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {option.description}
                      </span>
                      {draft.theme === option.value ? (
                        <CheckCircle2
                          className="absolute right-3 top-3 size-4 text-primary"
                          aria-hidden="true"
                        />
                      ) : null}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label={`Target (${draft.currency})`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  placeholder="e.g. 50000"
                  value={draft.goalTarget}
                  onChange={(event) => patch({ goalTarget: event.target.value })}
                  error={errors.goalTarget}
                  hint="Optional. Creates a goal you can track."
                />
                <Input
                  label="Target deadline"
                  type="date"
                  value={draft.goalDeadline}
                  onChange={(event) => patch({ goalDeadline: event.target.value })}
                  error={errors.goalDeadline}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Select
                  label="Default date window"
                  value={String(draft.defaultDateRange)}
                  onChange={(event) =>
                    patch({ defaultDateRange: Number(event.target.value) })
                  }
                  options={DATE_RANGES.map((value) => ({
                    value: String(value),
                    label: `Last ${value} days`,
                  }))}
                  error={errors.defaultDateRange}
                  hint="Used by analytics and reports."
                />
                <Input
                  label={`Acquisition spend (${draft.currency})`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  placeholder="0"
                  value={draft.acquisitionCost}
                  onChange={(event) => patch({ acquisitionCost: event.target.value })}
                  error={errors.acquisitionCost}
                  hint="Optional. Needed only if you want CAC."
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0 || saving}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>

          {isLast ? (
            <Button type="button" onClick={handleFinish} loading={saving} size="lg">
              {saving ? "Finishing…" : "Finish setup"}
              {saving ? null : <CheckCircle2 className="size-4" aria-hidden="true" />}
            </Button>
          ) : (
            <Button type="button" onClick={handleNext} size="lg">
              Continue
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Target className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
        Everything you enter is written to this browser only and can be exported
        from Settings at any time.
      </p>
    </div>
  );
}

export default OnboardingWizard;
