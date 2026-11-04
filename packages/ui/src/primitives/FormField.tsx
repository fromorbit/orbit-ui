import type { ReactNode } from 'react'
import { useId } from 'react'
import { Icon } from './Icon'

/** Blank text is no text: an empty `description` or `error` must not become an empty line. */
function present(text: string | undefined): string | undefined {
  return text === undefined || text.trim() === '' ? undefined : text
}

/**
 * What `FormField` hands its control: spread it onto any control of the library (`Input`,
 * `Textarea`, `Select`, `Combobox`, `OtpInput`, …), which passes each attribute on to its native
 * element.
 */
export interface FormFieldControl {
  /** The control's id; the visible `<label>` points at it with `for`, so a click focuses it. */
  id: string
  /** The visible label, which wins over the control's own `aria-label`. */
  'aria-labelledby': string
  /** The error while there is one, else the description; `undefined` when there is neither. */
  'aria-describedby': string | undefined
  /** `true` while the field shows an error, so the control draws its danger border. */
  'aria-invalid': true | undefined
  /** `true` for a field that must be filled. */
  'aria-required': true | undefined
}

/** The props of `FormField`. */
export interface FormFieldProps {
  /** The visible label above the control, and the control's accessible name. */
  label: string
  /** A line under the control that helps to fill it in. */
  description?: string
  /**
   * What is wrong with the value: shown instead of the description, with a warning sign, and
   * announced (`role="alert"`). The control gets `aria-invalid`.
   */
  error?: string
  /** The field must be filled: the control gets `aria-required`. */
  required?: boolean
  /**
   * A word beside the label for a field that may stay empty ("optioneel"), the calmer way to mark
   * a form where most fields are required. Hidden from a screen reader, which hears that from
   * the absence of `aria-required`.
   */
  optionalLabel?: string
  /** Something at the right of the label, such as a link "Wachtwoord vergeten?". */
  aside?: ReactNode
  /** The control, wired with the props in {@link FormFieldControl}. */
  children(control: FormFieldControl): ReactNode
}

/**
 * One field of a form: the label above the control, a description or error below it.
 *
 * Where `Field` is a row of the settings (label left, control right), this is the shape of a
 * sign-in, an invite or a billing form, where fields stand under each other. The wiring is the
 * same idea: the control is named by the visible label (`aria-labelledby`) and described by the
 * line below it (`aria-describedby`), so a screen reader hears "E-mailadres, ongeldig, Vul een
 * geldig e-mailadres in" when it reaches the field. The label is a real `<label for>`, so a click
 * on it focuses the control.
 *
 * The error replaces the description rather than standing under it: one line below a field keeps
 * a form from jumping as the reader types. It is a live region of its own (`role="alert"`), so a
 * message that appears after a check is heard without moving the focus.
 */
export function FormField({
  label,
  description,
  error,
  required = false,
  optionalLabel,
  aside,
  children,
}: FormFieldProps) {
  const id = useId()
  const labelId = useId()
  const messageId = useId()
  const shownError = present(error)
  const shownDescription = present(description)
  const describedBy = shownError ?? shownDescription
  return (
    <div data-nt-form-field className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label id={labelId} htmlFor={id} className="font-medium text-[13px] text-fg">
          {label}
          {!required && optionalLabel !== undefined ? (
            <span aria-hidden="true" className="ms-1.5 font-normal text-[12px] text-muted">
              {optionalLabel}
            </span>
          ) : null}
        </label>
        {aside}
      </div>
      {children({
        id,
        'aria-labelledby': labelId,
        'aria-describedby': describedBy === undefined ? undefined : messageId,
        'aria-invalid': shownError === undefined ? undefined : true,
        'aria-required': required ? true : undefined,
      })}
      {shownError !== undefined ? (
        <p
          id={messageId}
          role="alert"
          className="m-0 flex items-center gap-1.5 text-[12px] text-danger"
        >
          <Icon name="alert-triangle" size="sm" />
          {shownError}
        </p>
      ) : shownDescription !== undefined ? (
        <p id={messageId} className="m-0 text-[12px] text-muted">
          {shownDescription}
        </p>
      ) : null}
    </div>
  )
}
