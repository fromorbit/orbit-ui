import type { ReactNode } from 'react'

/** The props of `Timeline`. */
export interface TimelineProps {
  /** The name of the list: "Activiteit". */
  label: string
  /** `TimelineItem`s, the oldest or the newest first, as the caller orders them. */
  children: ReactNode
}

/** The props of `TimelineItem`. */
export interface TimelineItemProps {
  /**
   * The sign on the line: an `Icon` for an event, an `Avatar` for a person. Drawn in a round of
   * 24px on the line; decorative, since the text says what happened.
   */
  marker: ReactNode
  /** When, as the reader reads it: a `RelativeTime`, "2 u". */
  time?: ReactNode
  /** What happened: a sentence, or a card for a comment. */
  children: ReactNode
}

/**
 * Events under each other on one line, each with its sign and its time: the activity of a spec, the
 * history of a payment, the comments on a task.
 *
 * An ordered list (`<ol>`), so a screen reader hears how many events there are and walks them in
 * order. The line runs behind the markers; each marker stands on the plane of the page, so the line
 * seems to pass under it.
 */
export function Timeline({ label, children }: TimelineProps) {
  return (
    <ol
      aria-label={label}
      data-nt-timeline
      className="relative m-0 flex list-none flex-col gap-4 p-0 text-[13px] before:absolute before:top-3 before:bottom-3 before:left-3 before:w-px before:-translate-x-1/2 before:bg-border"
    >
      {children}
    </ol>
  )
}

/** One event of a `Timeline`. */
export function TimelineItem({ marker, time, children }: TimelineItemProps) {
  return (
    <li className="relative flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-bg text-muted"
      >
        {marker}
      </span>
      <div className="flex min-h-6 min-w-0 flex-1 items-center text-secondary">{children}</div>
      {time === undefined ? null : (
        <span className="flex h-6 shrink-0 items-center text-[12px] text-muted">{time}</span>
      )}
    </li>
  )
}
