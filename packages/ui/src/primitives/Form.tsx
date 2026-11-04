import type { FormEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

/** The props of `Form`. */
export interface FormProps {
  /**
   * Called on submit (Enter in a field, or a `type="submit"` button), with the browser's own
   * submit already prevented. The caller checks the values and sets the `error` of each
   * `FormField`; the first field that then says `aria-invalid` gets the focus.
   */
  onSubmit(event: FormEvent<HTMLFormElement>): void
  /** The accessible name of the form, when no heading names it. */
  label?: string
  /** While the answer is on its way: `aria-busy`, so a screen reader waits for the result. */
  busy?: boolean
  /** The fields, as `FormField`s. */
  children: ReactNode
  /** The buttons under the fields, in a row; the submit button is one of them. */
  actions?: ReactNode
}

/** Every control that a check marked as wrong, in document order. */
const INVALID = '[aria-invalid="true"]'

/**
 * A form of `FormField`s, stacked, with its buttons below.
 *
 * The browser's own checks are off (`noValidate`): their bubbles speak the language of the
 * browser, not the app's, and cannot be styled. The app checks the values in `onSubmit` and
 * hands each field its error; the form then moves the focus to the first field that failed,
 * which is what WCAG 3.3.1 asks for and what a reader expects after pressing Enter. The focus moves
 * once per submit, never while typing: a field that turns invalid as the reader types keeps the
 * caret where it is.
 */
export function Form({ onSubmit, label, busy = false, children, actions }: FormProps) {
  const form = useRef<HTMLFormElement>(null)
  const [submits, setSubmits] = useState(0)

  // After the render that the caller's errors cause: the effect of the submit's own state change
  // runs once the fields have their `aria-invalid`.
  useEffect(() => {
    if (submits === 0) return
    form.current?.querySelector<HTMLElement>(INVALID)?.focus()
  }, [submits])

  return (
    <form
      ref={form}
      noValidate
      aria-label={label}
      aria-busy={busy || undefined}
      className="flex min-w-0 flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(event)
        setSubmits((count) => count + 1)
      }}
    >
      {children}
      {actions === undefined ? null : (
        <div data-nt-form-actions className="flex flex-wrap items-center gap-2 pt-1">
          {actions}
        </div>
      )}
    </form>
  )
}
