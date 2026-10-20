import { cva } from 'class-variance-authority'

/** Width classes per size; never a caller-supplied value, so a skeleton always sits on the 4px grid. */
const skeleton = cva('block bg-surface-hover nt-shimmer', {
  variants: {
    width: { full: 'w-full', lg: 'w-48', md: 'w-32', sm: 'w-16' },
    shape: { line: 'h-3 rounded-sm', circle: 'aspect-square rounded-full' },
  },
  defaultVariants: { width: 'full', shape: 'line' },
})

/** The props of `Skeleton`. */
export interface SkeletonProps {
  width?: 'full' | 'lg' | 'md' | 'sm'
  shape?: 'line' | 'circle'
}

/**
 * A placeholder shape shown while real content is not there yet.
 *
 * Purely visual (`aria-hidden`): the loading state itself is announced elsewhere (a `Spinner`, a
 * `StatusLine`), so a row of these never floods assistive technology with meaningless shapes.
 */
export function Skeleton({ width, shape }: SkeletonProps) {
  return <span aria-hidden="true" className={skeleton({ width, shape })} />
}
