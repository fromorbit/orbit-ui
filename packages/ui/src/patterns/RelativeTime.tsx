const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

/**
 * The words of a relative time, in the host's language: functions, because the count goes inside
 * the words ("5 min", "2 h").
 */
export interface RelativeTimeLabels {
  /** Under a minute ago, and any moment in the future: "nu". */
  now: string
  minutes(count: number): string
  hours(count: number): string
  days(count: number): string
  weeks(count: number): string
}

/**
 * Formats how long ago a timestamp was. Compact, as fits in a list: "nu", "5 min", "2 u", "3 d", "4
 * w".
 *
 * Exported for a row that needs the text for its own accessible name as well and draws it with
 * {@link RelativeTimeText}. The thresholds are tested through the component.
 *
 * @param labels The units in the host's language, as the component takes them.
 */
export function formatRelativeTime(
  timestamp: number,
  now: number,
  labels: RelativeTimeLabels,
): string {
  const elapsed = now - timestamp
  if (elapsed < MINUTE) return labels.now
  if (elapsed < HOUR) return labels.minutes(Math.floor(elapsed / MINUTE))
  if (elapsed < DAY) return labels.hours(Math.floor(elapsed / HOUR))
  if (elapsed < WEEK) return labels.days(Math.floor(elapsed / DAY))
  return labels.weeks(Math.floor(elapsed / WEEK))
}

/** The props of `RelativeTime`. */
export interface RelativeTimeProps {
  /** The moment itself, as an epoch in milliseconds. */
  at: number
  /**
   * The moment to compare against, passed in rather than read from the clock: a list re-renders on
   * one shared `now`, so every row in it ages at the same instant and a test can hold time still.
   */
  now: number
  /**
   * The units in the host's language ("nu", "5 min"); the library holds none, and the
   * host's plural rules come with them.
   */
  labels: RelativeTimeLabels
}

/**
 * How long ago something happened, in the few characters a list row can spare.
 *
 * A `<time dateTime=…>` rather than a bare span: the short form loses the date, and the ISO value
 * keeps it for anything that reads the page rather than looks at it. Size and colour come from the
 * row around it (meta text is 11px and muted); only the digit alignment is its own, so a column of
 * times does not jitter as the numbers change.
 */
export function RelativeTime({ at, now, labels }: RelativeTimeProps) {
  return <RelativeTimeText at={at} text={formatRelativeTime(at, now, labels)} />
}

/**
 * The same element for a caller that already formatted the time, with `formatRelativeTime`.
 *
 * A row of the sidebar formats it for its own accessible name; drawing it through `RelativeTime`
 * as well cost two hundred rows a second format (and, then, a translation hook) each at start-up.
 */
export function RelativeTimeText({ at, text }: { at: number; text: string }) {
  return (
    <time dateTime={new Date(at).toISOString()} className="shrink-0 tabular-nums">
      {text}
    </time>
  )
}
