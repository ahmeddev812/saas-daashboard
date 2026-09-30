import type { Metadata } from "next";
import { ProductsClient } from "@/components/products/ProductsClient";

export const metadata: Metadata = {
  title: "Products",
  description: "Catalog, pricing, stock and revenue for every product you sell.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return <ProductsClient />;
}
