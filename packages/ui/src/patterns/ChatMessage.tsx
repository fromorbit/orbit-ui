import { createContext, type ReactNode, useContext, useId } from 'react'
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
   * colour under what did arrive. Shape and word, never colour alone. Inside a `ChatLog` the log
   * announces it as the turn's last addition; on its own it is an `alert`, so it is heard when it
   * appears, never twice. It describes the article either way, so it is heard again with that turn.
   */
  error?: ReactNode
  /**
   * The way on after `error`, on the same line: a framed `secondary` `Button` with its word,
   * "Opnieuw proberen", so it reads as a button and not as text that floats. The one next action
   * after a failure is never an unnamed glyph on a row of its own. When the line is too narrow it
   * wraps under the sentence, its frame on the text's left edge, never under the warning sign.
   */
  errorAction?: ReactNode
  /**
   * `turn` (default) is the conversation of a code chat: your bubble on the right, the answer as
   * the text of the column. `bubble` is a conversation as in a messaging app, short replies of one
   * to three sentences (Orb): your bubble on the right with its corner towards you squared
   * (16/16/4/16), the other's on the left as a card with a hairline and its `mark` before it
   * (16/16/16/4), both at most 300px wide. Under the other's bubble `actions` are its chips
   * (`QuickActions`), always in sight.
   */
  shape?: 'turn' | 'bubble'
  /**
   * Only with `shape="bubble"` and `from="assistant"`: who speaks, before the bubble and level with
   * its last line, as a rule a decorative `OrbMark` (`md`). The article is already named by
   * `label`, so the mark needs no name of its own.
   */
  mark?: ReactNode
  /**
   * Only with `shape="bubble"`: a quiet line above the bubble that says where the message comes
   * from, already translated ("Uit zichzelf, na run 1291 van Trail · 08:12"). 11px, muted, on the
   * bubble's own edge; a glyph before it is the caller's.
   */
  source?: ReactNode
}

/**
 * The caret after the last paragraph of an answer that streams: 2px, muted, the height of a
 * letter. It pulses slowly, and stands still for whoever asked for less motion.
 */
const CARET =
  "[&>div>p:last-child]:after:ml-0.5 [&>div>p:last-child]:after:inline-block [&>div>p:last-child]:after:h-[1em] [&>div>p:last-child]:after:w-0.5 [&>div>p:last-child]:after:translate-y-0.5 [&>div>p:last-child]:after:animate-pulse [&>div>p:last-child]:after:bg-muted [&>div>p:last-child]:after:content-[''] motion-reduce:[&>div>p:last-child]:after:animate-none"

/**
 * The words of a reply that is being written: three 6px dots in muted that fade in turn, standing
 * still for whoever asked for less motion (`theme.css`). An `img` named by `label` ("Orb typt"),
 * so the wait is heard and not only seen. Put it in a `streaming` bubble.
 */
export function TypingDots({ label }: { label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      data-nt-typing
      className="nt-typing inline-flex h-5 items-center gap-1 align-top"
    >
      <span className="size-1.5 rounded-full bg-muted" />
      <span className="size-1.5 rounded-full bg-muted" />
      <span className="size-1.5 rounded-full bg-muted" />
    </span>
  )
}

/**
 * The text of a bubble: 13px on a 20px line, 8px by 12px inside, an inline path breaking where it
 * must. The corners are the bubble's radius, the one towards the speaker `sm`.
 */
const BUBBLE_TEXT =
  'min-w-0 whitespace-pre-wrap px-3 py-2 text-[13px] text-fg leading-5 [overflow-wrap:anywhere]'

/** Whether a message stands in a `ChatLog`, whose polite announcement already carries an error. */
const InLog = createContext(false)

/**
 * One column of turns that a screen reader follows: a `log`, polite, that announces what is added.
 * The column of a conversation is one; put `ChatMessage`s and tool lines in it.
 */
