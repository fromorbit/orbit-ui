import { useId } from 'react'
import { Icon } from './Icon'

/** The props of `ChoiceRow`. */
export interface ChoiceRowProps {
  /** `radio` for one of several, `checkbox` for any number: the mark and the role follow. */
  kind: 'radio' | 'checkbox'
  /** The number a digit key picks this row with (1–9), drawn quietly in front; none when absent. */
  number?: number
  label: string
  /** A quiet tag behind the label, already translated ("Aanbevolen"); part of the row's name. */
  tag?: string
  /** A line under the label. */
  description?: string
  checked: boolean
  /** Whether this row is the tab stop of its list (roving tabindex); the others take -1. */
  tabbable: boolean
  onChoose(): void
  /** The row got the focus or the pointer: the caller may show what belongs to it (a preview). */
  onActive?(): void
}

/**
 * One option of a question as a full-width row: a number, the label with an optional tag, and a
 * line under it; a checkbox has its square in front of the label, a chosen radio a check at the end.
 *
 * No round mark for a radio: the number already carries the key that picks it, and
 * number plus circle were two signs for one thing. The square of a checkbox stays, because it is
 * what says "any number of these"; a chosen row also keeps the plane of `surface-hover`.
 *
 * Its own control rather than `RadioGroup`/`Checkbox`, because the question card needs what those
 * do not give: one look for a single and a multiple choice in one list, the number a digit picks,
 * a tag inside the accessible name, and a roving tab stop the card moves with ↑ ↓ — without Radix'
 * arrow handling, whose ← → would take the keys the card walks its questions with. Enter is left
 * to the caller (the register's `question.confirm`), Space clicks it as on any button.
 */
export function ChoiceRow({
  kind,
  number,
  label,
  tag,
  description,
  checked,
  tabbable,
  onChoose,
  onActive,
}: ChoiceRowProps) {
  const labelId = useId()
  const descriptionId = useId()
  // The role and its state in one object: a radio and a checkbox share every other attribute,
  // and one element keeps the bundle from carrying the row twice.
  const shared = {
    type: 'button' as const,
    role: kind,
    'aria-checked': checked,
    'aria-labelledby': labelId,
    'aria-describedby': description === undefined ? undefined : descriptionId,
    'data-nt-choice': '',
    tabIndex: tabbable ? 0 : -1,
    onClick: onChoose,
    onFocus: onActive,
    onMouseEnter: onActive,
    className:
      'no-drag flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left outline-focus transition-colors duration-100 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] aria-checked:bg-surface-hover',
  }
  return (
    <button {...shared}>
      <span aria-hidden="true" className="mt-px w-3 shrink-0 font-mono text-[12px] text-muted">
        {number ?? ''}
      </span>
      {kind === 'checkbox' ? (
        <span
          aria-hidden="true"
          className={[
            'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border',
            checked ? 'border-accent bg-accent text-accent-fg' : 'border-border',
          ].join(' ')}
        >
          {checked ? <Icon name="check" size="xs" /> : null}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span id={labelId} className="text-fg">
          {label}
          {tag === undefined ? null : (
            <>
              {' '}
              <span
                data-nt-choice-tag
                className="ms-1 rounded-sm border border-border px-1.5 align-middle text-[11px] text-muted"
              >
                {tag}
              </span>
            </>
          )}
        </span>
        {description === undefined ? null : (
          <span id={descriptionId} className="text-[12px] text-muted">
            {description}
          </span>
        )}
      </span>
      {checked && kind === 'radio' ? (
        <span aria-hidden="true" className="mt-0.5 flex shrink-0 text-accent-text">
          <Icon name="check" size="sm" />
        </span>
      ) : null}
    </button>
  )
}
