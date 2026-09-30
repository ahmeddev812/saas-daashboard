"use client";

/**
 * ===========================================================================
 * BusinessDataProvider — the single source of truth for business data
 * ---------------------------------------------------------------------------
 * Pages and components NEVER touch localStorage. They read state from
 * `useBusinessData()` and call actions from `useBusinessActions()`.
 *
 * Design:
 *   - DataContext    -> entities (changes rarely)
 *   - ActionsContext -> memoised handlers (changes rarely)
 *   Splitting them keeps unrelated widgets from re-rendering.
 *
 * Every mutation updates React state AND localStorage in the same step.
 * ===========================================================================
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type {
  ActivityEntry,
  AppSettings,
  BusinessExportPayload,
  BusinessGoal,
  BusinessProfile,
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  TeamMember,
} from "@/types/business";
import { EXPORT_SCHEMA_VERSION } from "@/types/business";

import {
  STORAGE_KEYS,
  readActivities,
  readBusiness,
  readCustomers,
  readGoals,
  readOrders,
  readProducts,
  readCurrentSession,
  readSettings,
  readTeam,
  resetBusinessData,
  setStored,
} from "@/lib/storage";
import { createDefaultBusiness, createDefaultSettings } from "@/lib/defaults";
import { generateId } from "@/lib/id";
import { nowIso } from "@/lib/dates";

/* --------------------------------------------------------------------------
   Contexts
   -------------------------------------------------------------------------- */

export interface BusinessData {
  customers: Customer[];
  products: Product[];
  orders: Order[];
  team: TeamMember[];
  activities: ActivityEntry[];
  goals: BusinessGoal[];
  business: BusinessProfile;
  settings: AppSettings;
}

export interface BusinessActions {
  /* customers */
  addCustomer: (input: Omit<Customer, "id">) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => Customer | null;
  deleteCustomer: (id: string) => boolean;
  bulkUpdateCustomers: (ids: string[], patch: Partial<Customer>) => number;
  bulkDeleteCustomers: (ids: string[]) => number;
  importCustomers: (rows: Customer[]) => number;

  /* products */
  addProduct: (input: Omit<Product, "id">) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => Product | null;
  deleteProduct: (id: string) => boolean;

  /* orders */
  addOrder: (input: Omit<Order, "id">) => Order;
  updateOrder: (id: string, patch: Partial<Order>) => Order | null;
  deleteOrder: (id: string) => boolean;
  /** Moves an order to the next allowed status (refunded is terminal). */
  setOrderStatus: (id: string, status: OrderStatus) => Order | null;

  /* team */
  addTeamMember: (input: Omit<TeamMember, "id" | "avatar">) => TeamMember;
  updateTeamMember: (id: string, patch: Partial<TeamMember>) => TeamMember | null;
  deleteTeamMember: (id: string) => boolean;

  /* goals */
  addGoal: (input: Omit<BusinessGoal, "id" | "current">) => BusinessGoal;
  updateGoal: (id: string, patch: Partial<BusinessGoal>) => BusinessGoal | null;
  deleteGoal: (id: string) => boolean;

