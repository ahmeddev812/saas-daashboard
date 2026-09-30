"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface LogoProps {
  size?: number;
  /** Show the ATLARIS wordmark next to the mark. */
  showWordmark?: boolean;
  /** Animate the orbit ring. Respects prefers-reduced-motion. */
  animated?: boolean;
  className?: string;
  /** Accessible label for the mark (defaults to "ATLARIS"). */
  label?: string;
}

/**
 * ATLARIS mark: globe/sphere + orbit ring, primary→accent gradient,
 * with a slow, subtle rotation.
 *
 * The animation is decorative: it is aria-hidden and it stops entirely when
 * the user prefers reduced motion.
 */
export function Logo({
  size = 32,
  showWordmark = true,
  animated = true,
  className,
  label = "ATLARIS",
}: LogoProps) {
  // Reduced motion is handled by <MotionConfig reducedMotion="user"> at the
  // app root, so this never reads matchMedia during render (hydration-safe).
  const shouldAnimate = animated;

  const gradientId = "atlaris-logo-gradient";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className="relative inline-grid shrink-0 place-items-center"
        style={{ width: size, height: size }}
        role="img"
        aria-label={label}
      >
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          fill="none"
          aria-hidden="true"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="var(--gradient-primary-start)" />
              <stop offset="100%" stopColor="var(--gradient-primary-end)" />
            </linearGradient>
          </defs>

          {/* Sphere */}
          <circle cx="24" cy="24" r="12.5" fill={`url(#${gradientId})`} opacity="0.16" />
          <circle
            cx="24"
            cy="24"
            r="12.5"
            stroke={`url(#${gradientId})`}
            strokeWidth="2.4"
          />
          {/* Meridians */}
          <ellipse cx="24" cy="24" rx="5.6" ry="12.5" stroke={`url(#${gradientId})`} strokeWidth="1.5" opacity="0.75" />
          <path
            d="M12 20.5c3.4 1.9 7.6 3 12 3s8.6-1.1 12-3"
            stroke={`url(#${gradientId})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M12 27.5c3.4-1.9 7.6-3 12-3s8.6 1.1 12 3"
            stroke={`url(#${gradientId})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.55"
          />

          {/* Orbit ring */}
          <motion.g
            style={{ transformOrigin: "24px 24px" }}
            animate={shouldAnimate ? { rotate: 360 } : { rotate: 0 }}
            transition={shouldAnimate ? { duration: 14, repeat: Infinity, ease: "linear" } : undefined}
          >
            <ellipse
              cx="24"
              cy="24"
              rx="21"
              ry="8.5"
              stroke={`url(#${gradientId})`}
              strokeWidth="1.8"
              opacity="0.9"
              transform="rotate(-24 24 24)"
            />
            <circle cx="43.2" cy="16.4" r="2.6" fill={`url(#${gradientId})`} />
          </motion.g>
        </svg>
      </span>

      {showWordmark ? (
        <span className="text-gradient text-lg font-semibold tracking-tight">ATLARIS</span>
      ) : null}
    </span>
  );
}

export default Logo;
