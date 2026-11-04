import { Checkbox as RadixCheckbox } from 'radix-ui'
import { Icon } from './Icon'

/** The props of `Checkbox`. */
export interface CheckboxProps {
  /** Accessible name; the visible label lives in the surrounding row. */
  label: string
  /**
   * `'indeterminate'` for a box that stands for a group of which some are checked, such as the
   * box in the head of a table that selects every row: it draws a dash and reads as "mixed".
   */
  checked: boolean | 'indeterminate'
  disabled?: boolean
  onCheckedChange(checked: boolean): void
  /**
   * Set by `Field`: per the ARIA accessible-name computation this wins over `label`'s
   * `aria-label`, so the box's name becomes the row's own visible label text.
   */
  'aria-labelledby'?: string | undefined
  /** Set by `Field`, pointing at its description or error text. */
  'aria-describedby'?: string | undefined
  /** Set by `FormField` or `CheckboxField` when the box failed its check: a danger border. */
  'aria-invalid'?: boolean | undefined
  /** Set by `FormField` for a box that must be checked, such as accepting the terms. */
  'aria-required'?: boolean | undefined
  /** The box's id, so a `<label for>` toggles it. */
  id?: string | undefined
}

/**
 * One box, checked or not. Same prop shape as `Switch`, for the same reason: a row from `Field`
 * wires either one the same way.
 *
 * `checked="indeterminate"` is the box of a group of which some are checked (the head of a
 * `DataTable`): a press on it reports `true`, so the group turns all on, as every table does.
 * Radix's `CheckedState` would report `'indeterminate'` back as well; `onCheckedChange` narrows it
 * to a `boolean`, since no click ever puts a box into that state.
 */
export function Checkbox({
  label,
  checked,
  disabled,
  onCheckedChange,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  id,
}: CheckboxProps) {
  return (
    <RadixCheckbox.Root
      aria-label={label}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      aria-required={ariaRequired}
      id={id}
      checked={checked}
      disabled={disabled}
      onCheckedChange={(next) => onCheckedChange(next === true)}
      className={
        ariaInvalid
          ? 'no-drag flex size-4 shrink-0 items-center justify-center rounded-sm border border-danger bg-surface text-accent-fg outline-focus transition-colors duration-(--nt-duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40 data-[state=checked]:bg-accent data-[state=indeterminate]:bg-accent'
          : 'no-drag flex size-4 shrink-0 items-center justify-center rounded-sm border border-control-border bg-surface text-accent-fg outline-focus transition-colors duration-(--nt-duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40 data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent'
      }
    >
      <RadixCheckbox.Indicator>
        <Icon name={checked === 'indeterminate' ? 'minus' : 'check'} size="xs" />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  )
}
