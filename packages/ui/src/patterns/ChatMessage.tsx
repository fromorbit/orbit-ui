import { type ReactNode, useId } from 'react'
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
   * What can be done with the message: `CopyButton`, "Opnieuw genereren", "Bewerk". Give asking
   * again a glyph and a name of its own (`repeat`, "Opnieuw genereren"): "Opnieuw proberen" with
   * `rotate-ccw` is the way on after an `error`, and two actions should not share one look. Under
   * an answer they stay
   * in sight; beside your own bubble they appear on hover or focus with a fine pointer, so a long
   * conversation does not show a row of buttons per turn (Hick). On a touch screen, where nothing
   * hovers, they stay in sight.
   */
  actions?: ReactNode
  /**
   * A quiet detail beside the actions: the hour, the model and how long it took
   * ("14:03 · Opus 5.5 · klaar in 12 s"). 11px, muted, in the sans like every other count. When
   * `label` names the hour too, use the same hour, so what is seen and what is heard agree.
   */
  meta?: ReactNode
  /**
   * The answer is still coming in: the message is `aria-busy`, a quiet caret stands after the last
   * paragraph of a `Prose` answer, and the row of actions waits until it is complete, because
   * copying half an answer is never what was meant.
   */
  streaming?: boolean
  /**
   * Why the answer stopped short, already translated: a line with a warning sign in the danger
   * colour under what did arrive. Shape and word, never colour alone. It is an `alert`, so it is
   * heard when it appears, and it describes the article, so it is heard again with that turn.
   */
  error?: ReactNode
  /**
   * The way on after `error`, on the same line: a ghost `Button` with its word, "Opnieuw proberen".
   * The one next action after a failure is never an unnamed glyph on a row of its own. When the
   * line is too narrow it wraps under the sentence, its glyph on the text's left edge, never under
   * the warning sign.
   */
  errorAction?: ReactNode
}

/**
 * The caret after the last paragraph of an answer that streams: 2px, muted, the height of a
 * letter. It pulses slowly, and stands still for whoever asked for less motion.
 */
const CARET =
  "[&>div>p:last-child]:after:ml-0.5 [&>div>p:last-child]:after:inline-block [&>div>p:last-child]:after:h-[1em] [&>div>p:last-child]:after:w-0.5 [&>div>p:last-child]:after:translate-y-0.5 [&>div>p:last-child]:after:animate-pulse [&>div>p:last-child]:after:bg-muted [&>div>p:last-child]:after:content-[''] motion-reduce:[&>div>p:last-child]:after:animate-none"

/**
 * One column of turns that a screen reader follows: a `log`, polite, that announces what is added.
 * The column of a conversation is one; put `ChatMessage`s and tool lines in it.
 */
export function ChatLog({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="log"
      aria-label={label}
      aria-live="polite"
      aria-relevant="additions"
      className="flex min-w-0 flex-col gap-6"
    >
      {children}
    </div>
  )
}

/**
 * One message of a conversation.
 *
 * An `<article>` named by who speaks, so a screen reader can walk the turns with its article keys;
 * the column around them is a `ChatLog`, so a new turn is announced.
 * Your own message is a 12px bubble on the `bubble` plane, 8px by 12px inside, at most four fifths of the column wide
 * and with its corner towards you squared to 4px, the sign of a speech bubble without a tail; its
 * actions appear beside it on hover or focus. An answer has no plane at all: it is the text of the
 * column, and its actions sit 8px under it on one 28px row, the meta beside them. Text runs on a
 * 20px line, and an inline path breaks where it must rather than pushing the column wide.
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
  errorAction,
}: ChatMessageProps) {
  const errorId = useId()
  const footer =
    !streaming && (actions !== undefined || meta !== undefined) ? (
      <div
        data-nt-chat-message-actions
        className={[
          // The 28px buttons stand 6px into the gutter so their glyphs line up with the text.
          'flex min-h-(--nt-control-sm) items-center gap-0.5',
          from === 'user'
            ? 'shrink-0 flex-row-reverse pb-1 opacity-0 transition-opacity duration-(--nt-duration-fast) group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100 motion-reduce:transition-none'
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
      // Two columns: the sign, and the sentence with its action. The action wraps inside the second
      // column, and its -8px takes back the ghost's own padding, so a wrapped action's glyph stands
      // under the first letter of the sentence (Proximity: the failure and its way on stay one).
      <div id={errorId} role="alert" className="flex items-start gap-2 text-[12px] text-fg">
        <span className="flex h-(--nt-control-sm) shrink-0 items-center text-danger">
          <Icon name="alert-triangle" size="sm" />
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4">
          <p className="m-0 flex min-h-(--nt-control-sm) min-w-0 items-center">{error}</p>
          {errorAction !== undefined ? <div className="-ml-2 flex">{errorAction}</div> : null}
        </div>
      </div>
    ) : null
  const described = error !== undefined ? { 'aria-describedby': errorId } : {}

  if (from === 'user') {
    // The actions stand beside the bubble, on its last line, rather than under it: they show only
    // on hover or focus, and a row kept free for them would open a gap under every question. The
    // bubble comes first in the document and the row is reversed, so a screen reader hears the
    // question before its buttons while the eye still finds them to its left.
    return (
      <article aria-label={label} {...described} className="group flex flex-col items-end gap-1">
        <div className="flex w-full flex-row-reverse items-end justify-start gap-2">
          <div className="max-w-[80%] whitespace-pre-wrap rounded-lg rounded-br-sm bg-bubble px-3 py-2 text-[13px] text-fg leading-5 [overflow-wrap:anywhere]">
            {children}
          </div>
          {footer}
        </div>
        {failure}
      </article>
    )
  }
  return (
    <article
      aria-label={label}
      aria-busy={streaming || undefined}
      {...described}
      className="flex min-w-0 flex-col gap-2"
    >
      <div className={`min-w-0 text-[13px] text-fg leading-5 ${streaming ? CARET : ''}`}>
        {children}
      </div>
      {failure}
      {footer}
    </article>
  )
}
