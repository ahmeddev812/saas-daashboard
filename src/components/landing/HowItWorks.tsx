import { LANDING_STEPS } from "@/data/landing";

/** Three-step "how it works" band. */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="scroll-mt-24 border-y border-border bg-subtle/60"
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2
            id="how-heading"
            className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            From blank workspace to readable signal
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            Three steps, no integration work, no data pipeline.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {LANDING_STEPS.map((item, index) => (
            <li key={item.step} className="relative">
              {/* Connector line between steps on wide screens */}
              {index < LANDING_STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[calc(50%+2.75rem)] top-7 hidden h-px w-[calc(100%-4rem)] bg-gradient-to-r from-primary/50 to-accent/40 md:block"
                />
              ) : null}

              <div className="relative flex flex-col items-center text-center">
                <span className="grid size-14 place-items-center rounded-2xl border border-primary/30 bg-card text-lg font-semibold text-primary shadow-glow">
                  {item.step}
                </span>

                <div className="mt-5 w-full rounded-panel border border-border bg-card p-6 shadow-card">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorks;
