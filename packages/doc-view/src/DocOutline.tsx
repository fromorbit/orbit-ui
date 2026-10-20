import { Rows3 } from 'lucide-react'
import { type MouseEvent, type ReactNode, useId, useState } from 'react'

/** The words of {@link DocOutline}, in the reader's language: each side brings its own catalogue. */
export interface DocOutlineLabels {
  /** The name of the list of headings (a `nav` landmark). */
  label: string
  /** The name of the toggle a narrow outline folds to. */
  toggle: string
}

/** What a caller needs to draw the toggle of a folded outline with its own button. */
export interface DocOutlineToggle {
  label: string
  expanded: boolean
  /** The id of the list while it is open, for `aria-controls`; `undefined` while it is folded. */
  controls: string | undefined
  onToggle(): void
}

/** What {@link DocOutline} draws, and what it hears. */
export interface DocOutlineProps {
  /** The headings in order: core's `outline` in the app, {@link outlineOf} elsewhere. */
  entries: readonly { depth: number; text: string; anchor: string }[]
  /** The anchor of the heading the reader is at, lit while scrolling; `null` above the first. */
  active: string | null
  /** A heading was chosen: scroll the document to it. */
  onJump(anchor: string): void
  /** A narrow view: only a toggle, which opens the list over the top of the page. */
  folded: boolean
  labels: DocOutlineLabels
  /**
   * Draws the toggle of a folded outline with the caller's own button (the app's `IconButton`,
   * with its tooltip); without it, a plain button with the same glyph.
   */
  renderToggle?(toggle: DocOutlineToggle): ReactNode
}

/** Indentation per level, capped so a deep heading still leaves room for its words. */
const INDENT = [
  'nt-doc-outline-depth-1',
  'nt-doc-outline-depth-2',
  'nt-doc-outline-depth-3',
  'nt-doc-outline-depth-4',
  'nt-doc-outline-depth-4',
  'nt-doc-outline-depth-4',
] as const

/** The toggle of a folded outline when the caller brings none: a quiet square button. */
function PlainToggle({ label, expanded, controls, onToggle }: DocOutlineToggle) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
      className="nt-doc-outline-toggle"
    >
      <Rows3 aria-hidden="true" strokeWidth={1.75} className="nt-doc-outline-toggle-glyph" />
    </button>
  )
}

/**
 * The outline of a markdown document: its headings as links to their anchors, the one the reader
 * is at marked `aria-current="location"`.
 *
 * A narrow column beside the page; in a narrow view it folds to one toggle, and the list then opens
 * above the page and folds again after a jump. Measured by the caller against its own view, never
 * the window. The page never navigates: a click hands the anchor to `onJump`.
 */
export function DocOutline({
  entries,
  active,
  onJump,
  folded,
  labels,
  renderToggle,
}: DocOutlineProps): ReactNode {
  const [open, setOpen] = useState(false)
  const listId = useId()
  if (entries.length === 0) return null

  const list = (
    <nav id={listId} aria-label={labels.label}>
      <ul className="nt-doc-outline-list">
        {entries.map((entry) => (
          <li key={entry.anchor} className={INDENT[entry.depth - 1]}>
            <a
              href={`#${entry.anchor}`}
              data-depth={entry.depth}
              aria-current={entry.anchor === active ? 'location' : undefined}
              onClick={(event: MouseEvent) => {
                // The page never navigates: the view scrolls its own document.
                event.preventDefault()
                if (folded) setOpen(false)
                onJump(entry.anchor)
              }}
              className="nt-doc-outline-entry"
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )

  if (!folded) return <div className="nt-doc-outline">{list}</div>
  const toggle: DocOutlineToggle = {
    label: labels.toggle,
    expanded: open,
    controls: open ? listId : undefined,
    onToggle: () => setOpen((was) => !was),
  }
  return (
    <div className="nt-doc-outline-folded">
      {renderToggle ? renderToggle(toggle) : <PlainToggle {...toggle} />}
      {open ? <div className="nt-doc-outline-popover">{list}</div> : null}
    </div>
  )
}
