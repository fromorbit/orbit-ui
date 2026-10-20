import { type ReactNode, type Ref, useId, useState } from 'react'
import { Icon } from './Icon'

/** The props of `Collapsible`. */
export interface CollapsibleProps {
  /**
   * The row that is always visible; it becomes the button.
   *
   * Everything in it is part of the button's accessible name, so it carries the whole sentence a
   * reader needs in order to decide whether to open it — not a label such as "details". It stays
   * on one line and is cut off with an ellipsis, so the row never grows past its 24px.
   *
   * `null` is the other half of the contract: there is nothing to fold yet, so no trigger is
   * rendered and the content simply stands there — in exactly the same slot of the tree as when a
   * summary does arrive. That is what lets a caller keep one `Collapsible` in place while the
   * thing it summarises grows from one item into several: React keeps the content's DOM, instead
   * of unmounting it and mounting it again, which inside a live region would read it all out
   * a second time.
   */
  summary?: ReactNode
  /**
   * Whether a chevron stands in front of the summary; on by default.
   *
   * Off for a summary that already reads as something to click on its own, such as the quiet
   * lines of the timeline: there the whole line is the button, and a chevron in front of it only
   * repeated what a click already does. The state stays in
   * `aria-expanded` either way, so nothing is lost for a screen reader.
   */
  chevron?: boolean
  open: boolean
  onOpenChange(open: boolean): void
  children: ReactNode
  /** Reaches the native button of the summary, as on every other control of this library. */
  ref?: Ref<HTMLButtonElement>
}

/**
 * A summary row that shows or hides what is below it: a button with `aria-expanded` and the
 * region it controls, the pattern Radix Collapsible implements, written out here.
 *
 * Not Radix's own content, because of what it costs to mount: its `Presence` reads the computed
 * style of every content element, open or closed, and the content measures its own height with
 * `getBoundingClientRect` after setting inline styles. A conversation mounts one per block of tool
 * calls and per folded turn in a single commit, so every one of them forced a style and layout
 * recalculation of the whole log in between DOM writes: the largest cost of opening a long chat
 * after markdown itself. This component reads nothing.
 *
 * Controlled on purpose: whether something is open belongs to the thing being summarised — a
 * finished run of tool calls folds itself away, one that failed stays open — so the caller keeps
 * that decision and this component only renders it.
 *
 * Closed, Radix takes the content out of the document entirely. That is what makes collapsing safe
 * inside a live region: content that is merely hidden is still read out and still found by search.
 *
 * The content appears by fading, never by growing: a height animation makes everything below it
 * slide for as long as the animation lasts, and asks the reader to wait for something that is
 * already there. The chevron turns a quarter with `transform` alone, so nothing around it reflows.
 *
 * The chevron sits in a slot of exactly one small icon with the standard gap behind it, so a
 * summary lines up with rows that open with a glyph of that same size. A caller whose summary
 * carries a glyph of its own can leave the chevron out (`chevron={false}`); the summary then
 * starts at the left edge of the row.
 *
 * The focus ring is drawn inside the summary, on the corners of its hover fill: the row spans its
 * whole column, and a ring outside it stood 2px past both edges of every block. It shows for the
 * keyboard only (`focus-visible`); a click leaves the button focused without a ring.
 */
export function Collapsible({
  summary,
  chevron = true,
  open,
  onOpenChange,
  children,
  ref,
}: CollapsibleProps) {
  // Nothing to fold without a summary, so nothing may be folded away either: `open` would
  // otherwise hide content that no button can bring back.
  const foldable = summary !== undefined && summary !== null
  const shown = foldable ? open : true
  const state = shown ? 'open' : 'closed'
  const contentId = useId()
  // What stands open when it mounts is simply there; only what is unfolded later fades in, as with
  // Radix. Derived during render, so remembering it costs no extra commit.
  const [wasClosed, setWasClosed] = useState(!shown)
  if (!shown && !wasClosed) setWasClosed(true)
  return (
    <div data-state={state}>
      {foldable ? (
        <button
          type="button"
          ref={ref}
          aria-expanded={shown}
          // Only while open: closed, the content is out of the document, and a reference to an id
          // that does not exist is what axe calls an invalid attribute value.
          {...(shown ? { 'aria-controls': contentId } : {})}
          data-state={state}
          onClick={() => onOpenChange(!open)}
          className="no-drag group flex h-6 w-full items-center gap-2 rounded-sm text-left outline-focus hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2"
        >
          {chevron ? (
            <span
              data-nt-collapsible-chevron
              className="flex size-(--nt-icon-sm) shrink-0 items-center justify-center text-muted transition-transform duration-100 group-data-[state=open]:rotate-90 motion-reduce:transition-none"
            >
              <Icon name="chevron-right" size="sm" />
            </span>
          ) : null}
          {/* A plain box, not a flex row: the summary is one line of inline content, and only a
              block container puts an ellipsis at the end of what does not fit. */}
          <span data-nt-collapsible-summary className="min-w-0 flex-1 truncate">
            {summary}
          </span>
        </button>
      ) : null}
      {/* Always this slot, with or without a button above it: a conditional that swaps one element
          type for another here would take the content out of the tree and put a new one back, and
          a live region reads such an insertion out again. Closed, the content is out of the
          document entirely. */}
      {shown ? (
        <div
          id={contentId}
          data-state={state}
          className="nt-fade-in"
          {...(wasClosed ? {} : { style: { animationName: 'none' } })}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
