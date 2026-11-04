import { useId } from 'react'
import { Checkbox } from './Checkbox'

/** Blank text is no text. */
function present(text: string | undefined): string | undefined {
  return text === undefined || text.trim() === '' ? undefined : text
}

/** The props of `CheckboxField`. */
export interface CheckboxFieldProps {
  /** The words beside the box, visible, and its accessible name. */
  label: string
  /** A quieter line under the label, read as the box's description. */
  description?: string
  /** What is wrong ("Ga akkoord om door te gaan"): replaces the description and is announced. */
  error?: string
  checked: boolean | 'indeterminate'
  disabled?: boolean
  /** The box must be checked before the form may go: `aria-required`. */
  required?: boolean
  onCheckedChange(checked: boolean): void
}

/**
 * A box with its words beside it, clickable as a whole: "Ingelogd blijven", "Gezien", "Ik ga
 * akkoord met de voorwaarden".
 *
 * `Checkbox` alone carries its label only for a screen reader, because in a settings row the label
 * stands in the row's other column. Here the label is the box's own: the row is a `<label>`, so a
 * click on the words toggles the box, and the box is named by the words (`aria-labelledby`) and
 * described by the line under them. The box stays the one control, a single tab stop.
 */
export function CheckboxField({
  label,
  description,
  error,
  checked,
  disabled,
  required = false,
  onCheckedChange,
}: CheckboxFieldProps) {
  const labelId = useId()
  const messageId = useId()
  const shownError = present(error)
  const message = shownError ?? present(description)
  return (
    <div data-nt-checkbox-field className="flex min-w-0 flex-col gap-1">
      {/* biome-ignore lint/a11y/noLabelWithoutControl: the control is the Checkbox inside, a button. */}
      <label
        className={`no-drag flex min-w-0 items-start gap-2 select-none ${disabled ? 'opacity-40' : ''}`}
      >
        {/* The box sits on the first line of the words: the 16px box in a 20px line. */}
        <span className="flex h-5 shrink-0 items-center">
          <Checkbox
            label={label}
            aria-labelledby={labelId}
            aria-describedby={message === undefined ? undefined : messageId}
            aria-invalid={shownError === undefined ? undefined : true}
            aria-required={required ? true : undefined}
            checked={checked}
            onCheckedChange={onCheckedChange}
            {...(disabled ? { disabled } : {})}
          />
        </span>
        <span className="flex min-w-0 flex-col">
          <span id={labelId} className="text-[13px] text-fg leading-5">
            {label}
          </span>
          {shownError === undefined && message !== undefined ? (
            <span id={messageId} className="text-[12px] text-muted">
              {message}
            </span>
          ) : null}
        </span>
      </label>
      {shownError === undefined ? null : (
        <p id={messageId} role="alert" className="m-0 ps-6 text-[12px] text-danger">
          {shownError}
        </p>
      )}
    </div>
  )
}