  /* meta */
  addActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
  updateBusiness: (patch: Partial<BusinessProfile>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;

  /* data lifecycle */
  resetData: () => void;
  /** Validates then replaces ALL business data. Never partially applies. */
  importData: (raw: string) => { ok: boolean; error?: string; summary?: string };
  exportData: () => BusinessExportPayload;
  /** Loads the opt-in 90-day demo dataset. Only called by Demo User. */
  loadDataset: (dataset: Partial<BusinessData>) => void;
}

const DataContext = createContext<(BusinessData & { hydrated: boolean }) | null>(null);
const ActionsContext = createContext<BusinessActions | null>(null);

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

function createInitialState(): BusinessData {
  return {
    customers: [],
    products: [],
    orders: [],
    team: [],
    activities: [],
    goals: [],
    business: createDefaultBusiness(),
    settings: createDefaultSettings(),
  };
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

/** Status transition rules: refunded is TERMINAL. */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "refunded"],
  paid: ["fulfilled", "refunded"],
  fulfilled: ["refunded"],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/* --------------------------------------------------------------------------
   Provider
   -------------------------------------------------------------------------- */

export function BusinessDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BusinessData>(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const dataRef = useRef(data);
  const actorRef = useRef("You");

  /* --- hydration (client only, never during SSR) ---
     Deferred to a microtask so the first client render finishes hydrating
     before we swap in stored data (avoids a synchronous cascading render). */
  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      const storedBusiness = readBusiness();
      const storedSettings = readSettings();

      const next: BusinessData = {
        customers: readCustomers(),
        products: readProducts(),
        orders: readOrders(),
        team: readTeam(),
        activities: readActivities(),
        goals: readGoals(),
        business: storedBusiness ?? createDefaultBusiness(),
        settings: storedSettings ?? createDefaultSettings(),
      };

      dataRef.current = next;
      setData(next);
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  /* --- single write path: state + storage together --- */
  const commit = useCallback((updater: (prev: BusinessData) => BusinessData) => {
    const prev = dataRef.current;
    const next = updater(prev);
    if (next === prev) return prev;

    dataRef.current = next;
    setData(next);

    setStored(STORAGE_KEYS.customers, next.customers);
    setStored(STORAGE_KEYS.products, next.products);
    setStored(STORAGE_KEYS.orders, next.orders);
    setStored(STORAGE_KEYS.team, next.team);
    setStored(STORAGE_KEYS.activities, next.activities);
    setStored(STORAGE_KEYS.goals, next.goals);
    setStored(STORAGE_KEYS.business, next.business);
    setStored(STORAGE_KEYS.settings, next.settings);

    return next;
  }, []);

  const getActor = useCallback((): string => actorRef.current, []);

  const appendActivity = useCallback(
    (prev: BusinessData, entry: Omit<ActivityEntry, "id" | "timestamp">): ActivityEntry[] => {
      const full: ActivityEntry = {
        ...entry,
        id: generateId(),
        timestamp: nowIso(),
        actor: entry.actor || getActor(),
      };
      // newest first, capped so storage stays bounded
      return [full, ...prev.activities].slice(0, 300);
    },
    [getActor],
  );

  /* --------------------------------------------------------------------
     Customers
     -------------------------------------------------------------------- */

  const addCustomer = useCallback(
    (input: Omit<Customer, "id">): Customer => {
      const customer: Customer = { ...input, id: generateId() };
      commit((prev) => ({
        ...prev,
        customers: [customer, ...prev.customers],
        activities: appendActivity(prev, {
          actor: getActor(),
          action: "create",
          entity: "customer",
          entityId: customer.id,
          description: `Added customer ${customer.name}`,
        }),
      }));
      return customer;
    },
    [commit, appendActivity, getActor],
  );

  const updateCustomer = useCallback(
    (id: string, patch: Partial<Customer>): Customer | null => {
      let updated: Customer | null = null;

      commit((prev) => {
        const index = prev.customers.findIndex((c) => c.id === id);
        if (index === -1) return prev;

        const existing = prev.customers[index];
        updated = { ...existing, ...patch, id: existing.id };

        const customers = [...prev.customers];
        customers[index] = updated;

        return {
          ...prev,
          customers,
          activities: appendActivity(prev, {
            actor: getActor(),
            action: patch.status && patch.status !== existing.status ? "status_change" : "update",
            entity: "customer",
            entityId: id,
            description: `Updated customer ${updated.name}`,
          }),
        };
      });

      return updated;
    },
    [commit, appendActivity, getActor],
  );

  const deleteCustomer = useCallback(
    (id: string): boolean => {
      let removed = false;

      commit((prev) => {
        const target = prev.customers.find((c) => c.id === id);
        if (!target) return prev;
        removed = true;

        return {
          ...prev,
          customers: prev.customers.filter((c) => c.id !== id),
          activities: appendActivity(prev, {
            actor: getActor(),
            action: "delete",
            entity: "customer",
            entityId: id,
            description: `Deleted customer ${target.name}`,
          }),
        };
      });

      return removed;
    },
    [commit, appendActivity, getActor],
  );

  const bulkUpdateCustomers = useCallback(
    (ids: string[], patch: Partial<Customer>): number => {
      const idSet = new Set(ids);
      let count = 0;

      commit((prev) => {
        count = 0;
        const customers = prev.customers.map((c) => {
          if (!idSet.has(c.id)) return c;
          count += 1;
          return { ...c, ...patch, id: c.id };
        });
        if (count === 0) return prev;

        return {
          ...prev,
          customers,
          activities: appendActivity(prev, {
            actor: getActor(),
            action: "update",
            entity: "customer",
            description: `Updated ${count} customer${count === 1 ? "" : "s"}`,
          }),
        };
      });

      return count;
    },
    [commit, appendActivity, getActor],
  );

  const bulkDeleteCustomers = useCallback(
    (ids: string[]): number => {
      const idSet = new Set(ids);
      let count = 0;

      commit((prev) => {
        const remaining = prev.customers.filter((c) => {
          if (idSet.has(c.id)) {
            count += 1;
            return false;
          }
          return true;
        });
        if (count === 0) return prev;

        return {
          ...prev,
          customers: remaining,
          activities: appendActivity(prev, {
            actor: getActor(),
            action: "delete",
            entity: "customer",
            description: `Deleted ${count} customer${count === 1 ? "" : "s"}`,
          }),
        };
      });

      return count;
    },
    [commit, appendActivity, getActor],
  );

  const importCustomers = useCallback(
    (rows: Customer[]): number => {
      if (rows.length === 0) return 0;
      let count = 0;

      commit((prev) => {
        const existingEmails = new Set(prev.customers.map((c) => c.email.toLowerCase()));
        const existingNames = new Set(prev.customers.map((c) => c.name.toLowerCase()));
        const incoming: Customer[] = [];

        for (const row of rows) {
          const email = row.email.trim().toLowerCase();
          if (email && existingEmails.has(email)) continue;
          if (existingNames.has(row.name.trim().toLowerCase())) continue;
          const customer: Customer = { ...row, id: generateId(), email };
          existingEmails.add(email);
          existingNames.add(customer.name.toLowerCase());
          incoming.push(customer);
          count += 1;
        }

        if (count === 0) return prev;

        return {
          ...prev,
          customers: [...incoming, ...prev.customers],
          activities: appendActivity(prev, {
            actor: getActor(),
            action: "import",
            entity: "customer",
            description: `Imported ${count} customer${count === 1 ? "" : "s"} from CSV`,
          }),
        };
      });

      return count;
    },
    [commit, appendActivity, getActor],
  );

  /* --------------------------------------------------------------------
     Products
     -------------------------------------------------------------------- */

  const addProduct = useCallback(
    (input: Omit<Product, "id">): Product => {
      const product: Product = { ...input, id: generateId() };
      commit((prev) => ({
        ...prev,
        products: [product, ...prev.products],
        activities: appendActivity(prev, {
          actor: getActor(),
          action: "create",
          entity: "product",
          entityId: product.id,
          description: `Added product ${product.name}`,
        }),
      }));
      return product;
    },
    [commit, appendActivity, getActor],
  );

  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>): Product | null => {
      let updated: Product | null = null;

      commit((prev) => {
        const index = prev.products.findIndex((p) => p.id === id);
        if (index === -1) return prev;

        const existing = prev.products[index];
        updated = { ...existing, ...patch, id: existing.id };
        const products = [...prev.products];
        products[index] = updated;

        return {
          ...prev,
          products,
          activities: appendActivity(prev, {
            actor: getActor(),
            action: patch.status && patch.status !== existing.status ? "status_change" : "update",
            entity: "product",
            entityId: id,
            description: `Updated product ${updated.name}`,
          }),
        };
      });

      return updated;
    },
    [commit, appendActivity, getActor],
  );

  const deleteProduct = useCallback(
    (id: string): boolean => {
      let removed = false;

      commit((prev) => {
        const target = prev.products.find((p) => p.id === id);
        if (!target) return prev;
        removed = true;

        return {
          ...prev,
          products: prev.products.filter((p) => p.id !== id),
          activities: appendActivity(prev, {
            actor: getActor(),
            action: "delete",
            entity: "product",
            entityId: id,
            description: `Deleted product ${target.name}`,
          }),
        };
      });

      return removed;
    },
    [commit, appendActivity, getActor],
  );

  /* --------------------------------------------------------------------
     Orders
     -------------------------------------------------------------------- */

  const addOrder = useCallback(
    (input: Omit<Order, "id">): Order => {
      const order: Order = { ...input, id: generateId() };
      commit((prev) => ({
        ...prev,
        orders: [order, ...prev.orders],
        activities: appendActivity(prev, {
          actor: getActor(),
          action: "create",
          entity: "order",
          entityId: order.id,
          description: `Created order of ${order.total.toLocaleString()} (${order.status})`,
        }),
      }));
      return order;
    },
    [commit, appendActivity, getActor],
  );

  const updateOrder = useCallback(
    (id: string, patch: Partial<Order>): Order | null => {
      let updated: Order | null = null;

      commit((prev) => {
        const index = prev.orders.findIndex((o) => o.id === id);
        if (index === -1) return prev;

        const existing = prev.orders[index];

        // Enforce the workflow: refunded is terminal, no transitions out of it.
        if (patch.status && !canTransition(existing.status, patch.status)) {
          return prev;
        }

        updated = { ...existing, ...patch, id: existing.id };
        const orders = [...prev.orders];
        orders[index] = updated;

        return {
          ...prev,
          orders,
          activities: appendActivity(prev, {
            actor: getActor(),
            action: patch.status && patch.status !== existing.status ? "status_change" : "update",
            entity: "order",
            entityId: id,
            description:
              patch.status && patch.status !== existing.status
                ? `Order ${updated.reference ?? id.slice(0, 6)} moved ${existing.status} → ${updated.status}`
                : `Updated order ${updated.reference ?? id.slice(0, 6)}`,
          }),
        };
      });

      return updated;
    },
    [commit, appendActivity, getActor],
  );

  const deleteOrder = useCallback(
    (id: string): boolean => {
      let removed = false;

      commit((prev) => {
        const target = prev.orders.find((o) => o.id === id);
        if (!target) return prev;
        removed = true;

        return {
          ...prev,
          orders: prev.orders.filter((o) => o.id !== id),
          activities: appendActivity(prev, {
            actor: getActor(),
            action: "delete",
            entity: "order",
            entityId: id,
            description: `Deleted order ${target.reference ?? id.slice(0, 6)}`,
          }),
        };
      });

      return removed;
    },
    [commit, appendActivity, getActor],
  );

  const setOrderStatus = useCallback(
    (id: string, status: OrderStatus): Order | null => updateOrder(id, { status }),
    [updateOrder],
  );

  /* --------------------------------------------------------------------
     Team
     -------------------------------------------------------------------- */

  const addTeamMember = useCallback(
    (input: Omit<TeamMember, "id" | "avatar">): TeamMember => {
      const member: TeamMember = {
        ...input,
        id: generateId(),
        avatar: initialsFrom(input.name),
      };
      commit((prev) => ({
        ...prev,
        team: [member, ...prev.team],
        activities: appendActivity(prev, {
          actor: getActor(),
          action: member.status === "invited" ? "invite" : "create",
          entity: "team",
          entityId: member.id,
          description:
            member.status === "invited"
              ? `Invited ${member.name} as ${member.role} (demo invite — no email sent)`
              : `Added team member ${member.name}`,
        }),
      }));
      return member;
    },
    [commit, appendActivity, getActor],
  );

  const updateTeamMember = useCallback(
    (id: string, patch: Partial<TeamMember>): TeamMember | null => {
      let updated: TeamMember | null = null;

      commit((prev) => {
        const index = prev.team.findIndex((m) => m.id === id);
        if (index === -1) return prev;

        const existing = prev.team[index];
        if (existing.role === "owner" && patch.role && patch.role !== "owner") {
          // The owner role cannot be demoted through this action.
          return prev;
        }

        updated = {
          ...existing,
          ...patch,
          id: existing.id,
          avatar: patch.name ? initialsFrom(patch.name) : existing.avatar,
        };
        const team = [...prev.team];
        team[index] = updated;

        return {
          ...prev,
          team,
          activities: appendActivity(prev, {
            actor: getActor(),
            action: patch.role && patch.role !== existing.role ? "status_change" : "update",
            entity: "team",
            entityId: id,
            description: `Updated team member ${updated.name}`,
          }),
        };
      });

      return updated;
    },
    [commit, appendActivity, getActor],
  );

  const deleteTeamMember = useCallback(
    (id: string): boolean => {
      let removed = false;

      commit((prev) => {
        const target = prev.team.find((m) => m.id === id);
        if (!target) return prev;
        if (target.role === "owner") return prev; // owner cannot be removed
        removed = true;

        return {
          ...prev,
          team: prev.team.filter((m) => m.id !== id),
          activities: appendActivity(prev, {
            actor: getActor(),
            action: "delete",
            entity: "team",
            entityId: id,
            description: `Removed team member ${target.name}`,
          }),
        };
      });

      return removed;
    },
    [commit, appendActivity, getActor],
  );

  /* --------------------------------------------------------------------
     Goals
     -------------------------------------------------------------------- */

  const addGoal = useCallback(
    (input: Omit<BusinessGoal, "id" | "current">): BusinessGoal => {
      const goal: BusinessGoal = { ...input, id: generateId(), current: 0 };
      commit((prev) => ({
        ...prev,
        goals: [goal, ...prev.goals],
        activities: appendActivity(prev, {
          actor: getActor(),
          action: "create",
          entity: "goal",
          entityId: goal.id,
          description: `Created goal ${goal.title}`,
        }),
      }));
      return goal;
    },
    [commit, appendActivity, getActor],
  );

  const updateGoal = useCallback(
    (id: string, patch: Partial<BusinessGoal>): BusinessGoal | null => {
      let updated: BusinessGoal | null = null;

      commit((prev) => {
        const index = prev.goals.findIndex((g) => g.id === id);
        if (index === -1) return prev;

        const existing = prev.goals[index];
        updated = { ...existing, ...patch, id: existing.id };
        const goals = [...prev.goals];
        goals[index] = updated;

        return {
          ...prev,
          goals,
          activities: appendActivity(prev, {
            actor: getActor(),
            action: "update",
            entity: "goal",
            entityId: id,
            description: `Updated goal ${updated.title}`,
          }),
        };
      });

      return updated;
    },
    [commit, appendActivity, getActor],
  );

  const deleteGoal = useCallback(
    (id: string): boolean => {
      let removed = false;

      commit((prev) => {
        const target = prev.goals.find((g) => g.id === id);
        if (!target) return prev;
        removed = true;

        return {
          ...prev,
          goals: prev.goals.filter((g) => g.id !== id),
          activities: appendActivity(prev, {
            actor: getActor(),
            action: "delete",
            entity: "goal",
            entityId: id,
            description: `Deleted goal ${target.title}`,
          }),
        };
      });

      return removed;
    },
    [commit, appendActivity, getActor],
  );

  /* --------------------------------------------------------------------
     Meta
     -------------------------------------------------------------------- */

  const addActivity = useCallback(
    (entry: Omit<ActivityEntry, "id" | "timestamp">) => {
      commit((prev) => ({
        ...prev,
        activities: appendActivity(prev, entry),
      }));
    },
    [commit, appendActivity],
  );

  const updateBusiness = useCallback(
    (patch: Partial<BusinessProfile>) => {
      commit((prev) => ({
        ...prev,
        business: { ...prev.business, ...patch },
      }));
    },
    [commit],
  );

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      commit((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...patch },
      }));
    },
    [commit],
  );

  /* --------------------------------------------------------------------
     Data lifecycle
     -------------------------------------------------------------------- */

  const resetData = useCallback(() => {
    // Keeps auth (users / current session); wipes all business records.
    resetBusinessData();

    const fresh = createInitialState();
    dataRef.current = fresh;
    setData(fresh);

    setStored(STORAGE_KEYS.customers, fresh.customers);
    setStored(STORAGE_KEYS.products, fresh.products);
    setStored(STORAGE_KEYS.orders, fresh.orders);
    setStored(STORAGE_KEYS.team, fresh.team);
    setStored(STORAGE_KEYS.activities, fresh.activities);
    setStored(STORAGE_KEYS.goals, fresh.goals);
    setStored(STORAGE_KEYS.business, fresh.business);
    setStored(STORAGE_KEYS.settings, fresh.settings);
  }, []);

  const loadDataset = useCallback(
    (dataset: Partial<BusinessData>) => {
      commit((prev) => ({
        customers: dataset.customers ?? prev.customers,
        products: dataset.products ?? prev.products,
        orders: dataset.orders ?? prev.orders,
        team: dataset.team ?? prev.team,
        activities: dataset.activities ?? prev.activities,
        goals: dataset.goals ?? prev.goals,
        business: dataset.business ?? prev.business,
        settings: dataset.settings ?? prev.settings,
      }));
    },
    [commit],
  );

  const exportData = useCallback((): BusinessExportPayload => {
    const current = dataRef.current;
    return {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportedAt: nowIso(),
      business: current.business,
      settings: current.settings,
      customers: current.customers,
      products: current.products,
      orders: current.orders,
      team: current.team,
      goals: current.goals,
      activities: current.activities,
    };
  }, []);

  /**
   * Validates a JSON payload BEFORE touching any state.
   * On failure the current data is left completely untouched.
   */
  const importData = useCallback(
    (raw: string): { ok: boolean; error?: string; summary?: string } => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return { ok: false, error: "That file is not valid JSON." };
      }

      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { ok: false, error: "Expected a JSON object exported from ATLARIS." };
      }

      const candidate = parsed as Partial<BusinessExportPayload>;

      if (
        !Array.isArray(candidate.customers) &&
        !Array.isArray(candidate.products) &&
        !Array.isArray(candidate.orders)
      ) {
        return {
          ok: false,
          error: "No recognisable data found. The file must contain customers, products or orders.",
        };
      }

      const customers = filterValid(candidate.customers, isValidCustomer);
      const products = filterValid(candidate.products, isValidProduct);
      const orders = filterValid(candidate.orders, isValidOrder);
      const team = filterValid(candidate.team, isValidTeamMember);
      const goals = filterValid(candidate.goals, isValidGoal);
      const activities = filterValid(candidate.activities, isValidActivity);

      const businessOk = isPlainObject(candidate.business);
      const settingsOk = isPlainObject(candidate.settings);

      const next: BusinessData = {
        customers,
        products,
        orders,
        team,
        goals,
        activities,
        business: businessOk
          ? { ...createDefaultBusiness(), ...(candidate.business as BusinessProfile) }
          : dataRef.current.business,
        settings: settingsOk
          ? { ...createDefaultSettings(), ...(candidate.settings as AppSettings) }
          : dataRef.current.settings,
      };

      // Only now do we touch state.
      commit((prev) => ({
        ...next,
        activities: appendActivity(prev, {
          actor: getActor(),
          action: "import",
          entity: "data",
          description: `Imported dataset (${next.customers.length} customers, ${next.products.length} products, ${next.orders.length} orders)`,
        }),
      }));

      return {
        ok: true,
        summary: `${next.customers.length} customers, ${next.products.length} products, ${next.orders.length} orders`,
      };
    },
    [commit, appendActivity, getActor],
  );

  /* --- expose the signed-in name for activity entries --- */
  useEffect(() => {
    const current = readCurrentSession();
    if (current?.name?.trim()) actorRef.current = current.name.trim();
  }, [hydrated]);

  const dataValue = useMemo<BusinessData & { hydrated: boolean }>(
    () => ({ ...data, hydrated }),
    [data, hydrated],
  );

  const actionsValue = useMemo<BusinessActions>(
    () => ({
      addCustomer,
      updateCustomer,
      deleteCustomer,
      bulkUpdateCustomers,
      bulkDeleteCustomers,
      importCustomers,
      addProduct,
      updateProduct,
      deleteProduct,
      addOrder,
      updateOrder,
      deleteOrder,
      setOrderStatus,
      addTeamMember,
      updateTeamMember,
      deleteTeamMember,
      addGoal,
      updateGoal,
      deleteGoal,
      addActivity,
      updateBusiness,
      updateSettings,
      resetData,
      importData,
      exportData,
      loadDataset,
    }),
    [
      addCustomer,
      updateCustomer,
      deleteCustomer,
      bulkUpdateCustomers,
      bulkDeleteCustomers,
      importCustomers,
      addProduct,
      updateProduct,
      deleteProduct,
      addOrder,
      updateOrder,
      deleteOrder,
      setOrderStatus,
      addTeamMember,
      updateTeamMember,
      deleteTeamMember,
      addGoal,
      updateGoal,
      deleteGoal,
      addActivity,
      updateBusiness,
      updateSettings,
      resetData,
      importData,
      exportData,
      loadDataset,
    ],
  );

  return (
    <DataContext.Provider value={dataValue}>
      <ActionsContext.Provider value={actionsValue}>{children}</ActionsContext.Provider>
    </DataContext.Provider>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** Keeps items that pass `normalise`, returning the normalised value. */
function filterValid<T>(value: unknown, normalise: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value) {
    const result = normalise(item);
    if (result !== null) out.push(result);
  }
  return out;
}

