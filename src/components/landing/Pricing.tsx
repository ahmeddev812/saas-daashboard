import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PRICING_PLANS } from "@/data/landing";
import { cn } from "@/lib/cn";

/**
 * Presentation-only pricing.
 *
 * ATLARIS processes no payments: the CTAs link to the sign-up flow and the
 * page states plainly that no subscription is created.
 */
export function Pricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="scroll-mt-24 border-y border-border bg-subtle/60"
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Pricing</p>
          <h2
            id="pricing-heading"
            className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Start free. Upgrade when the team grows.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            Every feature below works locally in your browser. Pro is a plan on
            this page only — no payment is taken and no subscription is created.
          </p>
        </div>

        <ul className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {PRICING_PLANS.map((plan) => (
            <li
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-panel border bg-card p-7 shadow-card transition-all duration-300",
                plan.highlighted
                  ? "border-primary/50 shadow-glow"
                  : "border-border hover:-translate-y-1 hover:shadow-card-hover",
              )}
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-7 inline-flex items-center gap-1.5 rounded-full gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-glow">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Most popular
                </span>
              ) : null}

              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="text-right">
                  <span className="text-4xl font-semibold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                  <span className="ml-1 text-sm text-muted-foreground">{plan.period}</span>
                </p>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {plan.description}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-foreground"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <Link href="/signup" className="block">
                  <Button variant={plan.highlighted ? "primary" : "outline"} fullWidth>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          No credit card required. Export your data at any time.
        </p>
      </div>
    </section>
  );
}

export default Pricing;
