import { cva } from 'class-variance-authority'
import { type KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { useUi } from '../provider/UiProvider'
import type { ControlSize } from './control-size'
import { controlSize } from './control-size'

/**
 * The bordered input: it takes what the 160px field leaves after the unit, which stands outside
 * its border: the unit is a suffix, not part of the number.
 */
const frame = cva(
  'no-drag inline-flex min-w-0 flex-1 items-center rounded-md border border-border bg-surface px-2 text-fg outline-focus focus-within:border-accent-border focus-within:outline-2 focus-within:outline-offset-2 has-[:disabled]:opacity-40',
  {
    variants: { size: controlSize },
    defaultVariants: { size: 'md' },
  },
)

/** The props of `NumberField`. */
export interface NumberFieldProps {
  /** Accessible name; the visible label lives in the surrounding row. */
  label: string
  value: number
  min: number
  max: number
  /** Shown after the field, outside its border, e.g. "min". */
  unit?: string
  size?: ControlSize
  disabled?: boolean
  onCommit(value: number): void
  /**
   * Set by `Field`: per the ARIA accessible-name computation this wins over `label`'s
   * `aria-label`, so the field's name becomes the row's own visible label text.
   */
  'aria-labelledby'?: string | undefined
  /** Set by `Field`, pointing at its description or error text. */
  'aria-describedby'?: string | undefined
}

/**
 * Whole-number input that commits on blur or Enter, never per keystroke.
 *
 * Typing "12" passes through "1"; committing every keystroke would save a value the user never
 * meant. Out-of-range input is clamped and anything unparsable restores the last value.
 *
 * At rest the value carries thousands separators ("200.000"); while it is edited it is the plain
 * digits. A text input with the spinbutton role, as a number input cannot show a separator. The
 * whole field is 160px wide, so a column of them ends on one line, with or without a unit.
 */
export function NumberField({
  label,
  value,
  min,
  max,
  unit,
  size,
  disabled,
  onCommit,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: NumberFieldProps) {
  // The host's language from `UiProvider`, so "200.000" follows the app rather than the system.
  const { locale } = useUi()
  const [draft, setDraft] = useState(String(value))
  const [editing, setEditing] = useState(false)
  const format = useMemo(() => new Intl.NumberFormat(locale), [locale])

  useEffect(() => setDraft(String(value)), [value])

  const parse = (text: string) => Number.parseInt(text.replace(/[^\d-]/g, ''), 10)
  const clamp = (number: number) => Math.min(max, Math.max(min, number))

  function commit() {
    setEditing(false)
    const parsed = parse(draft)
    if (Number.isNaN(parsed)) {
      setDraft(String(value))
      return
    }
    const clamped = clamp(parsed)
    setDraft(String(clamped))
    if (clamped !== value) onCommit(clamped)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur()
    // The arrow keys step the value, as the spin buttons of a number input did.
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const current = parse(draft)
      const base = Number.isNaN(current) ? value : current
      setDraft(String(clamp(base + (event.key === 'ArrowUp' ? 1 : -1))))
    }
  }

  const shown = editing || Number.isNaN(parse(draft)) ? draft : format.format(parse(draft))
  return (
    <span data-nt-number-field className="no-drag inline-flex w-40 shrink-0 items-center gap-2">
      <span className={frame({ size })}>
        <input
          type="text"
          role="spinbutton"
          inputMode="numeric"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={label}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          value={shown}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          // The draft always holds plain digits; only what is shown at rest is formatted.
          onFocus={() => setEditing(true)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-right text-fg tabular-nums outline-none"
        />
      </span>
      {unit ? <span className="w-10 shrink-0 text-[12px] text-muted">{unit}</span> : null}
    </span>
  )
}
