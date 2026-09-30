import type { ActivityEntry, AuthUser, BusinessGoal, BusinessProfile, AppSettings, Customer, Order, Product, TeamMember } from "@/types/business";

/**
 * ===========================================================================
 * ATLARIS localStorage layer
 * ---------------------------------------------------------------------------
 * EVERY read/write of localStorage in this application MUST go through this
 * module. Pages and components never touch window.localStorage directly.
 *
 * Safety rules implemented here:
 *   - SSR guarded: no access to window.localStorage during server rendering.
 *   - Every JSON.parse is wrapped in try/catch.
 *   - Corrupt / wrong-shaped data returns null instead of throwing.
 *   - Reset only clears `atlaris_*` keys — never unrelated app data.
 *
 * IMPORTANT: this is browser-local demo storage. It is NOT encrypted, NOT
 * synced and NOT a substitute for a real backend.
 * ===========================================================================
 */

export const ATLARIS_KEY_PREFIX = "atlaris_";

export const STORAGE_KEYS = {
  users: "atlaris_users",
  currentUser: "atlaris_current_user",
  rememberMe: "atlaris_remember_me",
  business: "atlaris_business",
  settings: "atlaris_settings",
  customers: "atlaris_customers",
  products: "atlaris_products",
  orders: "atlaris_orders",
  team: "atlaris_team",
  activities: "atlaris_activities",
  goals: "atlaris_goals",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** All keys ATLARIS owns. Only these are ever cleared by a reset. */
export const ATLARIS_KEYS: readonly StorageKey[] = Object.values(STORAGE_KEYS);

/* --------------------------------------------------------------------------
   Environment guards
   -------------------------------------------------------------------------- */

/** True only in the browser with a usable localStorage implementation. */
export function canUseStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const probe = `${ATLARIS_KEY_PREFIX}__probe__`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------------------
   Primitive accessors
   -------------------------------------------------------------------------- */

/**
 * Reads and parses a JSON value.
 * Returns `null` when the key is missing, unreadable or corrupt.
 */
export function getStored<T>(key: string): T | null {
  if (!canUseStorage()) return null;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return null;
  }

  if (raw === null || raw === "") return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt payload — never crash the app.
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[ATLARIS] Ignoring corrupt value for key "${key}".`);
    }
    return null;
  }
}

/**
 * Serializes and writes a value.
 * Returns `true` when the write succeeded (quota errors are swallowed).
 */
export function setStored(key: string, value: unknown): boolean {
  if (!canUseStorage()) return false;

  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[ATLARIS] Could not serialize value for key "${key}".`);
    }
    return false;
  }

  try {
    window.localStorage.setItem(key, serialized);
    return true;
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[ATLARIS] Could not write key "${key}" (storage full or blocked).`);
    }
    return false;
  }
}

/** Removes a single key. Safe to call when it does not exist. */
export function removeStored(key: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* no-op */
  }
}

/* --------------------------------------------------------------------------
   Shape-checked helpers
   -------------------------------------------------------------------------- */

/** Returns the value only when it is a real array; otherwise `[]`. */
export function getStoredArray<T>(key: string): T[] {
  const value = getStored<unknown>(key);
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Returns the value only when it is a plain object; otherwise `null`. */
export function getStoredObject<T extends object>(key: string): T | null {
  const value = getStored<unknown>(key);
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  return value as T;
}

/** Reads a raw string value (used for remember-me / non-JSON flags). */
export function getStoredString(key: string): string | null {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Writes a raw string value. */
export function setStoredString(key: string, value: string): boolean {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------------------
   Session storage (used for "remember me = off")

   Remember Me is UNCHECKED BY DEFAULT.
     - remember me ON  -> current user lives in localStorage  (survives restart)
     - remember me OFF -> current user lives in sessionStorage (cleared on
                          browser close, survives a simple page reload)
   The key name stays `atlaris_current_user` in both cases; only the
   container differs. This is still DEMO auth, not real session security.
   -------------------------------------------------------------------------- */

function canUseSessionStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const probe = `${ATLARIS_KEY_PREFIX}__probe__`;
    window.sessionStorage.setItem(probe, "1");
    window.sessionStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function getSessionStored<T>(key: string): T | null {
  if (!canUseSessionStorage()) return null;
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
  if (raw === null || raw === "") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setSessionStored(key: string, value: unknown): boolean {
  if (!canUseSessionStorage()) return false;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeSessionStored(key: string): void {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* no-op */
  }
}

/** True when the last login asked to be remembered. Defaults to false. */
export function readRememberMe(): boolean {
  return getStored<boolean>(STORAGE_KEYS.rememberMe) === true;
}

export function writeRememberMe(value: boolean): void {
  setStored(STORAGE_KEYS.rememberMe, value);
}

/**
 * Persists the current user to the container chosen by the remember-me flag.
 * Always clears the other container so exactly one is authoritative.
 */
export function writeCurrentUser(user: AuthUser | null, remember: boolean): void {
  writeRememberMe(remember);

  if (user === null) {
    removeStored(STORAGE_KEYS.currentUser);
    removeSessionStored(STORAGE_KEYS.currentUser);
    return;
  }

  if (remember) {
    setStored(STORAGE_KEYS.currentUser, user);
    removeSessionStored(STORAGE_KEYS.currentUser);
  } else {
    setSessionStored(STORAGE_KEYS.currentUser, user);
    removeStored(STORAGE_KEYS.currentUser);
  }
}

/** Reads the current user from whichever container is authoritative. */
export function readCurrentSession(): AuthUser | null {
  const remembered = readCurrentUser();
  if (remembered) return remembered;
  return getSessionStored<AuthUser>(STORAGE_KEYS.currentUser);
}

/** Clears the current user from both containers. */
export function clearCurrentUser(): void {
  removeStored(STORAGE_KEYS.currentUser);
  removeSessionStored(STORAGE_KEYS.currentUser);
}

/* --------------------------------------------------------------------------
   Typed domain readers (used on hydration by BusinessDataProvider)
   -------------------------------------------------------------------------- */

export function readUsers(): AuthUser[] {
  return getStoredArray<AuthUser>(STORAGE_KEYS.users);
}

export function readCurrentUser(): AuthUser | null {
  return getStoredObject<AuthUser>(STORAGE_KEYS.currentUser);
}

export function readBusiness(): BusinessProfile | null {
  return getStoredObject<BusinessProfile>(STORAGE_KEYS.business);
}

export function readSettings(): AppSettings | null {
  return getStoredObject<AppSettings>(STORAGE_KEYS.settings);
}

export function readCustomers(): Customer[] {
  return getStoredArray<Customer>(STORAGE_KEYS.customers);
}

export function readProducts(): Product[] {
  return getStoredArray<Product>(STORAGE_KEYS.products);
}

export function readOrders(): Order[] {
  return getStoredArray<Order>(STORAGE_KEYS.orders);
}

export function readTeam(): TeamMember[] {
  return getStoredArray<TeamMember>(STORAGE_KEYS.team);
}

export function readActivities(): ActivityEntry[] {
  return getStoredArray<ActivityEntry>(STORAGE_KEYS.activities);
}

export function readGoals(): BusinessGoal[] {
  return getStoredArray<BusinessGoal>(STORAGE_KEYS.goals);
}

/* --------------------------------------------------------------------------
   Reset
   -------------------------------------------------------------------------- */

/** Lists every ATLARIS-owned key currently present in localStorage. */
export function listAtlarisKeys(): string[] {
  if (!canUseStorage()) return [];
  try {
    const found: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(ATLARIS_KEY_PREFIX)) found.push(key);
    }
    return found;
  } catch {
    return [];
  }
}

/**
 * Clears ONLY `atlaris_*` keys from local- and session-storage.
 * Never touches storage owned by other applications or the browser.
 * Returns the number of keys removed.
 *
 * NOTE: this does NOT sign the user out of the shared `atlaris_users`
 * registry unless that key itself is removed — a business-data reset keeps
 * the demo account list intact by design (see resetBusinessData below).
 */
export function resetAtlarisData(): number {
  if (!canUseStorage()) return 0;

  let removed = 0;
  try {
    for (const key of listAtlarisKeys()) {
      window.localStorage.removeItem(key);
      removed += 1;
    }
  } catch {
    /* no-op */
  }

  if (canUseSessionStorage()) {
    try {
      const stale: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const key = window.sessionStorage.key(i);
        if (key && key.startsWith(ATLARIS_KEY_PREFIX)) stale.push(key);
      }
      for (const key of stale) {
        window.sessionStorage.removeItem(key);
        removed += 1;
      }
    } catch {
      /* no-op */
    }
  }

  return removed;
}

/**
 * Clears every ATLARIS key EXCEPT the auth registry, so the demo accounts
 * survive a "reset business data" action while all business records are wiped.
 */
export function resetBusinessData(): number {
  const keep = new Set<string>([STORAGE_KEYS.users, STORAGE_KEYS.currentUser, STORAGE_KEYS.rememberMe]);

  let removed = 0;
  try {
    for (const key of listAtlarisKeys()) {
      if (keep.has(key)) continue;
      window.localStorage.removeItem(key);
      removed += 1;
    }
  } catch {
    /* no-op */
  }
  return removed;
}

/**
 * @deprecated Legacy name kept for the specification wording.
 * Prefer `resetAtlarisData`.
 */
export const resetAtlantisData = resetAtlarisData;
