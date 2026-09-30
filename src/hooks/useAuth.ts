"use client";

/**
 * Auth hook — thin re-export of the AuthContext consumer.
 * Components import from `@/hooks/useAuth` so context internals stay private.
 */

export { useAuthContext as useAuth } from "@/context/AuthContext";
export type { AuthContextValue, AuthResult, AuthStatus, SignupInput } from "@/context/AuthContext";
export { checkPasswordStrength } from "@/context/AuthContext";
