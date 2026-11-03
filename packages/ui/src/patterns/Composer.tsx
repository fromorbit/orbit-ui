import { type KeyboardEvent, type ReactNode, useId, useRef } from 'react'
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
   * keeps its shape) and Enter sends nothing. Typing stays possible, for the next message.
   */
  running?: boolean
  /** Stop was pressed; called only while `running`. Left out, the button is not offered. */
  onStop?(): void
  /**
   * Why nothing can be typed now, already translated: the field is off and the sentence stands
   * under the plane with a warning sign. Left out, the composer is usable.
   */
  disabledReason?: ReactNode
  /**
   * The settings of this message, left in the toolbar: the round "+" for an attachment, the model
   * as a `PickerPill`, the access level as a `Pill`. A slot, because what goes in a pill belongs to
   * the host; the composer owns the row they stand on.
   */
  tools?: ReactNode
  /** What the message takes along, above the field: `Chip`s of attached files. */
  attachments?: ReactNode
  /** A quiet line under the plane: where the message lands, or a hint about the keys. 12px, muted. */
  footer?: ReactNode
  /** Rows the field shows when empty; 1 in a running chat, 3 in a new one where it is the screen. */
  minRows?: number
  /** Rows it grows to before it scrolls; default 8. */
  maxRows?: number
}

/**
 * The input of a chat: a growing field and its toolbar as one plane.
 *
 * One plane on the `composer` tint, 12px round with 12px of air inside, a strong hairline that
 * lightens when the focus is inside (neutral, not the accent: the field is where you always are,
 * and the send button is the one emphasis of the view). Under the field one 28px row: the tools
 * on the left, the send button against the right edge, 16px under the text so the row reads as a
 * row of its own (Proximity).
 *
 * The send button is a round arrow on the accent only when a press sends something. Empty, it is
 * the quiet `idle` plane, `aria-disabled` rather than `disabled`: it stays a tab stop with a name,
 * and the plane at full strength says "nothing yet" without looking broken. While an answer runs
 * it turns into Stop, a square on the accent. A click anywhere on the plane that is not a control puts the caret in the
 * field: the whole plane is the target (Fitts).
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
        onClick={(event) => {
          if (event.target === event.currentTarget) field.current?.focus()
        }}
        className={[
          'flex flex-col gap-2 rounded-lg border border-border-strong bg-composer p-3 shadow-menu transition-[border-color] duration-(--nt-duration-fast)',
          disabled ? '' : 'cursor-text focus-within:border-border-focus',
        ].join(' ')}
      >
        {attachments !== undefined ? (
          <div className="flex flex-wrap items-center gap-2">{attachments}</div>
        ) : null}
        <div className={disabled ? 'opacity-60' : undefined}>
          <Textarea
            ref={field}
            label={labels.field}
            variant="bare"
            minRows={minRows}
            maxRows={maxRows}
            value={value}
            disabled={disabled}
            {...(placeholder === undefined ? {} : { placeholder })}
            {...(disabled ? { 'aria-describedby': reasonId } : {})}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
        <div data-nt-composer-toolbar className="mt-2 flex min-w-0 items-center gap-2">
          <div className="flex min-w-0 items-center gap-2">{tools}</div>
          <span className="flex-1" />
          {running && onStop ? (
            <IconButton
              icon="square"
              label={labels.stop}
              // On the accent: while an answer runs, stopping it is what a press of this place does,
              // and a square on a quiet ring would read as a checkbox.
              variant="primary"
              shape="round"
              size="sm"
              onClick={onStop}
            />
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
      {disabled ? (
        <p id={reasonId} className="m-0 flex items-center gap-2 px-3 text-[12px] text-muted">
          <span className="flex shrink-0 text-attention">
            <Icon name="alert-triangle" size="sm" />
          </span>
          {disabledReason}
        </p>
      ) : footer !== undefined ? (
        <div className="flex min-h-6 items-center gap-2 px-3 text-[12px] text-muted">{footer}</div>
      ) : null}
    </div>
  )
}
