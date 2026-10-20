import type { KeyboardEvent, Ref } from 'react'
import { Tooltip } from '../overlays/Tooltip'
import { Icon, type IconName } from '../primitives/Icon'
import { Kbd } from '../primitives/Kbd'
import type { ShortcutLabel } from '../primitives/shortcut'
import { useUi } from '../provider/UiProvider'

/** A key pressed on the card, handed to the list it stands in. */
type CardKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => void

/** What {@link ChoiceCard} draws and does. */
export interface ChoiceCardProps {
  icon: IconName
  /** The name of the choice; also the card's accessible name. */
  title: string
  /**
   * The command whose key stands at the right end; the letter of the host's catalogue, read by id
   * through its `ShortcutPort`.
   */
  shortcut?: ShortcutLabel
  /** Dimmed: still focusable, so the reason can be read, but choosing does nothing. */
  disabled?: boolean
  /** Why it is dimmed, in a tooltip; only with `disabled`. */
  reason?: string
  /** Set by the list the card stands in: one card of the group is the tab stop. */
  tabIndex?: number
  onClick?(): void
  onKeyDown?: CardKeyDown
  onFocus?(): void
  ref?: Ref<HTMLButtonElement>
}

/**
 * One choice as a card of one row: icon, name, and the key that makes the same choice.
 *
 * A fill rather than a border, one step lighter than the panel it lies on and another step on hover
 * and focus: the app draws no outlines around things, and a card of 32px is
 * a row of a list, not a box on a page. A dimmed card stays in its place and in the focus order —
 * a list that never changes shape is calmer than one that grows when a kind becomes available —
 * with `aria-disabled` rather than `disabled`, so it can still be reached and tell why.
 */
export function ChoiceCard({
  icon,
  title,
  shortcut,
  disabled = false,
  reason,
  tabIndex,
  ref,
  onClick,
  onKeyDown,
  onFocus,
}: ChoiceCardProps) {
  const { shortcuts } = useUi()
  const keys = shortcut === undefined ? undefined : shortcuts.aria(shortcut)
  const card = (
    <button
      ref={ref}
      type="button"
      // The title alone: the key is announced as a key (`aria-keyshortcuts`), not as part of the
      // name, so "Wijzigingen" is found and read as "Wijzigingen".
      aria-label={title}
      {...(keys === undefined ? {} : { 'aria-keyshortcuts': keys })}
      {...(disabled ? { 'aria-disabled': true } : {})}
      {...(tabIndex === undefined ? {} : { tabIndex })}
      onClick={() => {
        if (!disabled) onClick?.()
      }}
      {...(onKeyDown ? { onKeyDown } : {})}
      {...(onFocus ? { onFocus } : {})}
      className="no-drag flex h-(--nt-control-lg) w-full items-center gap-2 rounded-md bg-surface px-3 text-left outline-focus hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:opacity-40"
    >
      <span className="flex shrink-0 text-muted">
        <Icon name={icon} size="sm" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg">{title}</span>
      {shortcut === undefined ? null : <Kbd shortcut={shortcut} tone="quiet" />}
    </button>
  )
  return disabled && reason ? <Tooltip label={reason}>{card}</Tooltip> : card
}
