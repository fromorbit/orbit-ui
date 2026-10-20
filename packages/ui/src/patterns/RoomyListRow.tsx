import type { ComponentPropsWithRef, ReactNode } from 'react'
import { StatusShape } from './StatusShape'
import type { RunStatusKind } from './status-kind'

/** A row with a status icon needs the status in words as well, as in `ListRow`. */
type RowStatus = { kind?: null; status?: string } | { kind: RunStatusKind; status: string }

/** The props of `RoomyListRow`. */
export type RoomyListRowProps = Omit<
  ComponentPropsWithRef<'button'>,
  'className' | 'style' | 'children' | 'title'
> & {
  /** The row's own text: wraps onto a second line, and is cut off only after that. */
  title: string
  /** Right-hand detail on the first line, e.g. a count and a time. */
  meta?: ReactNode
  /**
   * One quiet line under the title, indented to it: what the thing does now, or what came of it.
   * `null` or absent keeps the row to its first line.
   */
  note?: string | null
  /**
   * Controls of this row — a `⋯` menu — in the same list item, never inside the row's own button
   * (a button in a button is no button at all), laid over the right end of its first line. Quiet
   * until the row is hovered or holds the focus, always in the tab order; the arrows skip them.
   */
  actions?: ReactNode
  /** Something that opens under the row, in the same list item: a small field, for one. */
  below?: ReactNode
} & RowStatus

/**
 * A roomier row of a `List` (it carries the row mark, so the arrows walk it), for a list of a few entries that may each take the room they need.
 *
 * `ListRow` is a fixed 32 or 48px because its lists are read all day and every row that still
 * fits counts; a list of the subagents of one chat holds a handful, and there a row reads better
 * with air around it: 10px
 * above and below, the title in 13px `fg` over up to two lines, the glyph and the detail level
 * with its first line, and under it the note in 12px `muted`, one line, cut off with an ellipsis.
 * The same 8px gutter as `ListRow`, so the glyph stands on the left line of whatever holds it.
 *
 * The accessible name reads as that of a `ListRow` — title, status between commas, detail — with
 * the note last; the visible note is hidden from assistive technology, so it is heard once.
 */
export function RoomyListRow({
  title,
  kind,
  status,
  meta,
  note,
  actions,
  below,
  type = 'button',
  ...props
}: RoomyListRowProps) {
  const { className: _className, style: _style, ...rest } = props as ComponentPropsWithRef<'button'>
  return (
    <li className="group/roomy m-0">
      <div className="relative flex items-start">
        <button
          type={type}
          data-nt-list-row
          data-nt-list-roomy
          className="no-drag flex w-full min-w-0 flex-1 flex-col gap-1 rounded-md px-2 py-2.5 text-left outline-focus hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2"
          {...rest}
        >
          <span className="flex w-full items-start gap-2">
            {/* The glyph centred on the first line of the title, however many it takes. */}
            <span className="flex h-5 shrink-0 items-center">
              <StatusShape kind={kind ?? null} />
            </span>
            <span
              data-nt-list-title
              className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-5 break-words text-fg"
            >
              {title}
            </span>
            {status ? <span className="sr-only">, {status},</span> : null}
            {meta ? (
              <span className="flex h-5 shrink-0 items-center text-[11px] text-muted">{meta}</span>
            ) : null}
          </span>
          {note ? (
            <>
              <span
                aria-hidden="true"
                data-nt-list-note
                className="block w-full truncate ps-[22px] text-[12px] leading-4 text-muted"
              >
                {note}
              </span>
              <span className="sr-only">, {note}</span>
            </>
          ) : null}
        </button>
        {actions ? (
          // Over the right end of the first line, not beside it: at rest it takes no room from the
          // title and the detail, and in sight it covers the detail on the row's own hover colour.
          // Level with that line: 10px of padding plus the 20px line, around a control of 28px.
          <span className="no-drag absolute end-0 top-[6px] flex items-center rounded-md bg-surface opacity-0 group-focus-within/roomy:opacity-100 group-hover/roomy:opacity-100 has-[[data-state=open]]:opacity-100">
            {actions}
          </span>
        ) : null}
      </div>
      {below}
    </li>
  )
}
