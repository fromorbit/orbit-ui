import { type ReactNode, useId } from 'react'
import { Checkbox } from '../../../../src'

/**
 * "Gezien" beside a file of the review: a box with its word in one 28px row, clickable as a whole.
 * Named by the file as well ("Gezien: src/kassa/IdealKeuze.tsx"), so a screen reader going through
 * the files hears which one it ticks; the visible word starts the name, for voice control.
 */
export function ReviewSeen({
  path,
  checked,
  onCheckedChange,
}: {
  path: string
  checked: boolean
  onCheckedChange(checked: boolean): void
}): ReactNode {
  const id = useId()
  return (
    // The whole row is the label of the box, so a click anywhere on its 28px toggles it.
    <label
      htmlFor={id}
      className="no-drag flex h-7 shrink-0 cursor-pointer items-center gap-2 rounded-md px-1.5 text-[13px] text-fg select-none hover:bg-surface"
    >
      <Checkbox
        id={id}
        label={`Gezien: ${path}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      Gezien
    </label>
  )
}
