import { type ReactNode, useId } from 'react'
import { Icon } from '../../../../src'
import { Missing } from '../../demo-kit/Missing'

/**
 * A form field as a sign-in or invite form needs it, label above the control, drawn as the
 * missing `FormField`: `Field` lays its label out to the left, as a row of the settings.
 *
 * The control gets the label's id, so it is named by the visible text as a real field would be.
 * An `error` replaces the hint and is announced with the field.
 */
export function FormFieldSketch({
  label,
  hint,
  error,
  aside,
  children,
}: {
  label: string
  hint?: string
  error?: string
  /** Something at the right of the label: "Wachtwoord vergeten?". */
  aside?: ReactNode
  children(labelId: string): ReactNode
}): ReactNode {
  const id = useId()
  return (
    <Missing name="FormField" className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-2">
        <span id={id} className="font-medium text-[12.5px] text-fg">
          {label}
        </span>
        {aside}
      </span>
      {children(id)}
      {error !== undefined ? (
        <span role="alert" className="flex items-center gap-1.5 text-[12px] text-danger">
          <Icon name="alert-triangle" size="sm" />
          {error}
        </span>
      ) : hint !== undefined ? (
        <span className="text-[12px] text-muted">{hint}</span>
      ) : null}
    </Missing>
  )
}
