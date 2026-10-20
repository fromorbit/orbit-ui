import { cva } from 'class-variance-authority'
import { ToggleGroup } from 'radix-ui'
import type { ControlSize } from './control-size'
import { controlHeight, controlSquare } from './control-size'
import { Icon, type IconName } from './Icon'

/**
 * Icon-only, so `controlHeight`/`controlSquare` rather than `controlSize` — the same reasoning as
 * `Toggle` and `IconButton`. `disabled:opacity-40` sits on the item, not the group: each option is
 * a real `<button>`, so the native pseudo-class already does the dimming Radix would otherwise
 * need a `data-disabled` on the root for.
 */
const item = cva(
  'inline-flex items-center justify-center rounded-sm text-muted outline-focus transition-colors duration-100 hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:pointer-events-none disabled:opacity-40 data-[state=on]:bg-surface-hover data-[state=on]:text-fg',
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

/** The props of `IconSegmentedControl`. */
export interface IconSegmentedControlProps<T extends string> {
  /** Accessible name of the group. */
  label: string
  value: T
  options: readonly { value: T; icon: IconName; label: string }[]
  size?: ControlSize
  disabled?: boolean
  onValueChange(value: T): void
}

/**
 * One choice out of a few icon-only buttons, all visible at once — e.g. stacked/split in the
 * changes toolbar.
 *
 * **Not the same component as `SegmentedControl`.** That one wraps Radix `RadioGroup` for a row of
 * *text* options (each with room for a label of its own); this one wraps Radix `ToggleGroup`
 * (`type="single"`) for icon-only options, where `data-state="on"` — not a shared checked value —
 * is what a hover and the active choice are told apart by. Two wrappers,
 * because a caller reaching for "SegmentedControl" without checking the codebase first would have
 * silently reused the wrong Radix primitive for one of the two jobs; naming this one after what it
 * is (icon-only) keeps both discoverable and neither one accidentally repurposed.
 *
 * **The value can never become empty.** Radix's own `type="single"` toggle group calls
 * `onValueChange('')` when the pressed option is clicked again; this wrapper swallows that so the
 * caller's `T` is never asked to hold an empty string — the same "a click on the active option
 * does nothing" rule `SegmentedControl` gets for free from `RadioGroup`.
 */
export function IconSegmentedControl<T extends string>({
  label,
  value,
  options,
  size,
  disabled,
  onValueChange,
}: IconSegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      {...(disabled !== undefined ? { disabled } : {})}
      orientation="horizontal"
      onValueChange={(next) => {
        if (next) onValueChange(next as T)
      }}
      className="no-drag inline-flex shrink-0 rounded-md border border-border bg-surface p-0.5 data-disabled:opacity-40"
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          aria-label={option.label}
          className={item({ size })}
        >
          <Icon name={option.icon} size={size === 'sm' ? 'sm' : 'md'} />
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
