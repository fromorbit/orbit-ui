import { type KeyboardEvent, type ReactNode, useId, useRef } from 'react'
import { Tooltip } from '../overlays/Tooltip'
import { Icon } from '../primitives/Icon'
import { IconButton } from '../primitives/IconButton'
import { Textarea } from '../primitives/Textarea'

/** The words of a `Composer`, as one object for a host that hands the same to every composer. */
export interface ComposerLabels {
  /** The accessible name of the field: "Bericht". */
  field: string
  /** The name of the button that sends: "Verstuur". */
  send: string
  /** The name of the button while an answer runs: "Stop". */
  stop: string
}

/** The props of `Composer`. */
export interface ComposerProps {
  labels: ComposerLabels
  /** The text in the field; the caller holds it, so a draft can outlive the composer. */
  value: string
  onValueChange(value: string): void
  /**
   * Enter (without Shift, and not while an input method is composing) or the button. Only called
   * with text that is more than white space and while nothing runs; clearing the field is the
   * caller's, once it took the message.
   */
  onSend(): void
  /** The words in the empty field: "Vraag iets of geef een opdracht…". */
  placeholder?: string
  /**
   * An answer is running: the button becomes Stop (a square in the same round 28px, so the row
   * keeps its shape, with "Stop (Esc)" as its tooltip) and Enter sends nothing; Escape in the
   * field presses Stop. Typing stays possible, for the next message.
   */
  running?: boolean
  /** Stop was pressed; called only while `running`. Left out, the button is not offered. */
  onStop?(): void
  /**
   * Why nothing can be typed now, already translated. The reason stands inside the plane, on top,
   * with a warning sign; the field, the tools and the send button below it step back to 40%. The
   * field stays a tab stop (`aria-disabled` and read-only, not `disabled`), so the keyboard and a
   * screen reader reach it and hear the reason as its description; the send button is described
   * by the same sentence. Left out, the composer is usable.
   */
  disabledReason?: ReactNode
  /**
   * The way out of `disabledReason`, at the end of its line: a `primary` 28px button "Kies
   * project". Off, it is the one thing on the plane that can act, so it is the one emphasis while
   * the reason stays a quiet sentence (Von Restorff). A host that brings the user to the composer
   * in this state puts the focus on it.
   */
  disabledAction?: ReactNode
  /**
   * The settings of this message, left in the toolbar: the round ghost "+" for an attachment, the
   * model and the access level as ghost `PickerPill`s, so every control of the row, send included,
   * is one 28px control with 8px of padding, and the send button is the only mark with a fill.
   * The row pulls 6px into the plane's padding, so the glyph of the "+" stands on the left edge of
   * the text above it. A slot, because what goes in a pill belongs to the host; the composer owns
   * the row they stand on. Give the access level a short word ("Bewerken") rather than letting it
   * collapse to its sign: what the agent may do is the riskiest setting here, and a bare shield
   * does not say it. The row is the `toolbar` container for a host that still collapses a pill.
   */
  tools?: ReactNode
  /**
   * What the message takes along, above the field: small `Chip`s of attached files, each with its
   * file icon, its cross and `truncate="middle"`. They size to their name and wrap, two to a row
   * at most, and a long name loses letters in its middle, keeping the extension, rather than
   * taking a row of its own.
   */
  attachments?: ReactNode
  /** A quiet line under the plane: where the message lands, or a hint about the keys. 12px, muted. */
  footer?: ReactNode
  /** Rows the field shows when empty; 1 in a running chat, 3 in a new one where it is the screen. */
  minRows?: number
  /** Rows it grows to before it scrolls; default 8. */
  maxRows?: number
}

/** The row of tools: 4px apart, pulled 6px left, the pills on the 8px step. */
const TOOLS = 'flex min-w-0 items-center gap-1 -ml-1.5 [&_[data-nt-pill]]:px-2'

/**
 * The input of a chat: a growing field and its toolbar as one plane.
 *
 * One plane on the `composer` tint, 12px round with 12px of air inside and one inset hairline, no
 * shadow: a region by its tint, not a card that floats. The hairline is a ring inside the plane
 * rather than a border, so the plane stays on the 4px grid (12 + 20 + 16 + 28 + 12 = 88px with one
 * row). With the keyboard focus in the field the plane takes the kit's 2px focus ring, the one
 * every control shows, and the hairline steps aside, so there is one frame, never two. Under the
 * field one row: the tools on the left, the send button against the right edge, 16px under the
 * text so the row reads as a row of its own (Proximity).
 *
 * The send button is the one emphasis of the row: a round 28px arrow on the accent when a press
 * sends something, of one size with the tools beside it, so it is set apart by its fill alone and
 * the centres of the row stand on one line (Von Restorff). Empty, it is the quiet
 * `idle` plane, `aria-disabled` rather than `disabled`: it stays a tab stop with a name, and the
 * plane at full strength says "nothing yet" without looking broken. While an answer runs it turns
 * into Stop, a square on the accent. A click anywhere on the plane that is not a control puts the
 * caret in the field: the whole plane is the target (Fitts).
 *
 * Off (`disabledReason`), the plane loses its tint and keeps a quiet hairline, the reason stands
 * inside it on top and everything under the reason steps back: one region, one glance (Common
 * Region).
 */