export function ChatLog({ label, children }: { label: string; children: ReactNode }) {
  return (
    <InLog.Provider value={true}>
      <div
        role="log"
        aria-label={label}
        aria-live="polite"
        aria-relevant="additions"
        className="flex min-w-0 flex-col gap-6"
      >
        {children}
      </div>
    </InLog.Provider>
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
  shape = 'turn',
  mark,
  source,
}: ChatMessageProps) {
  const errorId = useId()
  // An alert inside the log's live region is heard twice on some screen readers: in a log, the
  // log says it.
  const inLog = useContext(InLog)
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
      // column, so a wrapped action's frame stands on the left edge of the sentence (Proximity: the
      // failure and its way on stay one).
      <div
        id={errorId}
        role={inLog ? undefined : 'alert'}
        className="flex items-start gap-2 text-[12px] text-fg"
      >
        <span className="flex h-(--nt-control-sm) shrink-0 items-center text-danger">
          <Icon name="alert-triangle" size="sm" />
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4">
          <p className="m-0 flex min-h-(--nt-control-sm) min-w-0 items-center">{error}</p>
          {errorAction !== undefined ? <div className="flex">{errorAction}</div> : null}
        </div>
      </div>
    ) : null
  const described = error !== undefined ? { 'aria-describedby': errorId } : {}
  const sourceLine =
    source !== undefined ? (
      <p className="m-0 flex items-center gap-1.5 text-[11px] text-muted">{source}</p>
    ) : null

  if (shape === 'bubble' && from === 'user') {
    // Your own bubble: a tint on the canvas, no edge, so it reads apart from the other's card in
    // both themes. Its actions stay beside it, as on a turn.
    return (
      <article
        aria-label={label}
        {...described}
        data-nt-chat-side="end"
        className="group flex flex-col items-end gap-1"
      >
        {sourceLine}
        <div className="flex w-full flex-row-reverse items-end justify-start gap-2">
          <div
            data-nt-chat-bubble
            className={`${BUBBLE_TEXT} max-w-[min(300px,85%)] rounded-bubble rounded-br-sm bg-surface-hover`}
          >
            {children}
          </div>
          {footer}
        </div>
        {failure}
      </article>
    )
  }
  if (shape === 'bubble') {
    // Two columns: the mark, level with the bubble's last line, and the column of the message
    // (source, bubble, chips), so the source and the chips stand on the bubble's edge.
    return (
      <article
        aria-label={label}
        aria-busy={streaming || undefined}
        {...described}
        data-nt-chat-side="start"
        className="grid max-w-[380px] grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1"
      >
        {sourceLine !== null ? <div className="col-start-2">{sourceLine}</div> : null}
        <div className="col-start-1 flex items-end">{mark}</div>
        <div className="col-start-2 flex min-w-0">
          <div
            data-nt-chat-bubble
            className={`${BUBBLE_TEXT} rounded-bubble rounded-bl-sm border border-border bg-plane shadow-plane`}
          >
            {children}
          </div>
        </div>
        {failure !== null ? <div className="col-start-2">{failure}</div> : null}
        {!streaming && (actions !== undefined || meta !== undefined) ? (
          <div
            data-nt-chat-message-actions
            className="col-start-2 mt-1 flex flex-wrap items-center gap-1.5"
          >
            {actions}
            {meta !== undefined ? (
              <span className="text-[11px] text-muted tabular-nums">{meta}</span>
            ) : null}
          </div>
        ) : null}
      </article>
    )
  }

  if (from === 'user') {
    // The actions stand beside the bubble, on its last line, rather than under it: they show only
    // on hover or focus, and a row kept free for them would open a gap under every question. The
    // bubble comes first in the document and the row is reversed, so a screen reader hears the
    // question before its buttons while the eye still finds them to its left.
    return (
      <article
        aria-label={label}
        {...described}
        data-nt-chat-side="end"
        className="group flex flex-col items-end gap-1"
      >
        <div className="flex w-full flex-row-reverse items-end justify-start gap-2">
          <div className="max-w-[80%] whitespace-pre-wrap rounded-lg rounded-br-sm bg-bubble px-3 shadow-plane py-2 text-[13px] text-fg leading-5 [overflow-wrap:anywhere]">
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
      data-nt-chat-side="start"
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
