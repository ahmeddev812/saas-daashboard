import type { Metadata } from "next";
import { TeamClient } from "@/components/team/TeamClient";

export const metadata: Metadata = {
  title: "Team",
  description: "Manage teammates, demo roles and per-member activity.",
  alternates: { canonical: "/team" },
};

export default function TeamPage() {
  return <TeamClient />;
}
