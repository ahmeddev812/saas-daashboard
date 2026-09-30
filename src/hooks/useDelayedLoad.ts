"use client";

import { useEffect, useState } from "react";

/**
 * Simulates a short loading state so Skeletons are actually visible on
 * fast local data (otherwise every screen would flash from empty to full).
 *
 * Returns `true` while "loading". Never runs during SSR — the first client
 * render always reports loading, then flips after `delayMs`.
 *
 *   const loading = useDelayedLoad(ready, 350);
 */
export function useDelayedLoad(ready: boolean, delayMs = 350): boolean {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    if (elapsed) return;
    const timer = setTimeout(() => setElapsed(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, elapsed]);

  if (!ready) return true;
  return !elapsed;
}

/**
 * True until `value` becomes non-null, for guarding against the very first
 * render where context may not be hydrated yet.
 */
export function useIsPending(hydrated: boolean, delayMs = 350): boolean {
  return useDelayedLoad(hydrated, delayMs);
}

export default useDelayedLoad;
