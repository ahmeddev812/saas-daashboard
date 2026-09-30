"use client";

/**
 * ===========================================================================
 * ATLARIS AuthContext — LOCAL / DEMO AUTHENTICATION ONLY
 * ---------------------------------------------------------------------------
 * This is NOT production authentication.
 *   - There is no backend, no server session, no secure password storage.
 *   - User records live in browser localStorage (`atlaris_users`).
 *   - Passwords are run through a deliberately weak, non-cryptographic
 *     digest (see lib/auth.ts) purely so the raw string is not stored.
 *   - Anyone with access to the browser profile can read or forge these
 *     records.
 *
 * The UI and documentation must never describe this as secure.
 * ===========================================================================
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/types/business";
import {
  STORAGE_KEYS,
  canUseStorage,
  clearCurrentUser,
  getStoredArray,
  readCurrentSession,
  readRememberMe,
  setStored,
  writeCurrentUser,
} from "@/lib/storage";
import {
  DEMO_USER,
  checkPasswordStrength,
  createAuthUser,
  isEmail,
  verifyPassword,
} from "@/lib/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: AuthUser;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** True once the initial localStorage hydration has finished. */
  hydrated: boolean;
  /** Whether the previous login opted into "remember me". */
  rememberMe: boolean;
  signup: (input: SignupInput) => Promise<AuthResult>;
  login: (email: string, password: string, remember: boolean) => Promise<AuthResult>;
  /** Loads the built-in demo account + 90-day seed dataset. */
  demoLogin: () => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (patch: { name?: string; email?: string }) => AuthResult;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readUsersSafe(): AuthUser[] {
  if (!canUseStorage()) return [];
  const raw = getStoredArray<AuthUser>(STORAGE_KEYS.users);
  return raw.filter(
    (u) => u && typeof u.id === "string" && typeof u.email === "string" && typeof u.passwordHash === "string",
  );
}

function writeUsers(users: AuthUser[]): void {
  setStored(STORAGE_KEYS.users, users);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [hydrated, setHydrated] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Hydrate from storage, client-side only (never during SSR).
  // The read is deferred to a microtask so it happens after hydration
  // instead of cascading a synchronous re-render from inside the effect.
  //
  // IMPORTANT: this effect must be re-runnable. React StrictMode (on by
  // default in the App Router) mounts, unmounts and remounts effects during
  // the first client render; a run-once guard would let the first run's
  // cancellation kill the only hydration, leaving `hydrated` false forever
  // (infinite "Checking your session…" screen). Each run therefore owns its
  // own `cancelled` flag and schedules its own read.
  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      const current = readCurrentSession();
      if (current) {
        setUser(current);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
      setRememberMe(readRememberMe());
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const persistSession = useCallback((next: AuthUser | null, remember: boolean) => {
    writeCurrentUser(next, remember);
    setUser(next);
    setStatus(next ? "authenticated" : "unauthenticated");
    setRememberMe(next ? remember : false);
  }, []);

  const signup = useCallback(async (input: SignupInput): Promise<AuthResult> => {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (name.length < 2) return { ok: false, error: "Please enter your full name." };
    if (!isEmail(email)) return { ok: false, error: "Enter a valid email address." };

    const strength = checkPasswordStrength(input.password);
    if (!strength.valid) {
      return { ok: false, error: "Password must be at least 8 characters and mix cases, a number and a symbol." };
    }
    if (input.password !== input.confirmPassword) {
      return { ok: false, error: "Passwords do not match." };
    }

    const users = readUsersSafe();
    if (users.some((u) => u.email === email)) {
      return { ok: false, error: "An account with that email already exists on this device." };
    }

    const created = createAuthUser(name, email, input.password);
    writeUsers([...users, created]);
    persistSession(created, true);

    return { ok: true, user: created };
  }, [persistSession]);

  const login = useCallback(
    async (email: string, password: string, remember: boolean): Promise<AuthResult> => {
      const normalized = email.trim().toLowerCase();
      if (!isEmail(normalized)) return { ok: false, error: "Enter a valid email address." };
      if (password.length === 0) return { ok: false, error: "Enter your password." };

      const users = readUsersSafe();
      const found = users.find((u) => u.email === normalized);
      if (!found) return { ok: false, error: "No account found on this device." };

      if (!verifyPassword(password, found.passwordHash)) {
        return { ok: false, error: "Incorrect password for this local account." };
      }

      persistSession(found, remember);
      return { ok: true, user: found };
    },
    [persistSession],
  );

  const demoLogin = useCallback(async (): Promise<AuthResult> => {
    const users = readUsersSafe();
    let demo = users.find((u) => u.email === DEMO_USER.email);

    if (!demo) {
      demo = createAuthUser(DEMO_USER.name, DEMO_USER.email, DEMO_USER.password);
      writeUsers([...users, demo]);
    }

    // Demo login is always remembered so the seed data survives a refresh.
    persistSession(demo, true);
    return { ok: true, user: demo };
  }, [persistSession]);

  const logout = useCallback(() => {
    clearCurrentUser();
    setUser(null);
    setStatus("unauthenticated");
    setRememberMe(false);
  }, []);

  const updateProfile = useCallback(
    (patch: { name?: string; email?: string }): AuthResult => {
      const current = user;
      if (!current) return { ok: false, error: "You are not signed in." };

      const name = patch.name?.trim() || current.name;
      const email = (patch.email?.trim() || current.email).toLowerCase();

      if (name.length < 2) return { ok: false, error: "Please enter your full name." };
      if (!isEmail(email)) return { ok: false, error: "Enter a valid email address." };

      const users = readUsersSafe();
      const clash = users.find((u) => u.id !== current.id && u.email === email);
      if (clash) return { ok: false, error: "That email is already used by another local account." };

      const updated: AuthUser = { ...current, name, email };
      writeUsers(users.map((u) => (u.id === current.id ? updated : u)));

      const remembered = readRememberMe();
      writeCurrentUser(updated, remembered);
      setUser(updated);

      return { ok: true, user: updated };
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, hydrated, rememberMe, signup, login, demoLogin, logout, updateProfile }),
    [user, status, hydrated, rememberMe, signup, login, demoLogin, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside <AuthProvider> (see src/app/providers.tsx).");
  }
  return ctx;
}

export { checkPasswordStrength };
