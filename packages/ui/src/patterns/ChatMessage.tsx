import type { ReactNode } from 'react'
import { Icon } from '../primitives/Icon'

/** The props of `ChatMessage`. */
export interface ChatMessageProps {
  /**
   * `user` is your own message: a bubble against the right edge. `assistant` is the answer: plain
   * text across the column, with its actions under it. The two differ in shape, not only in colour,
   * so the turns read apart at a glance (Common Region, Similarity).
   */
  from: 'user' | 'assistant'
  /** The accessible name of the message: who speaks, "Jij" or "Opus 5.5". Already translated. */
  label: string
  /**
   * The body: a string for your own message, rendered markdown (`Prose`) for an answer. A pattern
   * never parses markdown itself.
   */
  children: ReactNode
  /**
   * What can be done with the message: `CopyButton`, "Opnieuw", "Bewerk". Under an answer they stay
   * in sight; under your own bubble they appear on hover or focus, so a long conversation does not
   * show a row of buttons per turn (Hick).
   */
  actions?: ReactNode
  /** A quiet detail beside the actions: the model and the time it took, or the hour. 11px, muted. */
  meta?: ReactNode
  /**
   * The answer is still coming in: the message is `aria-busy` and the row of actions waits until
   * it is complete, because copying half an answer is never what was meant.
   */
  streaming?: boolean
  /**
   * Why the answer stopped short, already translated: a line in the danger colour with a warning
   * sign under what did arrive. Shape and word, never colour alone.
   */
  error?: ReactNode
}

/**
 * One message of a conversation.
 *
 * An `<article>` named by who speaks, so a screen reader can walk the turns with its article keys.
 * Your own message is a 12px bubble on the `bubble` plane, at most four fifths of the column wide
 * and with its corner towards you squared to 4px, the sign of a speech bubble without a tail; its
 * actions appear beside it on hover or focus. An
 * answer has no plane at all: it is the text of the column, and its actions sit 8px under it on
 * one 28px row, the meta beside them.
 *
 * The space between two messages is the caller's (the column's `gap`), because it is the space
 * between turns, not a part of a turn: 24px is the group distance of the kit.
 */
export function ChatMessage({
  from,
  label,
  children,
  actions,
  meta,
  streaming = false,
  error,
}: ChatMessageProps) {
  const footer =
    !streaming && (actions !== undefined || meta !== undefined) ? (
      <div
        data-nt-chat-message-actions
        className={[
          // The 28px buttons stand 6px into the gutter so their glyphs line up with the text.
          'flex min-h-(--nt-control-sm) items-center gap-0.5',
          from === 'user'
            ? 'shrink-0 flex-row-reverse pb-1 opacity-0 transition-opacity duration-(--nt-duration-fast) group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none'
            : '-ml-1.5',
        ].join(' ')}
      >
        {actions}
        {meta !== undefined ? (
          <span className="px-1.5 text-[11px] text-muted tabular-nums">{meta}</span>
        ) : null}
      </div>
    ) : null
  const failure =
    error !== undefined ? (
      <p className="m-0 flex items-start gap-2 text-[12px] text-danger">
        <span className="flex h-[18px] shrink-0 items-center">
          <Icon name="alert-triangle" size="sm" />
        </span>
        <span className="min-w-0">{error}</span>
      </p>
    ) : null

  if (from === 'user') {
    // The actions stand beside the bubble, on its last line, rather than under it: they show only
    // on hover or focus, and a row kept free for them would open a gap under every question.
    return (
      <article aria-label={label} className="group flex flex-col items-end gap-1">
        <div className="flex w-full items-end justify-end gap-2">
          {footer}
          <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-lg rounded-br-sm bg-bubble px-4 py-2.5 text-[13px] text-fg leading-relaxed">
            {children}
          </div>
        </div>
        {failure}
      </article>
    )
  }
  return (
    <article
      aria-label={label}
      aria-busy={streaming || undefined}
      className="flex min-w-0 flex-col gap-2"
    >
      <div className="min-w-0 text-[13px] text-fg leading-relaxed">{children}</div>
      {failure}
      {footer}
    </article>
  )
}
