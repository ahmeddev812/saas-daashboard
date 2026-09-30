/**
 * Tiny clsx-style class name joiner.
 * Written locally so the project adds no extra dependencies.
 *
 * Supports:
 *   cn("a", "b")            -> "a b"
 *   cn("a", cond && "b")    -> "a b" | "a"
 *   cn({ "a": true })       -> "a"
 */
type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | { [key: string]: boolean | null | undefined };

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  const walk = (value: ClassValue): void => {
    if (value === null || value === undefined || value === false || value === "") return;

    if (typeof value === "string" || typeof value === "number") {
      out.push(String(value));
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }

    if (typeof value === "object") {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) out.push(key);
      }
    }
  };

  for (const value of values) walk(value);

  return out.join(" ");
}

export default cn;
