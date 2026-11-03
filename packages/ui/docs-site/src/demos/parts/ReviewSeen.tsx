import type { ReactNode } from 'react'
import { Checkbox } from '../../../../src'
import { Missing } from '../../demo-kit/Missing'

/**
 * "Gezien" beside a file of the review: a checkbox with its word visible, as the missing
 * `CheckboxField` would draw it. A `label` around both, so a click on the word ticks the box.
 */
export function ReviewSeen({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange(checked: boolean): void
}): ReactNode {
  return (
    <Missing name="CheckboxField" inline className="shrink-0">
      {/* biome-ignore lint/a11y/noLabelWithoutControl: the control is the Checkbox inside, a button. */}
      <label className="flex cursor-default select-none items-center gap-1.5 px-1 py-0.5">
        <Checkbox label="Gezien" checked={checked} onCheckedChange={onCheckedChange} />
        <span aria-hidden="true" className="text-[12.5px] text-secondary">
          Gezien
        </span>
      </label>
    </Missing>
  )
}
