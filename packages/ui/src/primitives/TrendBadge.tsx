import { Icon } from './Icon'

/** Which way a figure went. */
export type TrendDirection = 'up' | 'down' | 'flat'

/** Whether that is good news: the colour follows this, the arrow follows the direction. */
export type TrendTone = 'good' | 'bad' | 'neutral'

/** The props of `TrendBadge`. */
export interface TrendBadgeProps {
  /** The change as it is shown: "12%", "+3", "€ 1.240". */
  value: string
  direction: TrendDirection
  /**
   * Whether the change is good news. Separate from the direction: fewer failed builds is down and
   * good, more cost is up and bad.
   */
  tone: TrendTone
  /**
   * The change in words for a screen reader, which cannot see the arrow: "12% gestegen". Read
   * instead of `value`.
   */
  description: string
}

// Written out per tone: Tailwind finds a class only as a literal in the source.
const TONE: Record<TrendTone, string> = {
  good: 'bg-success/12 text-success',
  bad: 'bg-danger-subtle text-danger',
  neutral: 'bg-mark text-secondary',
}

const ARROW = { up: 'arrow-up', down: 'arrow-down', flat: 'arrow-right' } as const

/**
 * A small label for a change: an arrow, the figure, green for good news and red for bad.
 *
 * The arrow says the direction and the colour says the verdict, two things that do not always
 * agree, so both are props. Colour is never the only sign: the arrow carries the direction, and a
 * screen reader hears `description` in place of the badge.
 */
export function TrendBadge({ value, direction, tone, description }: TrendBadgeProps) {
  return (
    <span
      data-nt-trend={tone}
      className={`inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-px font-medium text-[11px] tabular-nums ${TONE[tone]}`}
    >
      <Icon name={ARROW[direction]} size="xs" />
      <span aria-hidden="true">{value}</span>
      <span className="sr-only">{description}</span>
    </span>
  )
}
