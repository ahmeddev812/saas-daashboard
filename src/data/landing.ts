/**
 * ===========================================================================
 * LANDING PAGE PRESENTATION DATA — STATIC / DEMO ONLY
 * ---------------------------------------------------------------------------
 * The numbers below are MARKETING COPY for the landing page preview.
 *
 * They are deliberately NOT derived from BusinessDataProvider and this module
 * must never import business state or touch localStorage. The landing page is
 * a public route; the dashboard preview is an illustration, not a report.
 *
 * Real, derived metrics live in lib/calculations.ts and are only rendered
 * inside the authenticated app.
 * ===========================================================================
 */

export const DEMO_PREVIEW_NOTICE = "Sample data — illustration only";

export interface PreviewMetric {
  label: string;
  value: string;
  delta: number | null;
}

/** Static headline figures used inside the hero dashboard preview. */
export const PREVIEW_METRICS: PreviewMetric[] = [
  { label: "MRR", value: "$48,250", delta: 12.4 },
  { label: "Active customers", value: "1,284", delta: 6.1 },
  { label: "Orders (30d)", value: "3,092", delta: 9.8 },
  { label: "Revenue (30d)", value: "$126,940", delta: -2.3 },
];

/** Static series for the preview area chart (arbitrary shape, 14 points). */
export const PREVIEW_SERIES: number[] = [
  28, 31, 30, 34, 33, 38, 41, 39, 44, 47, 45, 51, 55, 58,
];

/** Static recent-order rows for the preview table. */
export const PREVIEW_ORDERS: Array<{
  id: string;
  customer: string;
  product: string;
  amount: string;
  status: "paid" | "pending" | "refunded";
}> = [
  { id: "ORD-1042", customer: "Northwind Labs", product: "Scale plan", amount: "$1,240", status: "paid" },
  { id: "ORD-1041", customer: "Harbor & Co", product: "Onboarding", amount: "$480", status: "paid" },
  { id: "ORD-1040", customer: "Vertex Studio", product: "Growth plan", amount: "$760", status: "pending" },
  { id: "ORD-1039", customer: "Lumen Retail", product: "Refund", amount: "-$210", status: "refunded" },
];

export interface LandingFeature {
  title: string;
  description: string;
  /** lucide icon name key mapped in the component. */
  icon: "chart" | "users" | "box" | "receipt" | "team" | "report";
}

/** Six-feature bento grid. */
export const LANDING_FEATURES: LandingFeature[] = [
  {
    title: "Live metrics",
    description:
      "MRR, ARR, churn, LTV, ARPU and growth recalculated the instant you change a record — never a stale number.",
    icon: "chart",
  },
  {
    title: "Customer records",
    description:
      "Search, tag, filter and bulk-edit your book of business. Every change is written straight to browser storage.",
    icon: "users",
  },
  {
    title: "Product catalogue",
    description:
      "Prices you set today, captured on the order line tomorrow. History never rewrites itself when a price changes.",
    icon: "box",
  },
  {
    title: "Order workflow",
    description:
      "Pending → paid → fulfilled, with refunds as a clean terminal state that is excluded from recognized revenue.",
    icon: "receipt",
  },
  {
    title: "Team & activity",
    description:
      "Invite teammates, assign roles and read a running activity log of everything that happened in the workspace.",
    icon: "team",
  },
  {
    title: "Reports & export",
    description:
      "Pre-built templates over your current filters, exported to CSV or JSON with date-stamped filenames.",
    icon: "report",
  },
];

export interface LandingStep {
  step: string;
  title: string;
  description: string;
}

export const LANDING_STEPS: LandingStep[] = [
  {
    step: "01",
    title: "Set up your business",
    description:
      "A four-step onboarding captures your name, industry, currency, fiscal year and the metric you actually care about.",
  },
  {
    step: "02",
    title: "Record what happens",
    description:
      "Add customers, products and orders. ATLARIS stores line items with captured prices so your history stays honest.",
  },
  {
    step: "03",
    title: "Read the signal",
    description:
      "Dashboard, revenue, analytics and reports all derive from the same records — change data once, every screen follows.",
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I finally stopped keeping a parallel spreadsheet. The dashboard number and my accountant's number agree, because they come from the same orders.",
    name: "Priya Raman",
    role: "Founder, Northwind Labs",
    initials: "PR",
  },
  {
    quote:
      "Refunds used to quietly inflate our revenue. Now they're a terminal state that never counts toward recognized revenue — one less argument in the board meeting.",
    name: "Marcus Feld",
    role: "Ops Lead, Harbor & Co",
    initials: "MF",
  },
  {
    quote:
      "The activity log answers the question we used to ask every week: who changed what, and when. It's all just there.",
    name: "Sofia Lindqvist",
    role: "Head of Growth, Vertex Studio",
    initials: "SL",
  },
  {
    quote:
      "Everything is local, so nothing leaves the browser. For our client work that isn't a limitation — it's the requirement.",
    name: "Daniel Okoye",
    role: "Principal, Lumen Retail",
    initials: "DO",
  },
];

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

/** Presentation only — ATLARIS processes no payments. */
export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to run a single business locally.",
    features: [
      "Unlimited customers, products and orders",
      "Dashboard, revenue and analytics",
      "CSV and JSON export",
      "Light, dark and system themes",
      "Data stored in your browser",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$18",
    period: "per month",
    description: "For teams that need deeper reporting and shared views.",
    features: [
      "Everything in Free",
      "Cohort and funnel analysis",
      "Pre-built report templates",
      "Team roles and activity log",
      "Custom goals and targets",
      "Priority template updates",
    ],
    cta: "Choose Pro",
    highlighted: true,
  },
];

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Where is my data stored?",
    answer:
      "Entirely in your browser, under localStorage keys prefixed with `atlaris_`. Nothing is sent to a server, and clearing your browser storage removes it. Export a JSON backup if you want to keep it.",
  },
  {
    question: "Is this a real accounting tool?",
    answer:
      "No. ATLARIS is a working analytics dashboard, not an accounting system. It derives MRR, ARR, churn, LTV and similar metrics from the records you enter, and it never invents a figure when the data is insufficient.",
  },
  {
    question: "Do I need an account?",
    answer:
      "A local one. Sign-up, login and the demo user are stored on this device only — they are a UI convenience, not secure authentication. Do not reuse a real password.",
  },
  {
    question: "Does the demo wipe my data?",
    answer:
      "Loading the demo dataset replaces your business records with roughly 90 days of sample data. Export first if you have real records you want to keep.",
  },
  {
    question: "Can I get my data out?",
    answer:
      "Yes. Settings offers a full JSON export and import with validation, and customers, orders and reports export to CSV with date-stamped filenames.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "The Free plan is the whole product for a single business. Pro is a presentation on this page — ATLARIS processes no payments and no subscription is created.",
  },
];
