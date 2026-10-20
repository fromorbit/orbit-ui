import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Icon } from '../primitives/Icon'

/**
 * The item. No hairline between items: together with the soft card of the current
 * one they drew a grid of cards; the padding of the rows and that card carry the separation.
 */
const ITEM = 'group/stacked relative m-0 list-none'

/**
 * The button, at rest and current, of three lines (72px) and of two (56px). Exhaustive rather than
 * a base plus a variant: with no class-merging tool, `hover:bg-row-hover` beside `bg-row-active`
 * would leave the current card to the order Tailwind generates them in.
 */
const ROW = {
  rest: 'no-drag flex h-18 w-full min-w-0 flex-col rounded-[8px] px-3 py-2.5 text-left outline-focus hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2',
  current:
    'no-drag flex h-18 w-full min-w-0 flex-col rounded-[8px] bg-row-active px-3 py-2.5 text-left outline-focus focus-visible:outline-2 focus-visible:outline-offset-2',
  restShort:
    'no-drag flex h-14 w-full min-w-0 flex-col rounded-[8px] px-3 py-2.5 text-left outline-focus hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2',
  currentShort:
    'no-drag flex h-14 w-full min-w-0 flex-col rounded-[8px] bg-row-active px-3 py-2.5 text-left outline-focus focus-visible:outline-2 focus-visible:outline-offset-2',
} as const

/** A quiet line of 11px on 16: the first and the third. */
const SMALL_LINE = 'flex h-4 min-w-0 items-center gap-2 text-[11px] leading-4 text-muted'

/**
 * The title: 14px on 20, bright at 500 while there is news or it is chosen, secondary at 400 once
 * seen. The weight carries unread as much as the brightness does: `text` against
 * `text-secondary` alone was hardly to be seen.
 */
const TITLE = {
  bright: 'h-5 min-w-0 truncate text-[14px] leading-5 font-medium text-fg',
  seen: 'h-5 min-w-0 truncate text-[14px] leading-5 font-normal text-secondary',
} as const

/** The props of `StackedRow`. */
export type StackedRowProps = Omit<
  ComponentPropsWithRef<'button'>,
  'className' | 'style' | 'children' | 'title' | 'aria-label'
> & {
  /**
   * The accessible name, which the caller composes: title, project, status, branch, time and pinned.
   * Required, because the three lines read aloud one after another say less than a
   * sentence made for the ear, and a status shape on its own has no words.
   */
  label: string
  /** Line 1, left: the project (`ProjectMark` and its name). */
  meta: ReactNode
  /** Line 1, right: the relative time. */
  trailingMeta?: ReactNode
  /** Draws `pin` (12px, faint) before the time: a chat pinned to the list. */
  pinned?: boolean
  /** Line 2: the title, cut off with an ellipsis. */
  title: string
  /**
   * Line 2, before the title: the status shape, in a box of 14px that stays there empty when
   * there is no status, so every title of the column starts on one line
   * (the shape stands left of the title, everywhere). Left out, no box at all.
   */
  status?: ReactNode | null
  /**
   * Line 3, left: the branch, `StackedRowBranch`, or what asks for you. Left out together with
   * `trailingDetail`, the item has no third line and stands 56px high.
   */
  detail?: ReactNode
  /** Line 3, right: the changes (`+n −m`), or another fact about where it works. */
  trailingDetail?: ReactNode
  /** The chosen item: the soft card and `aria-current="page"`. */
  current?: boolean
  /** Seen since its last news: the title steps back to `text-secondary` (K2). */
  seen?: boolean
  /**
   * A control beside the row, such as its menu (`⋯`): rendered next to the button, never inside
   * it, at the end of line 1 where the time stands. Always in the DOM, so the keyboard reaches it;
   * shown on hover and on keyboard focus within the item, while the time steps aside for it, so the two
   * share one spot rather than each owning its own (as `ListRow` does).
   */
  actions?: ReactNode
}

