"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * True after the first client render.
 *
 * Implemented with `useSyncExternalStore` so the server snapshot and the
 * first client render agree (no hydration mismatch) and no `setState` is
 * ever called from inside an effect.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/**
 * Runs `callback` whenever `key` changes (and once on mount), deferred to a
 * microtask so the effect body never triggers a synchronous cascading render.
 *
 * Used to reset transient UI state — open menus, drawers, selections — when
 * the route or another identity key changes.
 */
export function useChangedKey(key: string, callback: () => void): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) callbackRef.current();
    });
    return () => {
      active = false;
    };
  }, [key]);
}

/**
 * Subscribes to a window-level custom event.
 *   useWindowEvent("atlaris:open-search", openPalette);
 */
export function useWindowEvent(type: string, callback: (event: Event) => void): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const handler = (event: Event) => callbackRef.current(event);
    window.addEventListener(type, handler);
    return () => window.removeEventListener(type, handler);
  }, [type]);
}

export default useMounted;
