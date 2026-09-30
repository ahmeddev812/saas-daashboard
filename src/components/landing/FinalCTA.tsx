import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/brand/Logo";

export function FinalCTA() {
  return (
    <section id="cta" aria-labelledby="cta-heading" className="scroll-mt-24">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="glass relative overflow-hidden rounded-panel px-6 py-14 text-center shadow-glow sm:px-12 sm:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/25 blur-[100px]" />
            <div className="absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-accent/25 blur-[90px]" />
          </div>

          <Logo size={44} className="justify-center" />

          <h2
            id="cta-heading"
            className="mx-auto mt-6 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Open the dashboard and see your numbers move
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            Set up a workspace in under a minute. Your records stay in this
            browser, and you can export everything whenever you like.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">
                Get started free
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                I already have a workspace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
