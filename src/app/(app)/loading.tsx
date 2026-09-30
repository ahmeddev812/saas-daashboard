import { Skeleton, SkeletonCard, SkeletonStats } from "@/components/ui/Skeleton";

/**
 * App-shell loading state (spec §28): shaped like a real page — header,
 * stat row and a content card — so nothing jumps when data lands.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading page">
      <span className="sr-only">Loading…</span>

      <div className="flex flex-col gap-3">
        <Skeleton width="7rem" height="0.75rem" />
        <Skeleton width="16rem" height="2rem" />
        <Skeleton width="28rem" height="1rem" />
      </div>

      <SkeletonStats count={4} className="xl:grid-cols-4" />
      <SkeletonCard lines={5} />
    </div>
  );
}
