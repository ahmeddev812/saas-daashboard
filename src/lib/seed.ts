/**
 * ATLARIS demo dataset (spec §29).
 *
 * ~90 days of internally consistent customers, products, orders, activities
 * and team members — generated deterministically so the demo workspace is
 * stable, varied enough for useful charts, and never silently applied.
 *
 * Usage rules:
 *   - Opt-in ONLY (demo sign-in or the "Load demo data" button).
 *   - Never called during SSR.
 *   - Never applied to a workspace that already has records.
 */
import { generateId } from "@/lib/id";
import { addDays, toDateKey } from "@/lib/dates";
import {
  type ActivityEntry,
  type Customer,
  type CustomerStatus,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentMethod,
  type Product,
  type TeamMember,
  type TeamRole,
} from "@/types/business";

export interface SampleDataset {
  customers: Customer[];
  products: Product[];
  orders: Order[];
  activities: ActivityEntry[];
  team: TeamMember[];
}

/* ------------------------------------------------------------------------- *
   Deterministic PRNG — same dataset shape on every run
   ------------------------------------------------------------------------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length) % items.length];
}

function randomInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/* ------------------------------------------------------------------------- *
   Static definitions
   ------------------------------------------------------------------------- */

const DEMO_ACTOR = "Alex Rivera";

interface CustomerSeed {
  name: string;
  company: string;
  plan: string;
  mrr: number;
  status: CustomerStatus;
  tags: string[];
}

const CUSTOMERS: CustomerSeed[] = [
  { name: "Maya Chen", company: "Northwind Labs", plan: "Enterprise", mrr: 4200, status: "active", tags: ["enterprise", "priority"] },
  { name: "Diego Alvarez", company: "Harbour & Co", plan: "Scale", mrr: 1800, status: "active", tags: ["referral"] },
  { name: "Priya Raman", company: "Lumen Health", plan: "Scale", mrr: 1650, status: "active", tags: ["enterprise"] },
  { name: "Tomas Novak", company: "Kestrel Freight", plan: "Growth", mrr: 790, status: "active", tags: ["logistics"] },
  { name: "Aisha Bello", company: "Verdant Foods", plan: "Growth", mrr: 690, status: "trial", tags: ["trial"] },
  { name: "Lucas Meyer", company: "Alpine Metrics", plan: "Enterprise", mrr: 3800, status: "active", tags: ["enterprise", "priority"] },
  { name: "Sofia Ricci", company: "Bellwether", plan: "Growth", mrr: 890, status: "churned", tags: ["churn-risk"] },
  { name: "Ethan Brooks", company: "Orbit Media", plan: "Growth", mrr: 750, status: "active", tags: ["referral"] },
  { name: "Hannah Kim", company: "Solaris Retail", plan: "Scale", mrr: 1550, status: "active", tags: ["retail"] },
  { name: "Omar Haddad", company: "Meridian Bank", plan: "Enterprise", mrr: 5000, status: "active", tags: ["enterprise", "priority"] },
  { name: "Elena Petrova", company: "Cobalt Studio", plan: "Free", mrr: 0, status: "trial", tags: ["trial"] },
  { name: "Jack Thornton", company: "Ridgeline Outfitters", plan: "Growth", mrr: 820, status: "active", tags: ["retail"] },
  { name: "Ines Duarte", company: "Coral & Tide", plan: "Free", mrr: 0, status: "trial", tags: ["trial"] },
  { name: "Wei Zhang", company: "Farsight AI", plan: "Scale", mrr: 2100, status: "active", tags: ["enterprise"] },
  { name: "Nora Lindqvist", company: "Fjord Analytics", plan: "Growth", mrr: 940, status: "churned", tags: ["churn-risk"] },
  { name: "Kwame Mensah", company: "Adinkra Goods", plan: "Starter", mrr: 49, status: "active", tags: ["small-biz"] },
];

interface ProductSeed {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  status?: "active" | "draft" | "archived";
}

const PRODUCTS: ProductSeed[] = [
  { name: "Analytics Starter", description: "Core dashboards for small teams.", price: 19, category: "Software", stock: 999 },
  { name: "Atlas Analytics Pro", description: "Advanced reporting, cohorts and exports.", price: 49, category: "Software", stock: 999 },
  { name: "Insight Sync Add-on", description: "Hourly warehouse sync.", price: 19, category: "Software", stock: 999 },
  { name: "Enterprise SSO Module", description: "SAML + SCIM provisioning.", price: 399, category: "Software", stock: 100 },
  { name: "Warehouse Connectors Pack", description: "BigQuery, Snowflake and Redshift connectors.", price: 149, category: "Software", stock: 500 },
  { name: "Onboarding Workshop", description: "Two-hour guided setup session.", price: 1200, category: "Services", stock: 20 },
  { name: "Priority Support Retainer", description: "Four-hour response SLA.", price: 450, category: "Services", stock: 30 },
  { name: "Custom Report Build", description: "Tailored report authored by our team.", price: 850, category: "Services", stock: 15 },
  { name: "Training Credits", description: "Ten credits for operator training.", price: 300, category: "Services", stock: 40, status: "draft" },
  { name: "Legacy Reports Add-on", description: "Superseded by Atlas Analytics Pro.", price: 29, category: "Software", stock: 0, status: "archived" },
];

const PAYMENT_POOL: PaymentMethod[] = ["card", "card", "card", "bank_transfer", "paypal", "cash", "other"];

/* ------------------------------------------------------------------------- *
   Generator
   ------------------------------------------------------------------------- */

function isoAt(dateKey: string, hour: number): string {
  return `${dateKey}T${String(hour).padStart(2, "0")}:00:00.000Z`;
}

