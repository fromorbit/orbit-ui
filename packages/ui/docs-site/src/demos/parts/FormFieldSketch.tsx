import { type ReactNode, useId } from 'react'
import { Missing } from '../../demo-kit/Missing'

/**
 * A form field as a sign-in or invite form needs it, label above the control, drawn as the
 * missing `FormField`: `Field` lays its label out to the left, as a row of the settings.
 *
 * The control gets the label's id, so it is named by the visible text as a real field would be.
 */
export function FormFieldSketch({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children(labelId: string): ReactNode
}): ReactNode {
  const id = useId()
  return (
    <Missing name="FormField">
      <span id={id} className="text-[12px] font-medium text-secondary">
        {label}
      </span>
      {children(id)}
      {hint === undefined ? null : <span className="text-[12px] text-muted">{hint}</span>}
    </Missing>
  )
}
