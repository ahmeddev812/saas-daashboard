"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import {
  RedirectIfAuthenticated,
  nextDestination,
} from "@/components/auth/RedirectIfAuthenticated";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/hooks/useAuth";

type FieldError = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

export function SignupForm() {
  const router = useRouter();
  const { signup } = useAuth();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const nextErrors: FieldError = {};
    if (!name.trim()) nextErrors.name = "Name is required.";
    else if (name.trim().length < 2) nextErrors.name = "Please enter your full name.";
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (!password) nextErrors.password = "Password is required.";
    if (!confirmPassword) nextErrors.confirmPassword = "Confirm your password.";
    else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    const result = await signup({ name, email, password, confirmPassword });
    setBusy(false);

    if (!result.ok) {
      setErrors({ form: result.error ?? "Unable to create the account." });
      toastError("Sign up failed", result.error);
      return;
    }

    success("Workspace created", `Welcome, ${result.user?.name ?? name}.`);
    router.replace(nextDestination());
    router.refresh();
  }

  return (
    <AuthShell
      active="signup"
      eyebrow="Get started"
      title="Create your workspace"
      description="Sign-up is stored in this browser only. Use a throwaway password — this is a demo, not real authentication."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RedirectIfAuthenticated />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {errors.form ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive-soft px-3.5 py-2.5 text-sm text-destructive"
          >
            {errors.form}
          </p>
        ) : null}

        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Jordan Blake"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          required
        />

        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          required
        />

        <div>
          <Input
            label="Password"
            type={reveal ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            hint="At least 8 characters, mixing cases, a number and a symbol."
            required
            suffix={
              <button
                type="button"
                onClick={() => setReveal((value) => !value)}
                className="pointer-events-auto -mr-1.5 grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                aria-label={reveal ? "Hide password" : "Show password"}
                aria-pressed={reveal}
              >
                {reveal ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            }
          />
          <PasswordStrengthMeter password={password} className="mt-3" />
        </div>

        <Input
          label="Confirm password"
          type={reveal ? "text" : "password"}
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
          required
        />

        <Button type="submit" loading={busy} fullWidth size="lg">
          {busy ? "Creating workspace…" : "Create workspace"}
          {busy ? null : <UserPlus className="size-4" aria-hidden="true" />}
        </Button>
      </form>

      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <span aria-hidden="true" className="mt-1 size-1.5 shrink-0 rounded-full bg-warning" />
        This is a local demo. Passwords are stored with a deliberately weak,
        non-cryptographic digest and are not secure. Do not reuse a real password.
      </p>
    </AuthShell>
  );
}
