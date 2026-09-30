import type { AuthUser } from "@/types/business";
import { generateId } from "@/lib/id";
import { nowIso } from "@/lib/dates";

/**
 * ===========================================================================
 * DEMO AUTH HELPERS — NOT PRODUCTION AUTHENTICATION
 * ---------------------------------------------------------------------------
 * ATLARIS is a frontend/local-first demo. There is no backend, no server
 * session and no secure password storage. Everything below runs in the
 * browser and is stored in plaintext-adjacent localStorage.
 *
 * `hashPassword` is a deliberately weak, non-cryptographic digest whose only
 * purpose is to avoid keeping a raw password string in localStorage. It must
 * NEVER be described or used as real security.
 * ===========================================================================
 */

const HASH_ROUNDS = 512;

/** Weak, non-cryptographic digest. Demo only — never real security. */
export function hashPassword(password: string, salt = "atlaris-demo"): string {
  // FNV-1a style mixing, iterated. Cheap, stable, and intentionally simple.
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const seed = `${salt}:${password}`;

  for (let round = 0; round < HASH_ROUNDS; round += 1) {
    for (let i = 0; i < seed.length; i += 1) {
      const code = seed.charCodeAt(i) ^ (round & 0xff);
      h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
      h2 = Math.imul(h2 + code + round, 0x85ebca6b) >>> 0;
    }
  }

  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

/** Constant-time-ish comparison of two digests. */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (typeof storedHash !== "string" || storedHash.length === 0) return false;
  const candidate = hashPassword(password);
  if (candidate.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i += 1) {
    diff |= candidate.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

/* --------------------------------------------------------------------------
   Password strength
   -------------------------------------------------------------------------- */

export interface PasswordChecks {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  symbol: boolean;
}

export type PasswordScore = 0 | 1 | 2 | 3 | 4 | 5;

export interface PasswordStrength {
  checks: PasswordChecks;
  /** 0–5 */
  score: PasswordScore;
  label: "Too weak" | "Weak" | "Fair" | "Good" | "Strong";
  /** True when every rule passes. */
  valid: boolean;
}

export const PASSWORD_MIN_LENGTH = 8;

/** Evaluates length, uppercase, lowercase, number and symbol. */
export function checkPasswordStrength(password: string): PasswordStrength {
  const checks: PasswordChecks = {
    length: password.length >= PASSWORD_MIN_LENGTH,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const score = (passed === 5 && checks.length ? 5 : passed) as PasswordScore;

  const label: PasswordStrength["label"] =
    score <= 1 ? "Too weak" : score === 2 ? "Weak" : score === 3 ? "Fair" : score === 4 ? "Good" : "Strong";

  return { checks, score, label, valid: checks.length && passed >= 4 };
}

/* --------------------------------------------------------------------------
   Users
   -------------------------------------------------------------------------- */

export function createAuthUser(name: string, email: string, password: string): AuthUser {
  return {
    id: generateId(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    createdAt: nowIso(),
  };
}

/** Basic email shape check (no external validation, frontend only). */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** The built-in demo account (opt-in, never created silently). */
export const DEMO_USER = {
  name: "Alex Rivera",
  email: "demo@atlaris.app",
  password: "Demo!2026",
} as const;
