import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react'
import { Input } from '../primitives/Input'
import { Chip } from './Chip'

/** The words of a `ChipListField`, in the host's language. */
export interface ChipListFieldLabels {
  /** The placeholder of the field that adds: "Toevoegen…". */
  add: string
  /** The name of the cross on a chip: "Haal webshop weg". */
  remove(item: string): string
  /** Why an item that is already there is not added again: "webshop staat er al". */
  duplicate(item: string): string
}

/** The props of `ChipListField`. */
export interface ChipListFieldProps {
  /** Names the list of chips and the field that adds to it; a row's `aria-labelledby` wins. */
  label: string
  /** The words of the field and its chips, in the host's language; the library holds none. */
  labels: ChipListFieldLabels
  value: readonly string[]
  /**
   * Stores the whole new list. May resolve to a refusal in words: the list then stays as it was,
   * the draft stays in the field, and the reason stands under it.
   */
  onChange(next: readonly string[]): unknown
  /** The most items the list holds; at the limit the field to add goes away. */
  maxItems: number
  /** The longest one item may be, as `maxlength` of the field. */
  maxLength: number
  /** The fewest items it keeps: below it, the crosses of the last ones are gone. */
  minItems?: number
  /**
   * Why an item may not be added, in words, or `undefined` when it may. The feature maps a
   * field's `format` (`host`, `origin`) onto this; the building block knows no formats.
   */
  check?(item: string): string | undefined
  disabled?: boolean
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

/**
 * A list of short values as chips on a line that wraps, with the field to add one at its end.
 *
 * Replaces the right-aligned column of words with a cross each: one word per row
 * read as a column of settings, not as a list of values. Enter adds,
 * Backspace in an empty field picks the last chip back up to edit; a duplicate, a `check` or a
 * refusal of the caller is never dropped silently — the reason stands under the field, which keeps
 * the draft until the next keystroke. After a cross the focus goes on to the next chip's cross,
 * or back to the field.
 */
export function ChipListField({
  label,
  labels,
  value,
  onChange,
  maxItems,
  maxLength,
  minItems = 0,
  check,
  disabled,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
}: ChipListFieldProps) {
  const [draft, setDraft] = useState('')
  const [reason, setReason] = useState<string>()
  const reasonId = useId()
  const list = useRef<HTMLUListElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const focusAfter = useRef<number | null>(null)

  // After a removal (or adding the last item that fits), once the new list has rendered: the
  // cross now at that place, else the field.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new list is the signal; the focus target is read from the DOM it rendered.
  useEffect(() => {
    const index = focusAfter.current
    if (index === null) return
    focusAfter.current = null
    const crosses = list.current?.querySelectorAll<HTMLButtonElement>('button') ?? []
    const target = crosses[index] ?? crosses[crosses.length - 1]
    if (target) target.focus()
    else field.current?.focus()
  }, [value])

  async function add() {
    const item = draft.trim()
    if (item === '' || value.length >= maxItems) return
    if (value.includes(item)) {
      setReason(labels.duplicate(item))
      return
    }
    const refused = check?.(item)
    if (refused !== undefined) {
      setReason(refused)
      return
    }
    // The last item that fits takes the field away with it: the focus then goes to its own cross,
    // once the new list has rendered, instead of falling back to the top of the page.
    const fills = value.length + 1 >= maxItems
    if (fills) focusAfter.current = value.length
    const answer = await onChange([...value, item])
    if (typeof answer === 'string') {
      if (fills) focusAfter.current = null
      setReason(answer)
      return
    }
    if (fills) return
    setDraft('')
    field.current?.focus()
  }

  async function remove(index: number) {
    focusAfter.current = index
    const answer = await onChange(value.filter((_, at) => at !== index))
    if (typeof answer === 'string') {
      focusAfter.current = null
      setReason(answer)
    }
  }

  async function pickUpLast() {
    const last = value.at(-1)
    if (last === undefined || value.length <= minItems) return
    const answer = await onChange(value.slice(0, -1))
    if (typeof answer === 'string') setReason(answer)
    else setDraft(last)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      void add()
    } else if (event.key === 'Backspace' && draft === '') {
      event.preventDefault()
      void pickUpLast()
    }
  }

  const removable = value.length > minItems
  const fieldDescribedBy =
    [describedBy, reason === undefined ? undefined : reasonId].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className="flex min-w-0 flex-col items-end gap-1">
      <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-1">
        {value.length === 0 ? null : (
          <ul
            ref={list}
            aria-label={label}
            {...(labelledBy ? { 'aria-labelledby': labelledBy } : {})}
            className="m-0 flex min-w-0 list-none flex-wrap justify-end gap-1 p-0"
          >
            {value.map((item, index) => (
              <li key={item} className="flex min-w-0">
                <Chip
                  label={item}
                  {...(removable
                    ? {
                        remove: {
                          label: labels.remove(item),
                          onRemove: () => void remove(index),
                          ...(disabled ? { disabled: true } : {}),
                        },
                      }
                    : {})}
                />
              </li>
            ))}
          </ul>
        )}
        {value.length >= maxItems ? null : (
          <Input
            ref={field}
            label={label}
            {...(labelledBy ? { 'aria-labelledby': labelledBy } : {})}
            {...(fieldDescribedBy ? { 'aria-describedby': fieldDescribedBy } : {})}
            placeholder={labels.add}
            value={draft}
            maxLength={maxLength}
            disabled={disabled}
            onChange={(event) => {
              setDraft(event.target.value)
              setReason(undefined)
            }}
            onKeyDown={onKeyDown}
          />
        )}
      </div>
      {reason === undefined ? null : (
        <p id={reasonId} role="alert" className="m-0 text-[12px] text-danger">
          {reason}
        </p>
      )}
    </div>
  )
}