const CUSTOMER_STATUSES_SET = new Set(["active", "churned", "trial"]);
const PRODUCT_STATUSES_SET = new Set(["active", "draft", "archived"]);
const ORDER_STATUSES_SET = new Set(["pending", "paid", "fulfilled", "refunded"]);
const ROLES_SET = new Set(["owner", "admin", "member"]);
const TEAM_STATUSES_SET = new Set(["active", "invited", "inactive"]);
const GOAL_TYPES_SET = new Set(["revenue", "customers", "orders"]);
const PAYMENT_METHODS_SET = new Set(["card", "bank_transfer", "cash", "paypal", "other"]);

function isValidCustomer(item: unknown): Customer | null {
  if (!isRecord(item)) return null;
  if (typeof item.id !== "string" || item.id === "") return null;
  if (typeof item.name !== "string" || item.name === "") return null;

  return {
    id: item.id,
    name: item.name,
    email: str(item.email),
    phone: str(item.phone),
    company: str(item.company),
    status: CUSTOMER_STATUSES_SET.has(str(item.status)) ? (item.status as Customer["status"]) : "active",
    plan: str(item.plan, "Free"),
    mrr: num(item.mrr),
    joinDate: str(item.joinDate),
    lastActive: str(item.lastActive),
    notes: str(item.notes),
    tags: strArray(item.tags),
  };
}

