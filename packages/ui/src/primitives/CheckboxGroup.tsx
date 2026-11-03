import { useId } from 'react'
import { CheckboxField } from './CheckboxField'

/** One option of a `CheckboxGroup`. */
export interface CheckboxGroupOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

/** The props of `CheckboxGroup`. */
export interface CheckboxGroupProps {
  /** The question the boxes answer, visible above them ("Meldingen"). */
  label: string
  /** A line under the question. */
  description?: string
  /** What is wrong with the choice ("Kies er minstens één"), announced. */
  error?: string
  options: readonly CheckboxGroupOption[]
  /** The values that are checked, in any order. */
  value: readonly string[]
  /** The new set, in the order of `options`. */
  onValueChange(value: string[]): void
  disabled?: boolean
}

/**
 * Several boxes under one question, any number of them checked: "Stuur me een melding bij…".
 *
 * A `<fieldset>` with its `<legend>`, so a screen reader names the group before the first box,
 * and the description or error is wired on the group (`aria-describedby`). Each option is a
 * `CheckboxField`, a tab stop of its own, which is how a group of checkboxes is reached (unlike a
 * radio group, which is one stop with arrow keys). The new value keeps the order of `options`, so
 * a caller that stores it gets the same array for the same choice.
 */
export function CheckboxGroup({
  label,
  description,
  error,
  options,
  value,
  onValueChange,
  disabled = false,
}: CheckboxGroupProps) {
  const messageId = useId()
  const shownError = error?.trim() ? error : undefined
  const message = shownError ?? (description?.trim() ? description : undefined)
  const chosen = new Set(value)
  return (
    <fieldset
      aria-describedby={message === undefined ? undefined : messageId}
      aria-invalid={shownError === undefined ? undefined : true}
      disabled={disabled}
      className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
    >
      <legend className="mb-1 p-0 font-medium text-[13px] text-fg">{label}</legend>
      {shownError === undefined && message !== undefined ? (
        <p id={messageId} className="m-0 -mt-1 text-[12px] text-muted">
          {message}
        </p>
      ) : null}
      {options.map((option) => (
        <CheckboxField
          key={option.value}
          label={option.label}
          {...(option.description === undefined ? {} : { description: option.description })}
          checked={chosen.has(option.value)}
          disabled={disabled || option.disabled === true}
          onCheckedChange={(next) => {
            const after = new Set(chosen)
            if (next) after.add(option.value)
            else after.delete(option.value)
            onValueChange(options.map((o) => o.value).filter((v) => after.has(v)))
          }}
        />
      ))}
      {shownError === undefined ? null : (
        <p id={messageId} role="alert" className="m-0 text-[12px] text-danger">
          {shownError}
        </p>
      )}
    </fieldset>
  )
}
