import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const FIELD_BASE =
  "w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground " +
  "placeholder:text-muted-foreground/70 transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted";

const FIELD_INVALID = "border-destructive/60 focus-visible:outline-destructive";

/* --------------------------------------------------------------------------
   Shared label / hint / error chrome
   -------------------------------------------------------------------------- */

interface FieldShellProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

function FieldShell({ id, label, hint, error, required, children, className }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required ? (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {children}

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: ReactNode, hint?: ReactNode): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

/* --------------------------------------------------------------------------
   Input
   -------------------------------------------------------------------------- */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Leading adornment (icon or currency symbol). */
  prefix?: ReactNode;
  /** Trailing adornment. */
  suffix?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, prefix, suffix, className, containerClassName, id, required, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  const control = (
    <div className="relative flex items-center">
      {prefix ? (
        <span className="pointer-events-none absolute left-3.5 text-sm text-muted-foreground" aria-hidden="true">
          {prefix}
        </span>
      ) : null}
      <input
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={cn(
          FIELD_BASE,
          Boolean(error) && FIELD_INVALID,
          Boolean(prefix) && "pl-9",
          Boolean(suffix) && "pr-14",
          className,
        )}
        {...rest}
      />
      {suffix ? (
        <span className="pointer-events-none absolute right-3.5 text-sm text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  );

  if (!label && !hint && !error) {
    return <div className={containerClassName}>{control}</div>;
  }

  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      {control}
    </FieldShell>
  );
});

/* --------------------------------------------------------------------------
   Textarea
   -------------------------------------------------------------------------- */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, containerClassName, id, required, rows = 4, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  const control = (
    <textarea
      ref={ref}
      id={fieldId}
      rows={rows}
      required={required}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(fieldId, error, hint)}
      className={cn(FIELD_BASE, Boolean(error) && FIELD_INVALID, "min-h-24 resize-y py-2.5", className)}
      {...rest}
    />
  );

  if (!label && !hint && !error) {
    return <div className={containerClassName}>{control}</div>;
  }

  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      {control}
    </FieldShell>
  );
});

/* --------------------------------------------------------------------------
   Select
   -------------------------------------------------------------------------- */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  options: SelectOption[];
  /** Rendered as a disabled first option when provided. */
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, placeholder, className, containerClassName, id, required, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  const control = (
    <div className="relative">
      <select
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={cn(FIELD_BASE, Boolean(error) && FIELD_INVALID, "appearance-none pr-9", className)}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  if (!label && !hint && !error) {
    return <div className={containerClassName}>{control}</div>;
  }

  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      {control}
    </FieldShell>
  );
});

/* --------------------------------------------------------------------------
   Checkbox / Radio (real inputs, real labels)
   -------------------------------------------------------------------------- */

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  hint?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <input
        ref={ref}
        id={fieldId}
        type="checkbox"
        aria-describedby={hint ? `${fieldId}-hint` : undefined}
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--atl-primary)]"
        {...rest}
      />
      <div className="min-w-0">
        <label htmlFor={fieldId} className="cursor-pointer text-sm text-foreground">
          {label}
        </label>
        {hint ? (
          <p id={`${fieldId}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
});
