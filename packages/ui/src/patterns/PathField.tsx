import { useRef } from 'react'
import { Tooltip } from '../overlays/Tooltip'
import { Button } from '../primitives/Button'
import { IconButton } from '../primitives/IconButton'
import { PathLabel } from './PathLabel'

/** The props of `PathField`. */
export interface PathFieldProps {
  /** Names the group of path, "Kies…" and cross; a row's `aria-labelledby` wins. */
  label: string
  /** The chosen path, or `null` for none. */
  value: string | null
  /** Asks the host for a path (its own dialog); storing it is the caller's job. */
  onChoose(): unknown
  /** Forgets the path; the cross only shows with a path, this and `clearLabel` given. */
  onClear?(): void
  /** The name and tooltip of the cross: "Wissen". */
  clearLabel?: string
  /** The words of the button that asks for a path: "Kies…". */
  chooseLabel: string
  /** What an empty field means: "Niet gekozen", or "Uit PATH" where that is what empty does. */
  placeholder: string
  disabled?: boolean
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

/**
 * A path chosen through the host's dialog: the path (cut in the middle by `PathLabel`) or quiet
 * words for none, a `Button sm` "Kies…" and a cross.
 *
 * Words on the button rather than a lone folder icon: a row with a field of its own reads as
 * "type here", and the path is never typed. A placeholder of the caller says what empty means,
 * without a sentence of explanation.
 */
export function PathField({
  label,
  value,
  onChoose,
  onClear,
  clearLabel,
  chooseLabel,
  placeholder,
  disabled,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
}: PathFieldProps) {
  const choose = useRef<HTMLButtonElement>(null)
  return (
    <fieldset
      aria-label={label}
      {...(labelledBy ? { 'aria-labelledby': labelledBy } : {})}
      {...(describedBy ? { 'aria-describedby': describedBy } : {})}
      className="no-drag m-0 flex min-w-0 items-center gap-2 border-0 p-0"
    >
      {value === null ? (
        <span className="text-[12px] text-muted">{placeholder}</span>
      ) : (
        <span className="flex min-w-0 text-fg">
          <PathLabel path={value} />
        </span>
      )}
      <Button ref={choose} size="sm" variant="secondary" disabled={disabled} onClick={onChoose}>
        {chooseLabel}
      </Button>
      {value !== null && onClear && clearLabel !== undefined ? (
        <Tooltip label={clearLabel}>
          <IconButton
            icon="x"
            label={clearLabel}
            size="sm"
            disabled={disabled}
            onClick={() => {
              onClear()
              choose.current?.focus()
            }}
          />
        </Tooltip>
      ) : null}
    </fieldset>
  )
}
