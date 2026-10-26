'use client';

import { cn } from '@eos/utils';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from 'framer-motion';
import type { ItemRect, UseFluidHoverReturn } from '../hooks/use-fluid-hover';

// ---------------------------------------------------------------------------
// The one hover highlight every fluid hover list renders: an absolutely
// positioned fill that springs between the rects `useFluidHover` measures.
// Adapted from Fluid Functionalism (https://www.fluidfunctionalism.com/docs/fluid-hover).
//
//   const hover = useFluidHover(ref);
//   <FluidHoverHighlight hover={hover} className="rounded-md bg-accent" />
//
// It owns no layout opinion beyond `absolute`: radius, fill, z-index, and the
// offsetParent (the container must be `relative`) are the consumer's.
// ---------------------------------------------------------------------------

/** Fluid Functionalism's `spring.fast` tier: critically damped, 80ms. */
const springFast = {
  type: 'spring' as const,
  duration: 0.08,
  bounce: 0,
};
const springFastExit: Transition = { duration: 0.06 };

/** What the highlight reads off the hook: the highlighted index, the
 *  measured rects, whether they are current, and the pointer session. */
export type FluidHoverSource = Pick<
  UseFluidHoverReturn,
  'activeIndex' | 'itemRects' | 'isMeasured' | 'session'
>;

export type FluidHoverHighlightProps = {
  /** The hook's return value. The highlight sits on
   *  `itemRects[activeIndex]` once `isMeasured`, and re-keys on the session. */
  hover: FluidHoverSource;
  /** Keep the list's state but show nothing. Runs the exit fade. */
  hidden?: boolean;
  /** Where a fresh session fades in from. Defaults to the rect itself. */
  from?: ItemRect | null;
  /** Radius, fill, z-index. Merged onto `absolute pointer-events-none`. */
  className?: string;
  /** The positional spring. Pass `false` to snap with no travel. The opacity
   *  fade is always 0.08s. */
  transition?: Transition | false;
  /** Render as an `<li>` so the highlight is valid inside a `<ul>`. */
  as?: 'div' | 'li';
};

const fade: Transition = { duration: 0.08 };
const snap: Transition = { duration: 0 };

function toTarget(rect: ItemRect) {
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
}

/** Reduced motion keeps the opacity fade and drops the travel. */
function resolveTransition(
  transition: Transition | false | undefined,
  reduceMotion: boolean,
): Transition {
  const positional =
    transition === false || reduceMotion ? snap : (transition ?? springFast);
  return { ...positional, opacity: fade };
}

export function FluidHoverHighlight({
  hover,
  hidden,
  from,
  className,
  transition,
  as = 'div',
}: FluidHoverHighlightProps) {
  const { activeIndex, itemRects, isMeasured, session } = hover;
  const rect =
    !hidden && isMeasured && activeIndex !== null
      ? (itemRects[activeIndex] ?? null)
      : null;
  // Reads the OS media query directly, so it honours reduced motion without
  // the app wrapping its tree in MotionConfig.
  const reduceMotion = useReducedMotion() ?? false;
  const Component = as === 'li' ? motion.li : motion.div;
  return (
    <AnimatePresence>
      {rect && (
        <Component
          key={session}
          aria-hidden
          data-slot="fluid-hover-highlight"
          // Pinned to the container's padding corner and moved with a
          // transform, so the travel runs on the compositor.
          className={cn(
            'pointer-events-none absolute top-0 left-0 list-none',
            className,
          )}
          initial={{ opacity: 0, ...toTarget(from ?? rect) }}
          animate={{ opacity: 1, ...toTarget(rect) }}
          exit={{ opacity: 0, transition: springFastExit }}
          transition={resolveTransition(transition, reduceMotion)}
        />
      )}
    </AnimatePresence>
  );
}
