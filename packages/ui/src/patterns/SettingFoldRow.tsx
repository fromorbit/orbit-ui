import { Children, type ReactNode, useId, useState } from 'react'
import { Icon } from '../primitives/Icon'

/** The tone of a status dot: filled in `success` or `attention`, or an empty ring for off. */
export type SettingFoldTone = 'success' | 'attention' | 'off'

/** One complete class string per tone (Tailwind reads source text). */
const DOT: Record<SettingFoldTone, string> = {
  success: 'bg-success',
  attention: 'bg-attention',
  off: 'border border-muted',
}

/** The frame of the row: the height and insets of every `SettingRow`. */
const ROW = 'flex min-h-12 w-full items-center gap-6 px-4 py-3'

/** The props of `SettingFoldRow`. */
export interface SettingFoldRowProps {
  /** The name of the thing the row stands for (an agent): 13px `text`. */
  label: string
  /** One quiet line under it (12px, `muted`), cut off on one line with the whole of it as title. */
  description?: string
  /** A small dot and one short word on the right, in `text-secondary`; never the dot alone. */
  status?: { tone: SettingFoldTone; label: string }
  /** Whether its rows stand open at first; the reader's own clicks win from then on. */
  defaultOpen?: boolean
  /** The rows that fold open under it, usually `SettingRow`s; without any, nothing folds. */
  children?: ReactNode
}

/**
 * A row of a settings card that stands for a thing rather than a value — an agent — with its
 * status on the right and its own rows folded under it.
 *
 * The same box as `SettingRow` (48px at least, 16px at the sides), so it stands in a card among
 * them. The status is a dot and a word, not a framed badge. The chevron
 * stands in the 24px slot where a `SettingRow` keeps its reset, so the status ends on the line
 * where every control of the card ends; it turns a quarter when the rows are open. With rows the
 * whole row is the button (`aria-expanded`), without them it is plain text. Closed, the rows are
 * out of the document, like `Collapsible`'s content.
 */
export function SettingFoldRow({
  label,
  description,
  status,
  defaultOpen = false,
  children,
}: SettingFoldRowProps) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()
  const foldable = Children.toArray(children).length > 0
  const head = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate leading-5 text-fg">{label}</span>
        {description === undefined || description.trim() === '' ? null : (
          <span className="block truncate text-[12px] leading-4 text-muted" title={description}>
            {description}
          </span>
        )}
      </span>
      {/* The status and the 24px slot stand 8px apart, as a control and its reset in a
          `SettingRow`, so the word ends on the line where every control of the card ends. */}
      <span className="flex shrink-0 items-center gap-2">
        {status === undefined ? null : (
          <span className="flex shrink-0 items-center gap-2 text-[12px] leading-4 text-secondary">
            <span
              aria-hidden="true"
              data-nt-fold-status={status.tone}
              className={`block size-2 shrink-0 rounded-full ${DOT[status.tone]}`}
            />
            {status.label}
          </span>
        )}
        <span className="flex size-6 shrink-0 items-center justify-center text-muted">
          {foldable ? (
            <span
              data-nt-fold-chevron
              className={
                open
                  ? 'flex rotate-90 transition-transform duration-100 motion-reduce:transition-none'
                  : 'flex transition-transform duration-100 motion-reduce:transition-none'
              }
            >
              <Icon name="chevron-right" size="sm" />
            </span>
          ) : null}
        </span>
      </span>
    </>
  )
  return (
    <div data-nt-setting-fold-row>
      {foldable ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((was) => !was)}
          className={`${ROW} no-drag text-left outline-focus hover:bg-row-hover focus-visible:outline-2 focus-visible:-outline-offset-2`}
        >
          {head}
        </button>
      ) : (
        <div className={ROW}>{head}</div>
      )}
      {foldable && open ? (
        <div id={contentId} className="divide-y divide-border border-t border-border">
          {children}
        </div>
      ) : null}
    </div>
  )
}
