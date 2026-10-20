import { type FocusEvent, type KeyboardEvent, useId, useRef, useState } from 'react'
import type { ControlSize } from './control-size'
import { IconButton } from './IconButton'
import { Input } from './Input'

/** The words of a `SecretField`, in the host's language. */
export interface SecretFieldLabels {
  /** The field's description for a screen reader while a value is stored: "Ingesteld". */
  set: string
  /** The placeholder while none is: "Niet ingesteld". */
  unset: string
  /** The eye that shows what is typed: "Toon wat je typt". */
  show: string
  /** The cross that wipes the stored value: "Wissen". Only drawn with `onClear`. */
  clear: string
}

/** The props of `SecretField`. */
export interface SecretFieldProps {
  /** Accessible name of the field; a row's `aria-labelledby` wins over it. */
  label: string
  /**
   * The words of the field's state and its buttons, in the host's language; the library holds
   * none.
   */
  labels: SecretFieldLabels
  /** Whether a value is stored. Core never sends the value itself back. */
  isSet: boolean
  /**
   * Stores what was typed, trimmed. May resolve to a refusal in words; the field empties either
   * way — a refused secret is not kept on screen either. Showing the refusal is the row's job.
   */
  onSave(value: string): unknown
  /** Wipes the stored value; the cross only shows while `isSet` and when this is given. */
  onClear?(): void
  maxLength?: number
  disabled?: boolean
  size?: ControlSize
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

/** What a stored secret shows: a fixed row of dots, never the length of the value itself. */
const SET_DOTS = '••••••••••••'

/**
 * One control for a secret: a password field that looks filled while a value is stored, saves on
 * Enter or on leaving it, an eye to see what is being typed, and a cross to wipe the stored value.
 *
 * A stored value shows as a fixed row of dots in the text colour (so you see
 * at once that it is filled in), which the caret replaces: with the focus in the field the
 * dots go, and what is typed replaces the stored value. The word "Ingesteld" is the field's
 * description for a screen reader, which reads no dots. Empty, the placeholder says "Niet
 * ingesteld".
 *
 * It replaces the three controls of the old row (a status word, a field and a lone "Opslaan" — the
 * only save button on a screen that otherwise saves at once). Write-only: the
 * field starts empty every time and empties again after a save, because there is never a value to
 * show: a stored secret never travels back to the interface. "Leaving" means leaving the whole field: tabbing from the text to its own eye
 * saves nothing, so a half-typed key is never stored because the user wanted to check it.
 */
export function SecretField({
  label,
  labels,
  isSet,
  onSave,
  onClear,
  maxLength,
  disabled,
  size,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
}: SecretFieldProps) {
  const [draft, setDraft] = useState('')
  const [shown, setShown] = useState(false)
  const [focused, setFocused] = useState(false)
  const stateId = useId()
  const input = useRef<HTMLInputElement>(null)
  const frame = useRef<HTMLSpanElement>(null)

  function save() {
    const value = draft.trim()
    setDraft('')
    setShown(false)
    if (value !== '') void onSave(value)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') save()
  }

  function onBlur(event: FocusEvent<HTMLSpanElement>) {
    const next = event.relatedTarget
    if (next instanceof Node && frame.current?.contains(next)) return
    setFocused(false)
    // The window itself lost focus (another app, a password manager): the user is still typing
    // here, and the caret comes back to this field; saving now would store half a key.
    if (!document.hasFocus()) return
    save()
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: listens for the focus leaving the field and its own buttons together; the span itself is never interactive.
    <span ref={frame} onBlur={onBlur} onFocus={() => setFocused(true)} className="inline-flex">
      {isSet ? (
        <span id={stateId} className="sr-only">
          {labels.set}
        </span>
      ) : null}
      <Input
        ref={input}
        label={label}
        {...(labelledBy ? { 'aria-labelledby': labelledBy } : {})}
        {...(describedBy || isSet
          ? {
              'aria-describedby': [describedBy, isSet ? stateId : undefined]
                .filter(Boolean)
                .join(' '),
            }
          : {})}
        type={shown ? 'text' : 'password'}
        autoComplete="off"
        spellCheck={false}
        placeholder={isSet ? (focused ? '' : SET_DOTS) : labels.unset}
        placeholderFilled={isSet}
        value={draft}
        {...(maxLength !== undefined ? { maxLength } : {})}
        disabled={disabled}
        {...(size ? { size } : {})}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        trailing={
          <span className="-mr-1.5 flex shrink-0 items-center">
            <IconButton
              icon={shown ? 'eye-off' : 'eye'}
              label={labels.show}
              aria-pressed={shown}
              size="sm"
              disabled={disabled}
              // Keeps the caret in the field while the pointer flips what it shows.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setShown((now) => !now)}
            />
            {isSet && onClear ? (
              <IconButton
                icon="x"
                label={labels.clear}
                size="sm"
                disabled={disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onClear()
                  input.current?.focus()
                }}
              />
            ) : null}
          </span>
        }
      />
    </span>
  )
}
