import type { ReactNode } from 'react'
import { CheckboxField } from '../../../../src'

/** "Gezien" beside a file of the review: a box with its word, clickable as a whole. */
export function ReviewSeen({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange(checked: boolean): void
}): ReactNode {
  return (
    <span className="shrink-0">
      <CheckboxField label="Gezien" checked={checked} onCheckedChange={onCheckedChange} />
    </span>
  )
}
