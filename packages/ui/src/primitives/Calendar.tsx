import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useUi } from '../provider/UiProvider'
import { IconButton } from './IconButton'

/**
 * A day as `YYYY-MM-DD`: a date without a time or a zone, so "the 3rd" is the 3rd for every reader
 * and every server, and two days compare as text.
 */
export type IsoDate = string

/** The words of `Calendar`. */
export interface CalendarLabels {
  previousMonth: string
  nextMonth: string
}

/** The props of `Calendar`. */
export interface CalendarProps {
  /** The chosen day, or `null`. */
  value: IsoDate | null
  onValueChange(value: IsoDate): void
  labels: CalendarLabels
  /** The first day that may be chosen. */
  min?: IsoDate
  /** The last day that may be chosen. */
  max?: IsoDate
  /** Any other day that may not be chosen, such as a weekend. */
  isDisabled?(day: IsoDate): boolean
  /** Today, for the mark and the first month shown; the reader's own today by default. */
  today?: IsoDate
  /** 1 for Monday (default, as in the Netherlands), 0 for Sunday. */
  weekStartsOn?: 0 | 1
  /** Moves the focus into the grid when it mounts: for the panel of a `DatePicker`. */
  autoFocus?: boolean
}

/** A day as a UTC date: the arithmetic of days never meets a change of summer time. */
function toDate(day: IsoDate): Date {
  const [year = 1970, month = 1, date = 1] = day.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, date))
}

/** A UTC date as a day. */
function toIso(date: Date): IsoDate {
  return date.toISOString().slice(0, 10)
}

/** Whether a text is a real day as `YYYY-MM-DD`. */
export function isIsoDate(text: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && toIso(toDate(text)) === text
}

/** The day `count` days after `day` (before, when negative). */
export function addDays(day: IsoDate, count: number): IsoDate {
  const date = toDate(day)
  date.setUTCDate(date.getUTCDate() + count)
  return toIso(date)
}

/** The same day `count` months later, on the last day of a shorter month: 31 Jan + 1 is 28 Feb. */
export function addMonths(day: IsoDate, count: number): IsoDate {
  const date = toDate(day)
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1))
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(date.getUTCDate(), last))
  return toIso(target)
}

/** The reader's today, in their own zone. */
export function todayIso(): IsoDate {
  const now = new Date()
  return toIso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())))
}

/** The six weeks of seven days that show the month of `day`, starting on `weekStartsOn`. */
export function monthGrid(day: IsoDate, weekStartsOn: 0 | 1): IsoDate[][] {
  const first = toDate(day)
  first.setUTCDate(1)
  const back = (first.getUTCDay() - weekStartsOn + 7) % 7
  const start = addDays(toIso(first), -back)
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => addDays(start, week * 7 + weekday)),
  )
}

/** Whether two days lie in the same month. */
function sameMonth(a: IsoDate, b: IsoDate): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

/**
 * One month as a grid of days to choose one from: the calendar of a `DatePicker`, or standing on
 * its own beside a form.
 *
 * A table of day buttons, named by its month, with the keys of the ARIA date picker: the arrows move a day or a week, Page Up and Page Down a month
 * (with Shift a year), Home and End to the start and end of the week, Enter or Space chooses. The
 * grid is one tab stop; the focus walks over the days and turns the month when it leaves it. The
 * names of months and weekdays come from `Intl` in the provider's locale, so the calendar holds no
 * word of its own beyond the two buttons. Days are `YYYY-MM-DD` throughout: no time and no zone,
 * so no reader ever sees the day before.
 */
export function Calendar({
  value,
  onValueChange,
  labels,
  min,
  max,
  isDisabled,
  today = todayIso(),
  weekStartsOn = 1,
  autoFocus = false,
}: CalendarProps) {
  const { locale } = useUi()
  const [focused, setFocused] = useState<IsoDate>(value ?? today)
  const grid = useMemo(() => monthGrid(focused, weekStartsOn), [focused, weekStartsOn])
  const gridRef = useRef<HTMLTableElement>(null)
  const moved = useRef(autoFocus)

  const title = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(toDate(focused))
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
  const weekdayLong = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' })
  const dayName = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' })

  const blocked = (day: IsoDate) =>
    (min !== undefined && day < min) ||
    (max !== undefined && day > max) ||
    (isDisabled?.(day) ?? false)

  // After a key moved the focus to another day, the button of that day takes it.
  useEffect(() => {
    if (!moved.current) return
    moved.current = false
    gridRef.current?.querySelector<HTMLElement>(`[data-day="${focused}"]`)?.focus()
  }, [focused])

  function move(next: IsoDate) {
    moved.current = true
    setFocused(next)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const weekdayIndex = (toDate(focused).getUTCDay() - weekStartsOn + 7) % 7
    const steps: Record<string, () => IsoDate> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
      Home: () => addDays(focused, -weekdayIndex),
      End: () => addDays(focused, 6 - weekdayIndex),
    }
    const step = steps[event.key]
    if (step) {
      event.preventDefault()
      move(step())
    }
  }

  return (
    <div data-nt-calendar className="inline-flex flex-col gap-2 p-1">
      <div className="flex items-center justify-between gap-2">
        <IconButton
          icon="chevron-left"
          label={labels.previousMonth}
          size="sm"
          variant="ghost"
          onClick={() => setFocused(addMonths(focused, -1))}
        />
        <p
          aria-live="polite"
          className="m-0 font-medium text-[13px] text-fg first-letter:uppercase"
        >
          {title}
        </p>
        <IconButton
          icon="chevron-right"
          label={labels.nextMonth}
          size="sm"
          variant="ghost"
          onClick={() => setFocused(addMonths(focused, 1))}
        />
      </div>
      <table ref={gridRef} aria-label={title} onKeyDown={onKeyDown} className="border-collapse">
        <thead>
          <tr>
            {grid[0]?.map((day) => (
              <th
                key={day}
                scope="col"
                abbr={weekdayLong.format(toDate(day))}
                className="size-8 p-0 font-normal text-[11px] text-muted"
              >
                {weekday.format(toDate(day)).slice(0, 2)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((week) => (
            <tr key={week[0]}>
              {week.map((day) => {
                const inMonth = sameMonth(day, focused)
                const chosen = day === value
                const off = blocked(day)
                const cell = chosen
                  ? 'bg-accent text-accent-fg'
                  : day === today
                    ? 'text-accent-text font-semibold hover:bg-surface-hover'
                    : inMonth
                      ? 'text-fg hover:bg-surface-hover'
                      : 'text-muted hover:bg-surface-hover'
                return (
                  <td key={day} className="p-0">
                    <button
                      type="button"
                      data-day={day}
                      tabIndex={day === focused ? 0 : -1}
                      aria-label={dayName.format(toDate(day))}
                      aria-current={day === today ? 'date' : undefined}
                      aria-pressed={chosen}
                      // `aria-disabled`, not `disabled`: a day that may not be chosen still takes the
                      // walking focus, or the arrows would lose the grid's one tab stop on it.
                      aria-disabled={off || undefined}
                      onClick={() => {
                        setFocused(day)
                        if (!off) onValueChange(day)
                      }}
                      className={`no-drag flex size-8 items-center justify-center rounded-md text-[12px] tabular-nums outline-focus focus-visible:outline-2 focus-visible:outline-offset-1 aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:bg-transparent ${cell}`}
                    >
                      {Number(day.slice(8))}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