/**
 * Builds the demo dataset anchored to `days` days ending today.
 * All IDs are real `generateId()` values and every order references an
 * existing customer and product, so metrics derive correctly everywhere.
 */
export function buildSampleData(days = 90): SampleDataset {
  const rng = mulberry32(20260926);
  const now = new Date();

  const dayKey = (age: number) => toDateKey(addDays(now, -age));
  const activityId = (() => {
    let counter = 0;
    return () => `activity-${counter++}`;
  })();

  /* --- customers --- */
  const customers: Customer[] = CUSTOMERS.map((seed, index) => {
    const joinAge = randomInt(rng, Math.min(index * 5, days - 10), days - 1);
    const joinDate = dayKey(joinAge);
    const lastAge = Math.max(0, joinAge - randomInt(rng, 0, Math.min(joinAge, 30)));
    const email = `${seed.name.split(" ")[0].toLowerCase()}.${seed.company.split(/[^a-zA-Z]+/)[0].toLowerCase()}@example.com`;

    return {
      id: generateId(),
      name: seed.name,
      email,
      phone: `+1 555 01${String(index).padStart(2, "0")}`,
      company: seed.company,
      status: seed.status,
      plan: seed.plan,
      mrr: seed.mrr,
      joinDate,
      lastActive: dayKey(lastAge),
      notes: "",
      tags: seed.tags,
    };
  });

  /* --- products --- */
  const products: Product[] = PRODUCTS.map((seed) => ({
    id: generateId(),
    name: seed.name,
    description: seed.description,
    price: seed.price,
    category: seed.category,
    stock: seed.stock,
    status: seed.status ?? "active",
    createdAt: dayKey(randomInt(rng, days - 1, days)),
  }));

  const sellable = products.filter((product) => product.status !== "archived");

  /* --- orders --- */
  const orders: Order[] = [];
  const ORDER_COUNT = 64;

  for (let i = 0; i < ORDER_COUNT; i += 1) {
    const age = randomInt(rng, 0, days - 1);
    const date = dayKey(age);
    const customer = pick(rng, customers);

    const itemCount = randomInt(rng, 1, 2);
    const items: OrderItem[] = [];
    for (let j = 0; j < itemCount; j += 1) {
      const product = pick(rng, sellable);
      if (items.some((item) => item.productId === product.id)) continue;
      items.push({
        productId: product.id,
        productName: product.name,
        qty: randomInt(rng, 1, product.category === "Services" ? 2 : 4),
        price: product.price,
      });
    }
    if (items.length === 0) {
      const product = sellable[0];
      items.push({ productId: product.id, productName: product.name, qty: 1, price: product.price });
    }

    const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const roll = rng();

    let status: OrderStatus;
    if (roll < 0.06) status = "refunded";
    else if (age <= 3) status = roll < 0.45 ? "pending" : roll < 0.8 ? "paid" : "fulfilled";
    else if (age <= 12) status = roll < 0.75 ? "paid" : "fulfilled";
    else status = roll < 0.94 ? "fulfilled" : "paid";

    orders.push({
      id: generateId(),
      customerId: customer.id,
      items,
      total,
      status,
      date,
      paymentMethod: pick(rng, PAYMENT_POOL),
      reference: `ORD-${1001 + i}`,
    });
  }

  orders.sort((a, b) => b.date.localeCompare(a.date));

  /* --- activities --- */
  const activities: ActivityEntry[] = [];

  for (const customer of customers) {
    activities.push({
      id: activityId(),
      actor: DEMO_ACTOR,
      action: "create",
      entity: "customer",
      entityId: customer.id,
      timestamp: isoAt(customer.joinDate, 9),
      description: `Added customer ${customer.name}`,
    });
  }

  for (const product of products) {
    activities.push({
      id: activityId(),
      actor: DEMO_ACTOR,
      action: "create",
      entity: "product",
      entityId: product.id,
      timestamp: isoAt(product.createdAt, 10),
      description: `Created product ${product.name}`,
    });
  }

  for (const order of orders.slice(0, 24)) {
    const customer = customers.find((entry) => entry.id === order.customerId);
    activities.push({
      id: activityId(),
      actor: DEMO_ACTOR,
      action: "create",
      entity: "order",
      entityId: order.id,
      timestamp: isoAt(order.date, 11),
      description: `Recorded ${order.reference} for ${customer?.name ?? "a customer"}`,
    });
  }

  for (const order of orders.filter((entry) => entry.status === "refunded")) {
    const customer = customers.find((entry) => entry.id === order.customerId);
    activities.push({
      id: activityId(),
      actor: DEMO_ACTOR,
      action: "status_change",
      entity: "order",
      entityId: order.id,
      timestamp: isoAt(order.date, 15),
      description: `Refunded ${order.reference} for ${customer?.name ?? "a customer"}`,
    });
  }

  activities.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  /* --- team --- */
  const teamSeeds: { name: string; email: string; role: TeamRole; status: TeamMember["status"] }[] = [
    { name: "Alex Rivera", email: "demo@atlaris.app", role: "owner", status: "active" },
    { name: "Jordan Lee", email: "jordan@atlaris.app", role: "admin", status: "active" },
    { name: "Sam Okafor", email: "sam@atlaris.app", role: "member", status: "active" },
    { name: "Casey Ford", email: "casey@atlaris.app", role: "member", status: "invited" },
  ];
  const team: TeamMember[] = teamSeeds.map((member) => ({
    ...member,
    id: generateId(),
    joinedAt: dayKey(randomInt(rng, days - 45, days - 1)),
    avatar: member.name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase(),
  }));

  return { customers, products, orders, activities, team };
}

export default buildSampleData;
