"use client";

import type { ComponentType } from "react";
import {
  Activity,
  Boxes,
  FileBarChart,
  Receipt,
  Users,
  UserRound,
} from "lucide-react";
import { LANDING_FEATURES, type LandingFeature } from "@/data/landing";
import { cn } from "@/lib/cn";

const ICONS: Record<LandingFeature["icon"], ComponentType<{ className?: string }>> = {
  chart: Activity,
  users: Users,
  box: Boxes,
  receipt: Receipt,
  team: UserRound,
  report: FileBarChart,
};

/** Bento grid: the first card spans two columns on large screens. */
export function FeatureGrid() {
  return (
    <section id="features" aria-labelledby="features-heading" className="scroll-mt-24">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Features
          </p>
          <h2
            id="features-heading"
            className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Everything a small business tracks, in one place
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            Every screen reads from the same records. Change a price, refund an
            order or close a goal once — and the whole dashboard follows.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANDING_FEATURES.map((feature, index) => {
            const Icon = ICONS[feature.icon];
            const featured = index === 0;

            return (
              <li
                key={feature.title}
                className={cn(
                  "group relative overflow-hidden rounded-panel border border-border bg-card p-6 shadow-card transition-all duration-300",
                  "hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover",
                  featured && "sm:col-span-2 lg:col-span-2",
                )}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-primary/10 opacity-60 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
                />

                <span className="relative grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>

                <h3 className="relative mt-5 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default FeatureGrid;
