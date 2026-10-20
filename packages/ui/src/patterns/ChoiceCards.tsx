import { type KeyboardEvent, useRef, useState } from 'react'
import type { IconName } from '../primitives/Icon'
import type { ShortcutLabel } from '../primitives/shortcut'
import { ChoiceCard } from './ChoiceCard'

/** One card of {@link ChoiceCards}; the text comes from the caller, as a pattern never reads the catalogue. */
export interface ChoiceCardItem {
  id: string
  icon: IconName
  title: string
  /** The command whose key the card shows; see `ChoiceCard`. */
  shortcut?: ShortcutLabel
  disabled?: boolean
  /** Why it is dimmed; only with `disabled`. */
  reason?: string
}

/** The props of `ChoiceCards`. */
export interface ChoiceCardsProps {
  /** The name of the group, for assistive tech; no heading is drawn. */
  label: string
  items: readonly ChoiceCardItem[]
  /** Called with the id of an enabled card that was clicked or chosen with Enter or space. */
  onChoose(id: string): void
}

/**
 * A short list of choices as cards in one column, walked with the arrow keys.
 *
 * **One tab stop** (roving tabindex): Tab reaches the list once, ↑ and ↓ walk it — dimmed cards
 * included, so they can say why — Home and End reach its ends, and Enter or space choose, which a
 * `button` does by itself. Letters are not this pattern's business: they belong to the register
 * of shortcuts, and the caller hangs them on the cards through `shortcut`.
 *
 * 8px between the cards: 4px, measured off a reference picture, set them too close to read as
 * separate choices.
 */
export function ChoiceCards({ label, items, onChoose }: ChoiceCardsProps) {
  const [current, setCurrent] = useState(0)
  const cards = useRef<(HTMLButtonElement | null)[]>([])
  // A list that shrank keeps a tab stop: the last card when the one that had it is gone.
  const stop = Math.min(current, items.length - 1)

  function move(to: number): void {
    const next = Math.max(0, Math.min(items.length - 1, to))
    setCurrent(next)
    cards.current[next]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, at: number): void {
    const target =
      event.key === 'ArrowDown'
        ? at + 1
        : event.key === 'ArrowUp'
          ? at - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? items.length - 1
              : null
    if (target === null) return
    event.preventDefault()
    move(target)
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would draw a border and a legend, and these cards are a group of buttons, not form fields.
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      {items.map((item, at) => (
        <ChoiceCard
          key={item.id}
          ref={(element) => {
            cards.current[at] = element
          }}
          icon={item.icon}
          title={item.title}
          {...(item.shortcut === undefined ? {} : { shortcut: item.shortcut })}
          {...(item.disabled ? { disabled: true } : {})}
          {...(item.reason === undefined ? {} : { reason: item.reason })}
          tabIndex={at === stop ? 0 : -1}
          onFocus={() => setCurrent(at)}
          onKeyDown={(event) => onKeyDown(event, at)}
          onClick={() => onChoose(item.id)}
        />
      ))}
    </div>
  )
}
