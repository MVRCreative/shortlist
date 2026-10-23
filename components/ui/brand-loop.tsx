/**
 * BrandLoop
 *
 * Purpose: the Loople mark telling a short story. The rings scale up from
 * the center, the squircles turn, the center winks, then everything rests
 * long enough that the next pass is a fresh start. Used for page-level
 * waiting and the empty feed. Inline button pending states stay on Spinner.
 *
 * Layers are the real mark, split so each ring can move on its own.
 * Positions match the 512px lockup: outer at 46px, inner at 138px, core at 210px.
 *
 * Variants: size via the `size` prop (pixel diameter, defaults to 48).
 * Accessibility: decorative (aria-hidden). Motion stops under
 * prefers-reduced-motion.
 *
 * Usage:
 *   <BrandLoop size={56} />
 */
import Image from "next/image"
import { cn } from "@/lib/utils"

type BrandLoopProps = {
  /** Outer diameter in pixels. */
  size?: number
  className?: string
}

export function BrandLoop({ size = 48, className }: BrandLoopProps) {
  return (
    <div
      aria-hidden
      style={{ width: size, height: size }}
      className={cn("relative shrink-0", className)}
    >
      <style>
        {`@keyframes brand-story-outer {
          0%, 56%, 100% { transform: scale(1) rotate(0deg); }
          12% { transform: scale(1.07) rotate(0deg); }
          20% { transform: scale(1) rotate(0deg); }
          26% { transform: scale(1) rotate(-18deg); }
          30% { transform: scale(1) rotate(8deg); }
          33% { transform: scale(1) rotate(-3deg); }
          36% { transform: scale(1) rotate(0deg); }
        }
        @keyframes brand-story-inner {
          0%, 56%, 100% { transform: scale(1) rotate(0deg); }
          8% { transform: scale(1.12) rotate(0deg); }
          16% { transform: scale(1) rotate(0deg); }
          27% { transform: scale(1) rotate(16deg); }
          31% { transform: scale(1) rotate(-7deg); }
          34% { transform: scale(1) rotate(2deg); }
          37% { transform: scale(1) rotate(0deg); }
        }
        @keyframes brand-wink {
          0%, 40%, 54%, 100% { transform: scale(1, 1); }
          46% { transform: scale(1.14, 0.68); }
          50% { transform: scale(0.96, 1.08); }
        }
        .brand-ripple-outer, .brand-ripple-inner, .brand-wink {
          transform-origin: center center;
        }
        .brand-ripple-outer { animation: brand-story-outer 4.4s ease-in-out infinite; }
        .brand-ripple-inner { animation: brand-story-inner 4.4s ease-in-out infinite; }
        .brand-wink { animation: brand-wink 4.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .brand-ripple-outer, .brand-ripple-inner, .brand-wink { animation: none; }
        }`}
      </style>
      <div className="brand-ripple-outer absolute top-[8.984%] left-[8.984%] size-[81.836%]">
        <Image
          src="/brand/loople-ring-outer.png"
          alt=""
          fill
          sizes="80px"
          className="object-fill"
        />
      </div>
      <div className="absolute inset-0">
        <div className="brand-ripple-inner absolute top-[26.953%] left-[26.953%] size-[46.094%]">
          <Image
            src="/brand/loople-ring-inner.png"
            alt=""
            fill
            sizes="48px"
            className="object-fill"
          />
        </div>
        <div className="brand-wink absolute top-[41.016%] left-[41.016%] size-[18.945%]">
          <Image
            src="/brand/loople-core.png"
            alt=""
            fill
            sizes="24px"
            className="object-fill"
          />
        </div>
      </div>
    </div>
  )
}

/** Centered mark for a route or screen that is still loading. */
export function PageLoading({
  className,
  label = "Loading",
}: {
  className?: string
  label?: string
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "flex min-h-screen items-center justify-center bg-background",
        className
      )}
    >
      <BrandLoop size={48} />
    </div>
  )
}
