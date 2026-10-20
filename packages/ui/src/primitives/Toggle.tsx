import { cva } from 'class-variance-authority'
import { Toggle as RadixToggle } from 'radix-ui'
import type { ControlSize } from './control-size'
import { controlHeight, controlSquare } from './control-size'
import { Icon, type IconName } from './Icon'

/**
 * `controlHeight`/`controlSquare`, not `controlSize`: an icon-only control has no visible text to
 * size around, the same reasoning `IconButton` carries (see its own doc).
 *
 * `data-state="on"` carries a filled surface, never a colour on its own: three of these side by
 * side in a toolbar are exactly where a hover and a pressed state would otherwise be told apart
 * by shade alone.
 */
const toggle = cva(
  'no-drag inline-flex shrink-0 items-center justify-center rounded-md text-muted outline-focus transition-colors duration-100 hover:bg-surface hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40 data-[state=on]:bg-surface-hover data-[state=on]:text-fg',
  {
    variants: {
      size: {
        sm: `${controlHeight.sm} ${controlSquare.sm}`,
        md: `${controlHeight.md} ${controlSquare.md}`,
        lg: `${controlHeight.lg} ${controlSquare.lg}`,
      },
    },
    defaultVariants: { size: 'md' },
  },
)

/** The props of `Toggle`. */
export interface ToggleProps {
  icon: IconName
  /** Required: an icon-only control has no visible text. Becomes `aria-label`. */
  label: string
  pressed: boolean
  onPressedChange(pressed: boolean): void
  size?: ControlSize
  disabled?: boolean
}

/**
 * A single icon-only on/off control, e.g. "wrap lines" in a toolbar.
 *
 * Radix `Toggle`, not an `IconButton` with a handwritten `aria-pressed`: `shared/ui/` wraps a Radix
 * primitive once and uses the wrapper after that, and `data-state` is what tells "on"
 * apart from "hover" here, which a class toggled by hand would have to reinvent.
 *
 * **Its accessible name never changes with the state.** The glyph and the filled surface carry
 * "on" or "off"; the name stays `label` throughout, because a name that changes under the focus is
 * announced a second time.
 */
export function Toggle({ icon, label, pressed, onPressedChange, size, disabled }: ToggleProps) {
  return (
    <RadixToggle.Root
      aria-label={label}
      pressed={pressed}
      onPressedChange={onPressedChange}
      disabled={disabled}
      className={toggle({ size })}
    >
      <Icon name={icon} size={size === 'sm' ? 'sm' : 'md'} />
    </RadixToggle.Root>
  )
}
