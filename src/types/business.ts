/* ===========================================================================
   ATLARIS — shared business types
   Mirrors the data models defined in the project specification.
   =========================================================================== */

/* --------------------------------------------------------------------------
   Enumerations / unions
   -------------------------------------------------------------------------- */

/**
 * Order lifecycle:
 *   pending -> paid -> fulfilled
 *   refunded is a TERMINAL state (never leaves refunded).
 *   Refunded orders are excluded from recognized revenue everywhere.
 */
export type OrderStatus = "pending" | "paid" | "fulfilled" | "refunded";

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "refunded"],
  paid: ["fulfilled", "refunded"],
  fulfilled: ["refunded"],
  refunded: [],
};

export type CustomerStatus = "active" | "churned" | "trial";

export type ProductStatus = "active" | "draft" | "archived";

export type TeamRole = "owner" | "admin" | "member";

export type TeamMemberStatus = "active" | "invited" | "inactive";

export type GoalType = "revenue" | "customers" | "orders";

export type ThemePreference = "light" | "dark" | "system";

export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD"
  | "CHF"
  | "CNY"
  | "INR"
  | "BRL"
  | "SEK"
  | "SGD"
  | "AED"
  | "ZAR";

export type PaymentMethod = "card" | "bank_transfer" | "cash" | "paypal" | "other";

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "login"
  | "logout"
  | "import"
  | "export"
  | "reset"
  | "invite";

export type ActivityEntity =
  | "customer"
  | "product"
  | "order"
  | "team"
  | "goal"
  | "business"
  | "settings"
  | "auth"
  | "data";

export type PrimaryMetric = "mrr" | "revenue" | "customers" | "orders";

/* --------------------------------------------------------------------------
   Core entities
   -------------------------------------------------------------------------- */

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
  plan: string;
  /** Monthly recurring revenue attributed to this customer. */
  mrr: number;
  /** ISO date (YYYY-MM-DD) */
  joinDate: string;
  /** ISO date (YYYY-MM-DD) */
  lastActive: string;
  notes: string;
  tags: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  /** Unit price in the active business currency. */
  price: number;
  category: string;
  stock: number;
  status: ProductStatus;
  /** ISO date (YYYY-MM-DD) */
  createdAt: string;
}

/** A single line on an order. `price` is CAPTURED at order time. */
export interface OrderItem {
  productId: string;
  /** Display name captured at order time (survives product renames). */
  productName: string;
  qty: number;
  /** Unit price captured at order time — never recalculated later. */
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  /** Order total in the active business currency. */
  total: number;
  status: OrderStatus;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  paymentMethod: PaymentMethod;
  /** Optional customer-facing invoice reference. */
  reference?: string;
  notes?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  /** ISO date (YYYY-MM-DD) */
  joinedAt: string;
  /** Initials used for the avatar chip. */
  avatar: string;
}

export interface BusinessGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  /** ISO date (YYYY-MM-DD) */
  deadline: string;
  type: GoalType;
}

/* --------------------------------------------------------------------------
   Supporting models
   -------------------------------------------------------------------------- */

export interface BusinessProfile {
  name: string;
  industry: string;
  currency: CurrencyCode;
  timezone: string;
  /** Month (1-12) the fiscal year starts in. */
  fiscalYearStart: number;
  /** True once the onboarding wizard has been completed. */
  onboardingDone: boolean;
  /** Primary metric chosen during onboarding. */
  primaryMetric: PrimaryMetric;
  /** Owner user id (local demo auth). */
  ownerId: string | null;
}

export interface AppSettings {
  theme: ThemePreference;
  currency: CurrencyCode;
  timezone: string;
  fiscalYearStart: number;
  /** Default date window used by analytics/reports, in days. */
  defaultDateRange: number;
  /** Manual acquisition spend used for CAC (never invented). */
  acquisitionCost: number;
  /** Reduced motion override; null = follow OS preference. */
  reduceMotion: boolean | null;
  /** Compact density for data tables. */
  compactTables: boolean;
}

export interface ActivityEntry {
  id: string;
  /** Display name of the actor (user or team member). */
  actor: string;
  action: ActivityAction;
  entity: ActivityEntity;
  /** Entity identifier this activity refers to, when applicable. */
  entityId?: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Human readable sentence. */
  description: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  /**
   * DEMO ONLY — a weak, non-cryptographic hash stored in localStorage.
   * This is NOT production authentication. See AuthContext for details.
   */
  passwordHash: string;
  /** ISO 8601 timestamp */
  createdAt: string;
}

/* --------------------------------------------------------------------------
   Persistence envelopes
   -------------------------------------------------------------------------- */

/** Shape of a full JSON export/import payload. */
export interface BusinessExportPayload {
  schemaVersion: number;
  exportedAt: string;
  business: BusinessProfile;
  settings: AppSettings;
  customers: Customer[];
  products: Product[];
  orders: Order[];
  team: TeamMember[];
  goals: BusinessGoal[];
  activities: ActivityEntry[];
}

export const EXPORT_SCHEMA_VERSION = 1;

/* --------------------------------------------------------------------------
   Shared option lists (used by forms, filters and reports)
   -------------------------------------------------------------------------- */

export const CUSTOMER_STATUSES: CustomerStatus[] = ["active", "churned", "trial"];
export const PRODUCT_STATUSES: ProductStatus[] = ["active", "draft", "archived"];
export const TEAM_ROLES: TeamRole[] = ["owner", "admin", "member"];
export const GOAL_TYPES: GoalType[] = ["revenue", "customers", "orders"];
export const PAYMENT_METHODS: PaymentMethod[] = [
  "card",
  "bank_transfer",
  "cash",
  "paypal",
  "other",
];
export const CURRENCY_CODES: CurrencyCode[] = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "INR",
  "BRL",
  "SEK",
  "SGD",
  "AED",
  "ZAR",
];

export const INDUSTRIES: string[] = [
  "Software & SaaS",
  "E-commerce & Retail",
  "Professional Services",
  "Finance & Accounting",
  "Health & Wellness",
  "Education & Training",
  "Media & Entertainment",
  "Manufacturing",
  "Travel & Hospitality",
  "Other",
];

export const PLAN_NAMES: string[] = ["Free", "Starter", "Growth", "Scale", "Enterprise"];
