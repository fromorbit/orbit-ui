import { iconGlyph } from './Icon'

/**
 * The props of `Spinner`: an accessible name ("Laden…"), unless it is `decorative`.
 *
 * A union, so a spinner that announces itself cannot be written without its name, and a silent one
 * needs none.
 */
export type SpinnerProps = {
  /** Matches the size of the control it sits in; defaults to `md`. */
  size?: 'sm' | 'md'
} & (
  | {
      /** The accessible name, announced once when it appears ("Laden…"). */
      label: string
      decorative?: false
    }
  | {
      label?: undefined
      /**
       * Set by `Button` when its own label already says the action is busy: the spinner must then
       * stay silent instead of announcing "Loading" on top of it.
       */
      decorative: true
    }
)

/**
 * A rotating indicator for "this is taking a moment", sized from the icon tokens like `Icon`.
 *
 * `role="status"` gives assistive technology one polite announcement when it appears; `currentColor`
 * lets it pick up whatever text colour its container already has (a primary button's fill text, a
 * muted status line), so it never needs its own colour prop.
 */
export function Spinner({ size = 'md', label, decorative }: SpinnerProps) {
  // Lucide's `loader-circle` rather than a ring of our own: the same
  // stroke and box as every other glyph. Drawn as the bare glyph, not through `Icon`, because
  // `Icon` is always decorative and this one carries a status role and a name.
  const Glyph = iconGlyph('loader-circle')
  return (
    <Glyph
      role={decorative ? undefined : 'status'}
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={decorative ? undefined : label}
      strokeWidth={1.75}
      className={`nt-spin ${size === 'sm' ? 'size-(--nt-icon-sm)' : 'size-(--nt-icon-md)'}`}
    />
  )
}