function isValidProduct(item: unknown): Product | null {
  if (!isRecord(item)) return null;
  if (typeof item.id !== "string" || item.id === "") return null;
  if (typeof item.name !== "string" || item.name === "") return null;

  return {
    id: item.id,
    name: item.name,
    description: str(item.description),
    price: num(item.price),
    category: str(item.category, "General"),
    stock: num(item.stock),
    status: PRODUCT_STATUSES_SET.has(str(item.status)) ? (item.status as Product["status"]) : "active",
    createdAt: str(item.createdAt),
  };
}

function isValidOrder(item: unknown): Order | null {
  if (!isRecord(item)) return null;
  if (typeof item.id !== "string" || item.id === "") return null;
  if (typeof item.customerId !== "string" || item.customerId === "") return null;
  if (!Array.isArray(item.items)) return null;

  const items: OrderItem[] = [];
  for (const raw of item.items) {
    if (!isRecord(raw)) continue;
    if (typeof raw.productId !== "string") continue;
    items.push({
      productId: raw.productId,
      productName: str(raw.productName, "Item"),
      qty: Math.max(1, Math.round(num(raw.qty, 1))),
      // Captured price is preserved exactly as exported.
      price: num(raw.price),
    });
  }

  return {
    id: item.id,
    customerId: item.customerId,
    items,
    total: num(item.total),
    status: ORDER_STATUSES_SET.has(str(item.status)) ? (item.status as Order["status"]) : "pending",
    date: str(item.date),
    paymentMethod: PAYMENT_METHODS_SET.has(str(item.paymentMethod))
      ? (item.paymentMethod as Order["paymentMethod"])
      : "other",
    ...(typeof item.reference === "string" ? { reference: item.reference } : {}),
    ...(typeof item.notes === "string" ? { notes: item.notes } : {}),
  };
}

