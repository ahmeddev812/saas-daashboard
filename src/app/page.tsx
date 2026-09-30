import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "ATLARIS — SaaS analytics dashboard",
  description:
    "Carry your business. See everything. ATLARIS turns your customers, products and orders into live metrics — calculated locally in your browser.",
  alternates: { canonical: "/" },
};

/**
 * Public marketing landing page.
 *
 * Deliberately outside the authenticated AppShell: it renders no business
 * data and never reads BusinessDataProvider.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:shadow-card"
      >
        Skip to content
      </a>

      <LandingNav />

      <main id="main-content" className="flex-1">
        <Hero />
        <FeatureGrid />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
