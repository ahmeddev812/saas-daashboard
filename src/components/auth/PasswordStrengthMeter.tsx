"use client";

import { Check, Minus } from "lucide-react";
import { checkPasswordStrength, PASSWORD_MIN_LENGTH } from "@/lib/auth";
import { cn } from "@/lib/cn";

const BAR_TONES = [
  "bg-muted",
  "bg-destructive",
  "bg-warning",
  "bg-warning",
  "bg-primary",
  "bg-success",
] as const;

const LABEL_TONES = [
  "text-muted-foreground",
  "text-destructive",
  "text-warning",
  "text-warning",
  "text-primary",
  "text-success",
] as const;

const RULES: Array<{ key: keyof ReturnType<typeof checkPasswordStrength>["checks"]; label: string }> = [
  { key: "length", label: `${PASSWORD_MIN_LENGTH}+ characters` },
  { key: "upper", label: "Uppercase letter" },
  { key: "lower", label: "Lowercase letter" },
  { key: "number", label: "Number" },
  { key: "symbol", label: "Symbol" },
];

export interface PasswordStrengthMeterProps {
  password: string;
  /** Hidden entirely when there is nothing to evaluate yet. */
  className?: string;
}

/**
 * Live password strength meter for the signup form.
 *
 * Purely client-side feedback using the same `checkPasswordStrength` the
 * AuthContext validates against — the two can never disagree.
 */
export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  if (password.length === 0) return null;

  const { checks, score, label, valid } = checkPasswordStrength(password);

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < score ? BAR_TONES[score] : "bg-muted",
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "shrink-0 text-xs font-medium",
            valid ? "text-success" : LABEL_TONES[score],
          )}
        >
          {label}
        </span>
      </div>

      {/* Announce the strength to screen readers as a polite status update. */}
      <p className="sr-only" aria-live="polite">
        Password strength: {label}
      </p>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {RULES.map((rule) => {
          const passed = checks[rule.key];
          return (
            <li
              key={rule.key}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                passed ? "text-success" : "text-muted-foreground",
              )}
            >
              {passed ? (
                <Check className="size-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Minus className="size-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>{rule.label}</span>
              <span className="sr-only">{passed ? " — met" : " — not met"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default PasswordStrengthMeter;
