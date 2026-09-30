import { formatDate } from "@/lib/dates";
import { orderReference, summarizeItems } from "@/components/orders/orderLogic";
import type { Customer, Order, Product } from "@/types/business";

export type SearchGroup = "customers" | "products" | "orders";

export const SEARCH_GROUP_LABELS: Record<SearchGroup, string> = {
  customers: "Customers",
  products: "Products",
  orders: "Orders",
};

export const SEARCH_GROUP_ORDER: SearchGroup[] = ["customers", "products", "orders"];

export interface SearchResult {
  id: string;
  group: SearchGroup;
  title: string;
  subtitle: string;
  href: string;
}

export interface SearchData {
  customers: readonly Customer[];
  products: readonly Product[];
  orders: readonly Order[];
}

/** Everything searchable about a record, lower-cased once. */
function haystack(...parts: (string | number)[]): string {
  return parts
    .filter((part) => part !== null && part !== undefined && part !== "")
    .join(" ")
    .toLowerCase();
}

function matches(text: string, query: string): boolean {
  if (query === "") return true;
  // Every whitespace-separated token must appear somewhere.
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => text.includes(token));
}

/** Builds every result once — the palette and /search share this shape. */
export function buildSearchResults(data: SearchData): SearchResult[] {
  const results: SearchResult[] = [];

  for (const customer of data.customers) {
    results.push({
      id: `customer:${customer.id}`,
      group: "customers",
      title: customer.name,
      subtitle: [customer.email, customer.company].filter(Boolean).join(" · ") || "Customer",
      href: `/customers/${customer.id}`,
    });
  }

  for (const product of data.products) {
    results.push({
      id: `product:${product.id}`,
      group: "products",
      title: product.name,
      subtitle: [product.category, product.description].filter(Boolean).join(" · ") || "Product",
      href: "/products",
    });
  }

  for (const order of data.orders) {
    const customer = data.customers.find((entry) => entry.id === order.customerId);
    results.push({
      id: `order:${order.id}`,
      group: "orders",
      title: orderReference(order),
      subtitle: [
        customer?.name ?? "Unknown customer",
        formatDate(order.date),
        summarizeItems(order.items),
      ].join(" · "),
      href: `/orders/${order.id}`,
    });
  }

  return results;
}

/**
 * Groups + filters the result set.
 * Results are ranked by field weight (title beats subtitle) inside each group.
 */
export function searchResults(
  results: readonly SearchResult[],
  data: SearchData,
  rawQuery: string,
  perGroup = 6,
): { group: SearchGroup; items: SearchResult[] }[] {
  const query = rawQuery.trim().toLowerCase();

  const titleText = new Map<string, string>();
  for (const result of results) {
    if (result.group === "customers") {
      const customer = data.customers.find((entry) => `customer:${entry.id}` === result.id);
      titleText.set(result.id, customer ? haystack(customer.name, customer.email, customer.company, customer.tags.join(" ")) : "");
    } else if (result.group === "products") {
      const product = data.products.find((entry) => `product:${entry.id}` === result.id);
      titleText.set(result.id, product ? haystack(product.name, product.category, product.description) : "");
    } else {
      const order = data.orders.find((entry) => `order:${entry.id}` === result.id);
      const customer = order ? data.customers.find((entry) => entry.id === order.customerId) : null;
      titleText.set(
        result.id,
        order
          ? haystack(
              orderReference(order),
              order.id,
              order.status,
              customer?.name ?? "",
              ...order.items.map((item) => item.productName),
            )
          : "",
      );
    }
  }

  return SEARCH_GROUP_ORDER.map((group) => {
    const items = results
      .filter((result) => result.group === group)
      .filter((result) => matches(titleText.get(result.id) ?? "", query))
      .sort((a, b) => {
        const at = (titleText.get(a.id) ?? "").indexOf(query);
        const bt = (titleText.get(b.id) ?? "").indexOf(query);
        const aScore = at === 0 ? 0 : at > 0 ? 1 : 2;
        const bScore = bt === 0 ? 0 : bt > 0 ? 1 : 2;
        if (aScore !== bScore) return aScore - bScore;
        return a.title.localeCompare(b.title);
      })
      .slice(0, perGroup);

    return { group, items };
  });
}

/** Result count across all groups — used for the live count announcement. */
export function totalMatches(groups: readonly { items: SearchResult[] }[]): number {
  return groups.reduce((sum, group) => sum + group.items.length, 0);
}
