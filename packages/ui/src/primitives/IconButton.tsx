import { cva } from 'class-variance-authority'
import type { ComponentPropsWithRef } from 'react'
import type { ControlSize } from './control-size'
import { controlHeight, controlSquare } from './control-size'
import { Icon, type IconName, type IconTone } from './Icon'
import { Spinner } from './Spinner'

/**
 * Same colour treatment as `Button`, sized square from `controlHeight` and `controlSquare` so the
 * two never drift apart: both read the same `--nt-control-*` token per size. `controlHeight`, not
 * `controlSize`: an icon-only button has no visible text, so it never needs (and never gets) the
 * `text-[…px]` class `controlSize` carries alongside its height for a text-bearing control.
 */
const iconButton = cva(
  'no-drag inline-flex shrink-0 items-center justify-center outline-focus transition-[filter,background-color] duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40 aria-disabled:hover:filter-none',
  {
    variants: {
      // The dimming of `aria-disabled` sits in each variant rather than in the base: `idle` must
      // keep its full strength, and a base class cannot be taken back without a class-merging tool.
      variant: {
        primary: 'bg-accent text-accent-fg hover:brightness-110 aria-disabled:opacity-40',
        secondary: 'border border-border text-fg hover:bg-surface-hover aria-disabled:opacity-40',
        ghost:
          'text-muted hover:bg-surface hover:text-fg aria-pressed:bg-surface-hover aria-pressed:text-fg aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted',
        // In the foreground colour at rest, like a pressed ghost: for the one or two actions of a
        // column (the sidebar's `+` and gear), where a muted glyph on the lighter sidebar all but
        // disappeared. Hover and focus add only the fill; there is no brighter colour to go to.
        plain:
          'text-fg hover:bg-surface focus-visible:bg-surface aria-pressed:bg-surface-hover aria-disabled:opacity-40 aria-disabled:hover:bg-transparent',
        // The quiet plane of a primary action that cannot act yet: the empty send button of the
        // composer. Never dimmed while `aria-disabled` — it is a tab stop that says what it will
        // do, and a glyph at 40% on a plane of 3% all but disappeared in light.
        idle: 'bg-pill text-muted',
      },
      size: {
        // The cross inside a chip of 24px: 20px, so it fits inside the frame.
        xs: 'h-(--nt-control-xs) w-(--nt-control-xs)',
        sm: `${controlHeight.sm} ${controlSquare.sm}`,
        md: `${controlHeight.md} ${controlSquare.md}`,
        lg: `${controlHeight.lg} ${controlSquare.lg}`,
      },
      // Exhaustive, like the axes of `Button`: with no class-merging tool, a base `rounded-md` and
      // a variant's `rounded-full` would both be emitted and Tailwind's order would pick one.
      shape: { square: 'rounded-md', round: 'rounded-full' },
      // The strong border of the pills beside it. For a ghost: the
      // `secondary` variant has a border of its own, and two would race.
      outlined: { true: 'border border-border-strong', false: '' },
    },
    defaultVariants: { variant: 'ghost', size: 'md', shape: 'square', outlined: false },
  },
)

/** The props of `IconButton`. */
export interface IconButtonProps
  extends Omit<ComponentPropsWithRef<'button'>, 'className' | 'style' | 'children'> {
  icon: IconName
  /** Required: an icon button has no visible text. */
  label: string
  /** `xs` (20px) only for a control inside another one, the cross of a small `Chip`. */
  size?: ControlSize | 'xs'
  /**
   * ghost (default): for a toolbar. plain: a ghost in the foreground colour, for the few actions
   * of a column. primary/secondary: same look as `Button`. idle: the plane of a primary that
   * cannot act yet, at full strength while `aria-disabled` (the empty send button).
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'plain' | 'idle'
  /**
   * A colour for the glyph, passed straight through to `Icon`.
   *
   * Deliberately not a class on the button: its variant already sets a `text-*`, and a second one
   * here would race it through Tailwind's generation order (see `Button.tsx`). The glyph is all
   * an icon button shows, so colouring the glyph colours the button — and it keeps doing so on
   * hover, where the variant changes the button's own colour.
   */
  tone?: IconTone
  /**
   * `square` (default) has the radius of every control; `round` is a circle, for the "+" that
   * opens the menu of the composer, beside the round pills.
   */
  shape?: 'square' | 'round'
  /**
   * Draws the strong border around a ghost, so it stands in a row of `Pill`s as one of them:
   * `shape="round" outlined` is the "+" of the composer (28px, the glyph muted).
   */
  outlined?: boolean
  /**
   * Draws the arc of a `Spinner` in place of the glyph, for a press that is being carried out
   * (Stop until core ended the turn). The name stays; pair it with `aria-busy` and `aria-disabled`.
   */
  busy?: boolean
}

/**
 * A button with an icon and no visible text, e.g. a toolbar action or a toggle.
 *
 * `label` becomes `aria-label` on the button, and the icon it wraps stays decorative (`Icon` is
 * always `aria-hidden`), so the name is never announced twice.
 */
export function IconButton({
  icon,
  label,
  size,
  variant,
  tone,
  shape,
  outlined,
  busy = false,
  type = 'button',
  ...props
}: IconButtonProps) {
  // `className` and `style` are not part of `IconButtonProps`, but a caller working around the
  // type (or plain JS) could still pass either; drop them explicitly so they can never leak past
  // the variant classes.
  const { className: _className, style: _style, ...rest } = props as ComponentPropsWithRef<'button'>
  return (
    <button
      type={type}
      aria-label={label}
      // The mark the gallery walks to hold every icon button to a name and a tooltip; nothing in the app styles or selects by it.
      data-nt-icon-button
      className={iconButton({ variant, size, shape, outlined })}
      {...rest}
    >
      {busy ? (
        <Spinner size="sm" decorative />
      ) : (
        <Icon
          name={icon}
          size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md'}
          {...(tone ? { tone } : {})}
        />
      )}
    </button>
  )
}
