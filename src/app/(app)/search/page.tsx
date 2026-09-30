import type { Metadata } from "next";
import { SearchPageClient } from "@/components/search/SearchPageClient";

export const metadata: Metadata = {
  title: "Search",
  description: "Search customers, products and orders across this workspace.",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return <SearchPageClient />;
}