function isValidTeamMember(item: unknown): TeamMember | null {
  if (!isRecord(item)) return null;
  if (typeof item.id !== "string" || item.id === "") return null;
  if (typeof item.name !== "string" || item.name === "") return null;

  return {
    id: item.id,
    name: item.name,
    email: str(item.email),
    role: ROLES_SET.has(str(item.role)) ? (item.role as TeamMember["role"]) : "member",
    status: TEAM_STATUSES_SET.has(str(item.status))
      ? (item.status as TeamMember["status"])
      : "invited",
    joinedAt: str(item.joinedAt),
    avatar: str(item.avatar, initialsFrom(item.name)),
  };
}

function isValidGoal(item: unknown): BusinessGoal | null {
  if (!isRecord(item)) return null;
  if (typeof item.id !== "string" || item.id === "") return null;
  if (typeof item.title !== "string" || item.title === "") return null;

  return {
    id: item.id,
    title: item.title,
    target: num(item.target),
    current: num(item.current),
    deadline: str(item.deadline),
    type: GOAL_TYPES_SET.has(str(item.type)) ? (item.type as BusinessGoal["type"]) : "revenue",
  };
}

function isValidActivity(item: unknown): ActivityEntry | null {
  if (!isRecord(item)) return null;
  if (typeof item.id !== "string" || item.id === "") return null;
  if (typeof item.description !== "string" || item.description === "") return null;

  return {
    id: item.id,
    actor: str(item.actor, "System"),
    action: str(item.action, "update") as ActivityEntry["action"],
    entity: str(item.entity, "data") as ActivityEntry["entity"],
    ...(typeof item.entityId === "string" ? { entityId: item.entityId } : {}),
    timestamp: str(item.timestamp, nowIso()),
    description: item.description,
  };
}

/* --------------------------------------------------------------------------
   Consumers
   -------------------------------------------------------------------------- */

export function useBusinessData(): BusinessData & { hydrated: boolean } {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useBusinessData must be used inside <BusinessDataProvider>.");
  }
  return ctx;
}

export function useBusinessActions(): BusinessActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) {
    throw new Error("useBusinessActions must be used inside <BusinessDataProvider>.");
  }
  return ctx;
}

/** Convenience hook: state + actions in one call. */
export function useBusiness(): BusinessData & { actions: BusinessActions; hydrated: boolean } {
  const data = useBusinessData();
  const actions = useBusinessActions();
  const { hydrated } = data;
  return { ...data, actions, hydrated };
}
