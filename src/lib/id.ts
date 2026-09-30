/**
 * Central ID generation for ATLARIS entities.
 * Uses crypto.randomUUID when available, otherwise a
 * collision-resistant fallback (still SSR safe).
 */
const FALLBACK_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function fallbackId(): string {
  let raw = "";
  for (let i = 0; i < 32; i += 1) {
    raw += FALLBACK_ALPHABET[Math.floor(Math.random() * FALLBACK_ALPHABET.length)];
  }
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      return fallbackId();
    }
  }
  return fallbackId();
}

/**
 * Short, human-readable identifier used for display
 * (order numbers, invoice references, ...).
 */
export function generateShortId(prefix = "", length = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let body = "";
  for (let i = 0; i < length; i += 1) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return prefix ? `${prefix}-${body}` : body;
}
