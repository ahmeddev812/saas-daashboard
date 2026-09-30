"use client";

/**
 * Business data hooks — thin re-exports of the BusinessDataProvider contexts.
 * Pages/components must use these instead of touching localStorage.
 */

export {
  useBusiness,
  useBusinessActions,
  useBusinessData,
} from "@/context/BusinessDataProvider";
export type { BusinessActions, BusinessData } from "@/context/BusinessDataProvider";
