"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Sparkles } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import {
  RedirectIfAuthenticated,
  nextDestination,
} from "@/components/auth/RedirectIfAuthenticated";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusinessData";
import { DEMO_USER } from "@/lib/auth";
import { buildSampleData } from "@/lib/seed";

type FieldError = { email?: string; password?: string; form?: string };

export function LoginForm() {
  const router = useRouter();
  const { login, demoLogin } = useAuth();
  const { business, customers, products, orders, actions: { loadDataset } } = useBusiness();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  /** Remember Me is UNCHECKED by default (sessionStorage unless opted in). */
  const [remember, setRemember] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState<"login" | "demo" | null>(null);
  const [errors, setErrors] = useState<FieldError>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const nextErrors: FieldError = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (!password) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy("login");
    const result = await login(email, password, remember);
    setBusy(null);

    if (!result.ok) {
      setErrors({ form: result.error ?? "Unable to sign in." });
      toastError("Sign in failed", result.error);
      return;
    }

    success("Welcome back", `Signed in as ${result.user?.name ?? email}.`);
    router.replace(nextDestination());
    router.refresh();
  }

  async function handleDemo() {
    if (busy) return;
    setBusy("demo");
    setErrors({});

    const result = await demoLogin();
    setBusy(null);

    if (!result.ok) {
      setErrors({ form: result.error ?? "Unable to load the demo workspace." });
      toastError("Demo sign-in failed", result.error);
      return;
    }

    // Opt-in seeding (spec §29): only a completely empty workspace is filled.
    const workspaceEmpty =
      customers.length === 0 && products.length === 0 && orders.length === 0;

    if (workspaceEmpty) {
      loadDataset({
        ...buildSampleData(),
        business: { ...business, onboardingDone: true },
      });
      success("Demo workspace ready", "Loaded 90 days of sample data — nothing is sent anywhere.");
    } else {
      success("Welcome back", "Your existing workspace data was left untouched.");
    }

    router.replace(nextDestination());
    router.refresh();
  }

  return (
    <AuthShell
      active="login"
      eyebrow="Welcome back"
      title="Sign in to your workspace"
      description="Your records are stored in this browser. Nothing is sent to a server."
      footer={
        <>
          New to ATLARIS?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
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

        <Input
          label="Password"
          type={reveal ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
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

        <div className="flex items-center justify-between gap-3">
          <Checkbox
            label="Remember me"
            hint="Keeps you signed in after a browser restart."
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
        </div>

        <Button type="submit" loading={busy === "login"} fullWidth size="lg">
          {busy === "login" ? "Signing in…" : "Sign in"}
          {busy !== "login" ? <LogIn className="size-4" aria-hidden="true" /> : null}
        </Button>
      </form>

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          fullWidth
          loading={busy === "demo"}
          onClick={handleDemo}
          icon={<Sparkles className="size-4" aria-hidden="true" />}
        >
          {busy === "demo" ? "Preparing demo…" : "Explore the demo workspace"}
        </Button>

        <div className="rounded-xl border border-dashed border-border bg-subtle/70 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">Demo credentials</p>
          <p className="mt-1">
            <code className="font-mono">{DEMO_USER.email}</code> ·{" "}
            <code className="font-mono">{DEMO_USER.password}</code>
          </p>
          <p className="mt-1.5">
            Creating the demo account is always opt-in — it is never created silently.
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