export function Composer({
  labels,
  value,
  onValueChange,
  onSend,
  placeholder,
  running = false,
  onStop,
  disabledReason,
  disabledAction,
  tools,
  attachments,
  footer,
  minRows = 1,
  maxRows = 8,
}: ComposerProps) {
  const field = useRef<HTMLTextAreaElement>(null)
  const reasonId = useId()
  const disabled = disabledReason !== undefined
  const ready = !disabled && !running && value.trim() !== ''

  const send = () => {
    if (ready) onSend()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Escape is the keyboard twin of the square button.
    if (event.key === 'Escape' && running && onStop) {
      event.preventDefault()
      onStop()
      return
    }
    // An input method (Japanese, Chinese, accents on some layouts) confirms its word with Enter:
    // that Enter is the method's, not a send.
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    send()
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: a pointer convenience only; the field and every control keep their own keyboard access. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: as above, the keyboard reaches the field directly. */}
      <div
        data-nt-composer
        data-disabled={disabled || undefined}
        onClick={(event) => {
          if (event.target === event.currentTarget) field.current?.focus()
        }}
        className={
          disabled
            ? 'flex flex-col gap-2 rounded-lg p-3 ring-1 ring-border ring-inset outline-focus has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:ring-transparent'
            : 'flex cursor-text flex-col gap-2 rounded-lg bg-composer p-3 ring-1 ring-border-strong ring-inset outline-focus has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:ring-transparent'
        }
      >
        {disabled ? (
          <div className="flex min-h-(--nt-control-sm) flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p
              id={reasonId}
              className="m-0 flex min-w-0 items-center gap-2 text-[12px] text-secondary"
            >
              <span className="flex shrink-0 text-attention">
                <Icon name="alert-triangle" size="sm" />
              </span>
              {disabledReason}
            </p>
            {disabledAction}
          </div>
        ) : null}
        {attachments !== undefined ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2 [&>*]:max-w-[calc(50%-4px)]">
            {attachments}
          </div>
        ) : null}
        <div className={disabled ? 'opacity-40' : undefined}>
          <Textarea
            ref={field}
            label={labels.field}
            variant="bare"
            minRows={minRows}
            maxRows={maxRows}
            value={value}
            {...(placeholder === undefined ? {} : { placeholder })}
            {...(disabled
              ? { 'aria-disabled': true, readOnly: true, 'aria-describedby': reasonId }
              : {})}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
        <div
          data-nt-composer-toolbar
          className="@container/toolbar mt-2 flex min-w-0 items-center gap-2"
        >
          {/* Off, the tools leave the tab order with the rest of the row: nothing there can act.
              -6px: the glyph of the round "+" stands on the text's left edge. The pills take the
              8px step of the kit rather than the 10px of a small button. */}
          <div className={disabled ? `${TOOLS} opacity-40` : TOOLS} inert={disabled || undefined}>
            {tools}
          </div>
          <span className="flex-1" />
          {disabled ? (
            // Off, the send button stays a named tab stop that says why (the reason describes it),
            // and steps back with the row.
            <span className="flex opacity-40">
              <IconButton
                icon="arrow-up"
                label={labels.send}
                variant="idle"
                shape="round"
                size="sm"
                aria-disabled
                aria-describedby={reasonId}
              />
            </span>
          ) : running && onStop ? (
            // The tooltip names the key as well: Escape in the field does the same.
            <Tooltip label={`${labels.stop} (Esc)`}>
              <IconButton
                icon="square"
                label={labels.stop}
                // On the accent: while an answer runs, stopping it is what a press of this place
                // does, and a square on a quiet ring would read as a checkbox.
                variant="primary"
                shape="round"
                size="sm"
                onClick={onStop}
              />
            </Tooltip>
          ) : (
            <IconButton
              icon="arrow-up"
              label={labels.send}
              variant={ready ? 'primary' : 'idle'}
              shape="round"
              size="sm"
              aria-disabled={ready ? undefined : true}
              onClick={send}
            />
          )}
        </div>
      </div>
      {!disabled && footer !== undefined ? (
        <div className="flex min-h-6 items-center gap-2 text-[12px] text-muted">{footer}</div>
      ) : null}
    </div>
  )
}
