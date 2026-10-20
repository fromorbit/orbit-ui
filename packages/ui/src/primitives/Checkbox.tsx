import { Checkbox as RadixCheckbox } from 'radix-ui'
import { Icon } from './Icon'

/** The props of `Checkbox`. */
export interface CheckboxProps {
  /** Accessible name; the visible label lives in the surrounding row. */
  label: string
  checked: boolean
  disabled?: boolean
  onCheckedChange(checked: boolean): void
  /**
   * Set by `Field`: per the ARIA accessible-name computation this wins over `label`'s
   * `aria-label`, so the box's name becomes the row's own visible label text.
   */
  'aria-labelledby'?: string | undefined
  /** Set by `Field`, pointing at its description or error text. */
  'aria-describedby'?: string | undefined
}

/**
 * One box, checked or not. Same prop shape as `Switch`, for the same reason: a row from `Field`
 * wires either one the same way.
 *
 * No `indeterminate` stand: nothing in this app asks for a box that is neither on nor off, and a
 * stand nobody can put it in through the UI is a stand nobody can write a test for either. Radix's
 * `CheckedState` allows it regardless, so `onCheckedChange` narrows it away here rather than
 * leaking it into a caller that only ever passes `boolean`.
 */
export function Checkbox({
  label,
  checked,
  disabled,
  onCheckedChange,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: CheckboxProps) {
  return (
    <RadixCheckbox.Root
      aria-label={label}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      checked={checked}
      disabled={disabled}
      onCheckedChange={(next) => onCheckedChange(next === true)}
      className="no-drag flex size-4 shrink-0 items-center justify-center rounded-sm border border-border bg-surface text-accent-fg outline-focus transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40 data-[state=checked]:border-accent data-[state=checked]:bg-accent"
    >
      <RadixCheckbox.Indicator>
        <Icon name="check" size="xs" />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  )
}