/**
 * An item of three lines, the chat of the sidebar: 72px, lines of 16 · 20 · 16 in a padding of
 * 10/12, radius 8 — or of two (56px) when the third would say nothing.
 *
 * Line 1 is the project and the time, line 2 the status shape and the title, line 3 the branch;
 * each line has a slot at the start and at the end, and knows nothing of chats, so the inbox
 * and the Specs list can stack their own lines in it. Brightness says what is new (no dot for
 * unread): the title is `text` at 500 until the reader has seen it, then `text-secondary` at 400.
 * The chosen item is a soft card of white 7%, no border and no accent, and no hairline between items.
 *
 * A row of a `List` (it carries the row mark, so the arrows, Home and End walk it), rendered as its
 * own `<li>`.
 */
export function StackedRow({
  label,
  meta,
  trailingMeta,
  pinned = false,
  title,
  status,
  detail,
  trailingDetail,
  current = false,
  seen = false,
  actions,
  type = 'button',
  ...props
}: StackedRowProps) {
  const { className: _className, style: _style, ...rest } = props as ComponentPropsWithRef<'button'>
  const third = detail !== undefined || trailingDetail !== undefined
  return (
    <li className={ITEM} data-current={current ? '' : undefined}>
      <button
        type={type}
        aria-label={label}
        aria-current={current ? 'page' : undefined}
        data-nt-list-row
        data-nt-stacked-row
        className={
          third ? (current ? ROW.current : ROW.rest) : current ? ROW.currentShort : ROW.restShort
        }
        {...rest}
      >
        <span data-nt-stacked-line="meta" className={SMALL_LINE}>
          <span data-nt-stacked-start className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
            {meta}
          </span>
          {trailingMeta !== undefined || pinned ? (
            <span
              data-nt-stacked-end
              className={`flex shrink-0 items-center gap-1 tabular-nums ${
                actions === undefined
                  ? ''
                  : 'group-hover/stacked:opacity-0 group-has-[:focus-visible]/stacked:opacity-0'
              }`}
            >
              {pinned ? <Icon name="pin" size="xs" tone="faint" /> : null}
              {trailingMeta}
            </span>
          ) : null}
        </span>
        {status === undefined ? (
          <span
            data-nt-stacked-line="title"
            data-nt-stacked-title
            className={seen && !current ? TITLE.seen : TITLE.bright}
          >
            {title}
          </span>
        ) : (
          <span data-nt-stacked-line="title" className="flex h-5 min-w-0 items-center gap-2">
            <span className="flex size-3.5 shrink-0 items-center justify-center">{status}</span>
            <span data-nt-stacked-title className={seen && !current ? TITLE.seen : TITLE.bright}>
              {title}
            </span>
          </span>
        )}
        {third ? (
          <span data-nt-stacked-line="detail" className={SMALL_LINE}>
            <span
              data-nt-stacked-start
              className="flex min-w-0 flex-1 items-center gap-1.5 truncate"
            >
              {detail}
            </span>
            {trailingDetail === undefined ? null : (
              <span data-nt-stacked-end className="flex shrink-0 items-center gap-1.5">
                {trailingDetail}
              </span>
            )}
          </span>
        ) : null}
      </button>
      {actions === undefined ? null : (
        // On line 1, at its end: 10px from the top of the item and 12px in, less the few pixels a
        // 24px control stands out beyond the 16px line. Shown on hover and on keyboard focus, not
        // on the focus a click leaves behind: the chosen row keeps its time or its "#1" (A28).
        <span
          data-nt-stacked-actions
          className="no-drag absolute top-1.5 right-2 flex items-center opacity-0 group-hover/stacked:opacity-100 group-has-[:focus-visible]/stacked:opacity-100"
        >
          {actions}
        </span>
      )}
    </li>
  )
}

/** The props of `StackedRowBranch`. */
export interface StackedRowBranchProps {
  /** The branch as git names it. */
  name: string
  /** The chat has a worktree of its own: `folder-git-2` before the name, "its own copy". */
  worktree?: boolean
}

/**
 * The third line of a chat: the branch, with `folder-git-2` (12px, faint) before it when the chat
 * works in a worktree of its own, and no icon for a branch of the checkout itself such as `main`.
 */
export function StackedRowBranch({ name, worktree = false }: StackedRowBranchProps) {
  return (
    <>
      {worktree ? <Icon name="folder-git-2" size="xs" tone="faint" /> : null}
      <span className="min-w-0 truncate">{name}</span>
    </>
  )
}
