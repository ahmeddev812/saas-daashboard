"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { TESTIMONIALS } from "@/data/landing";
import { cn } from "@/lib/cn";

const AUTO_ADVANCE_MS = 7000;

/**
 * Auto-advancing testimonial carousel.
 *
 * The slide index lives in component state only — no persistence. The timer
 * callback advances the index from inside `setTimeout`, never synchronously
 * from the effect body, and is cleared on pause / unmount.
 */
export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = TESTIMONIALS.length;

  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;

    const schedule = (delay: number) => {
      timer = setTimeout(() => {
        if (!active) return;
        // Advancing is always relative to the latest index at fire time.
        setIndex((current) => (current + 1) % total);
        schedule(AUTO_ADVANCE_MS);
      }, delay);
    };

    schedule(AUTO_ADVANCE_MS);

    return () => {
      active = false;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [paused, total]);

  const go = (next: number) => setIndex(((next % total) + total) % total);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null) return;

    const delta = event.changedTouches[0]?.clientX ?? start;
    const distance = delta - start;
    if (Math.abs(distance) < 48) return;
    go(distance < 0 ? index + 1 : index - 1);
  };

  const active = TESTIMONIALS[index];

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="scroll-mt-24"
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Testimonials
          </p>
          <h2
            id="testimonials-heading"
            className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Teams who stopped keeping a second spreadsheet
          </h2>
        </div>

        <div
          className="relative mx-auto mt-12 max-w-3xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="glass rounded-panel p-7 shadow-card sm:p-10">
            <Quote className="size-8 text-primary/60" aria-hidden="true" />

            <figure className="mt-4">
              <blockquote className="text-pretty text-lg leading-relaxed text-foreground sm:text-xl">
                {active.quote}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="gradient-primary grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-primary-foreground"
                >
                  {active.initials}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {active.name}
                  </span>
                  <span className="block text-sm text-muted-foreground">{active.role}</span>
                </span>
              </figcaption>
            </figure>

            {/* Announce the active slide for assistive tech */}
            <p className="sr-only" aria-live="polite">
              Testimonial {index + 1} of {total}: {active.name}, {active.role}
            </p>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="grid size-10 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2" role="tablist" aria-label="Testimonials">
              {TESTIMONIALS.map((item, i) => (
                <button
                  key={item.name}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show testimonial ${i + 1} of ${total}`}
                  onClick={() => go(i)}
                  className="grid size-10 place-items-center rounded-full transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-2 rounded-full transition-all",
                      i === index ? "w-7 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/50",
                    )}
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => go(index + 1)}
              className="grid size-10 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Next testimonial"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground" aria-hidden="true">
            {paused ? "Paused" : "Auto-advancing"} · swipe or use the arrows
          </p>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
