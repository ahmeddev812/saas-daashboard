import {
  calculateARPU,
  calculateMRR,
  countActiveCustomers,
  customersJoinedInRange,
  formatCurrency,
  isRecognized,
  ordersInRange,
  recognizedRevenue,
  refundedRevenue,
  revenueByDay,
  revenueByProduct,
} from "@/lib/calculations";
import { formatDate, getDateRange } from "@/lib/dates";
import type { CurrencyCode, Customer, Order, Product } from "@/types/business";
import type { DateRange } from "@/components/analytics/analyticsLib";

/** Raw cell value — this is exactly what CSV/JSON exports contain. */
export type ReportCell = string | number;

export interface ReportContext {
  range: DateRange;
  /** Orders inside the selected range. */
  orders: Order[];
  customers: Customer[];
  products: Product[];
  currency: CurrencyCode;
}

export interface ReportColumn {
  key: string;
  header: string;
  align?: "left" | "right";
  /** Display-only formatter. Exports always use the raw cell value. */
  format?: (value: ReportCell, ctx: ReportContext) => string;
}

export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  columns: ReportColumn[];
  build: (ctx: ReportContext) => ReportCell[][];
}

const dateCell = (value: ReportCell) => formatDate(String(value));

const currency = (value: ReportCell, ctx: ReportContext) =>
  formatCurrency(Number(value), ctx.currency);

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "summary",
    title: "Executive summary",
    description: "Headline numbers for the selected range.",
    columns: [
      { key: "metric", header: "Metric" },
      { key: "value", header: "Value", align: "right" },
    ],
    build: (ctx) => {
      const revenue = recognizedRevenue(ctx.orders);
      const refunded = refundedRevenue(ctx.orders);
      const joined = customersJoinedInRange(ctx.customers, ctx.range.from, ctx.range.to).length;
      const mrr = calculateMRR(ctx.customers);
      const arpu = calculateARPU(mrr, countActiveCustomers(ctx.customers));

      return [
        ["Range", `${ctx.range.from} to ${ctx.range.to}`],
        ["Recognized revenue", Math.round(revenue * 100) / 100],
        ["Refunded revenue", Math.round(refunded * 100) / 100],
        ["Orders", ctx.orders.length],
        ["New customers", joined],
        ["MRR (today)", Math.round(mrr * 100) / 100],
        ["ARPU (today)", arpu === null ? "—" : Math.round(arpu * 100) / 100],
      ];
    },
  },
  {
    id: "revenue",
    title: "Revenue by day",
    description: "Recognized revenue for every day in the range.",
    columns: [
      { key: "date", header: "Date", format: dateCell },
      { key: "revenue", header: "Revenue", align: "right", format: currency },
      { key: "orders", header: "Orders", align: "right" },
    ],
    build: (ctx) => {
      const keys = getDateRange(ctx.range.from, ctx.range.to);
      return revenueByDay(ctx.orders, keys).map((row) => [
        row.key,
        Math.round(row.value * 100) / 100,
        row.count,
      ]);
    },
  },
  {
    id: "orders",
    title: "Orders",
    description: "Every order placed in the range, newest first.",
    columns: [
      { key: "date", header: "Date", format: dateCell },
      { key: "reference", header: "Reference" },
      { key: "customer", header: "Customer" },
      { key: "status", header: "Status" },
      { key: "items", header: "Items", align: "right" },
      { key: "total", header: "Total", align: "right", format: currency },
      { key: "recognized", header: "Recognized", align: "right", format: currency },
    ],
    build: (ctx) => {
      const names = new Map(ctx.customers.map((customer) => [customer.id, customer.name]));
      return [...ctx.orders]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((order) => [
          order.date,
          order.reference ?? `#${order.id.slice(-6).toUpperCase()}`,
          names.get(order.customerId) ?? "Unknown customer",
          order.status,
          order.items.reduce((sum, item) => sum + item.qty, 0),
          Math.round(order.total * 100) / 100,
          isRecognized(order) ? Math.round(order.total * 100) / 100 : 0,
        ]);
    },
  },
  {
    id: "customers",
    title: "New customers",
    description: "Customers who joined inside the range.",
    columns: [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "company", header: "Company" },
      { key: "status", header: "Status" },
      { key: "plan", header: "Plan" },
      { key: "mrr", header: "MRR", align: "right", format: currency },
      { key: "joined", header: "Joined", format: dateCell },
    ],
    build: (ctx) =>
      customersJoinedInRange(ctx.customers, ctx.range.from, ctx.range.to)
        .sort((a, b) => a.joinDate.localeCompare(b.joinDate))
        .map((customer) => [
          customer.name,
          customer.email,
          customer.company,
          customer.status,
          customer.plan,
          customer.mrr,
          customer.joinDate,
        ]),
  },
  {
    id: "products",
    title: "Product performance",
    description: "Units and recognized revenue per product in the range.",
    columns: [
      { key: "product", header: "Product" },
      { key: "category", header: "Category" },
      { key: "units", header: "Units", align: "right" },
      { key: "revenue", header: "Revenue", align: "right", format: currency },
    ],
    build: (ctx) => {
      const categories = new Map(ctx.products.map((product) => [product.id, product.category]));
      return revenueByProduct(ctx.orders, ctx.products)
        .filter((entry) => entry.value > 0)
        .map((entry) => [
          entry.label,
          categories.get(entry.id) ?? "—",
          entry.count,
          Math.round(entry.value * 100) / 100,
        ]);
    },
  },
];

export function findReportTemplate(id: string): ReportTemplate {
  return REPORT_TEMPLATES.find((template) => template.id === id) ?? REPORT_TEMPLATES[0];
}

/** Orders inside the range — the single source for every template. */
export function reportOrders(orders: readonly Order[], range: DateRange): Order[] {
  return ordersInRange(orders, range.from, range.to);
}

/** Display string for a cell, using the column formatter when present. */
export function formatCell(column: ReportColumn, value: ReportCell, ctx: ReportContext): string {
  if (value === null || value === undefined) return "—";
  return column.format ? column.format(value, ctx) : String(value);
}
