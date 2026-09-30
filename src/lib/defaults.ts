import type {
  AppSettings,
  BusinessProfile,
} from "@/types/business";

/** Default business profile used for brand-new accounts and after a reset. */
export function createDefaultBusiness(): BusinessProfile {
  return {
    name: "My Business",
    industry: "Software & SaaS",
    currency: "USD",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    fiscalYearStart: 1,
    onboardingDone: false,
    primaryMetric: "mrr",
    ownerId: null,
  };
}

/** Default application settings (theme follows the OS until changed). */
export function createDefaultSettings(): AppSettings {
  return {
    theme: "system",
    currency: "USD",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    fiscalYearStart: 1,
    defaultDateRange: 30,
    acquisitionCost: 0,
    reduceMotion: null,
    compactTables: false,
  };
}
