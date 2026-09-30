import type { Metadata } from "next";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const metadata: Metadata = {
  title: "Settings",
  description: "Business profile, appearance, backups and local-storage controls.",
  alternates: { canonical: "/settings" },
};

export default function SettingsPage() {
  return <SettingsClient />;
}
