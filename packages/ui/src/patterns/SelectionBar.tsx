import type { ReactNode } from 'react'
import { Tooltip } from '../overlays/Tooltip'
import { Button } from '../primitives/Button'
import { Kbd } from '../primitives/Kbd'
import type { ShortcutLabel } from '../primitives/shortcut'

/** Where a floating bar stands, in pixels against its positioned parent. */
export interface SelectionBarPlace {
  top: number
  left: number
}

/** The frame of the bar and the fields beside a selection: a small floating layer of its own. */
export const SELECTION_FLOATING =
  'no-drag nt-fade-in absolute z-(--nt-z-popover) rounded-lg border border-border bg-overlay shadow-menu'

/** The props of `SelectionBar`. */
export interface SelectionBarProps {
  at: SelectionBarPlace
  /** Why a comment cannot be placed now (unsaved work, a full document), or `null` when it can. */
  commentDisabled?: string | null
  /** Why the selection cannot be sent along now (a full row), or `null` when it can. */
  sendDisabled?: string | null
  /**
   * Opmerking: opens the field for a comment under the selection. Left out for a document that has
   * no comments (an artifact: E-ART-66), and the bar then holds Meesturen alone.
   */
  onComment?(): void
  /** The name of the bar as a group: "Selectie". */
  label: string
  /** The words of the comment button: "Opmerking". The button shows with this and `onComment`. */
  commentLabel?: string
  /** The words of the send button: "Meesturen", or "Nieuwe chat met dit fragment". */
  sendLabel: string
  /** The command whose key stands beside the comment button; no key without it. */
  commentShortcut?: ShortcutLabel
  /** The command whose key stands beside the send button; no key without it. */
  sendShortcut?: ShortcutLabel
  /** Meesturen: the selection as a chip in the composer of the chat of the document. */
  onSendAlong(): void
  /**
   * Instead of the two buttons, while something else asks for the selection — a loose comment
   * waiting for its new place in a markdown tab.
   */
  children?: ReactNode
}

/** One button of the bar, off with its reason as a tooltip rather than gone. */
function BarButton({
  children,
  disabled,
  onPress,
}: {
  children: ReactNode
  disabled: string | null
  onPress(): void
}) {
  const button = (
    <Button
      variant="ghost"
      size="sm"
      {...(disabled === null ? {} : { 'aria-disabled': true })}
      onClick={() => {
        if (disabled === null) onPress()
      }}
    >
      {children}
    </Button>
  )
  return disabled === null ? button : <Tooltip label={disabled}>{button}</Tooltip>
}

/**
 * The one bar beside a selection in any document view: in Specs and in the tab Bestanden the
 * same two buttons, Opmerking (⇧⌘M) and Meesturen (⌘L). "Naar chat" is gone as a name.
 *
 * A press on the bar is kept from the page (`preventDefault` on `mousedown`): it would otherwise
 * collapse the selection it acts on, and take the focus. A button that cannot act now stays in the
 * tab order, `aria-disabled`, with its reason as a tooltip. A named group of buttons, each its own
 * tab stop: no toolbar, which would promise arrows. Placeable anywhere: it knows no document, only
 * where it stands and what its buttons do.
 */
export function SelectionBar({
  at,
  commentDisabled = null,
  sendDisabled = null,
  onComment,
  onSendAlong,
  label,
  commentLabel,
  sendLabel,
  commentShortcut,
  sendShortcut,
  children,
}: SelectionBarProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a group beside a selection, not a fieldset of a form.
    <div
      role="group"
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      className={`${SELECTION_FLOATING} flex items-center gap-0.5 p-0.5`}
      style={{ top: at.top, left: at.left }}
    >
      {children ?? (
        <>
          {onComment && commentLabel !== undefined ? (
            <BarButton disabled={commentDisabled} onPress={onComment}>
              <span className="flex items-center gap-1.5">
                {commentLabel}
                {commentShortcut === undefined ? null : <Kbd shortcut={commentShortcut} />}
              </span>
            </BarButton>
          ) : null}
          <BarButton disabled={sendDisabled} onPress={onSendAlong}>
            <span className="flex items-center gap-1.5">
              {sendLabel}
              {sendShortcut === undefined ? null : <Kbd shortcut={sendShortcut} />}
            </span>
          </BarButton>
        </>
      )}
    </div>
  )
}
