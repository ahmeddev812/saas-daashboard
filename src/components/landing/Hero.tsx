"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DashboardPreview } from "@/components/landing/DashboardPreview";

const BULLETS = [
  "No server, no account required to explore",
  "CSV & JSON export included",
  "Light, dark and system themes",
] as const;

export function Hero() {
  // Reduced motion is handled globally by <MotionConfig reducedMotion="user">
  // so server and client always render the same markup (no hydration drift).
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      {/* Decorative background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[28rem] w-[52rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute right-[-10%] top-1/3 h-72 w-72 rounded-full bg-accent/15 blur-[90px]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-20">
        <div>
          <motion.p
            {...rise(0)}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            Local-first analytics for small teams
          </motion.p>

          <motion.h1
            {...rise(0.07)}
            id="hero-heading"
            className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Carry your business.{" "}
            <span className="text-gradient">See everything.</span>
          </motion.h1>

          <motion.p
            {...rise(0.14)}
            className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            ATLARIS turns your customers, products and orders into live metrics —
            MRR, churn, LTV, revenue and cohorts — calculated in the browser from
            the records you actually keep.
          </motion.p>

          <motion.div {...rise(0.21)} className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <Button size="lg">
                Start free
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </motion.div>

          <motion.ul
            {...rise(0.28)}
            className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
          >
            {BULLETS.map((bullet) => (
              <li key={bullet} className="inline-flex items-center gap-1.5">
                <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
                {bullet}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div
            aria-hidden="true"
            className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-accent/20 blur-2xl"
          />
          <DashboardPreview />
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
