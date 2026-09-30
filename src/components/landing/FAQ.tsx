"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "@/data/landing";
import { cn } from "@/lib/cn";

/**
 * Accessible FAQ accordion.
 *
 * Each row is a real `<button>` toggling `aria-expanded`; the panel is
 * referenced by `aria-controls` and keyed with `aria-labelledby`. Only one row
 * is open at a time and opening a row closes the previous one.
 */
export function FAQ() {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">FAQ</p>
            <h2
              id="faq-heading"
              className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
              Questions before you start
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Everything about where your data lives, what the metrics mean and
              how to get it back out.
            </p>
          </div>

          <ul className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openIndex === index;
              const triggerId = `${baseId}-trigger-${index}`;
              const panelId = `${baseId}-panel-${index}`;

              return (
                <li
                  key={item.question}
                  className={cn(
                    "overflow-hidden rounded-card border bg-card transition-colors",
                    isOpen ? "border-primary/40 shadow-card" : "border-border",
                  )}
                >
                  <h3>
                    <button
                      type="button"
                      id={triggerId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenIndex(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-medium text-foreground sm:text-base">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                          isOpen && "rotate-180 text-primary",
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  </h3>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    hidden={!isOpen}
                    className="px-5 pb-5"
                  >
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default FAQ;
