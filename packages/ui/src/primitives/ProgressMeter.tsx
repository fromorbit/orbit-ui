/** How wide the bar is: a fixed 64px in a row of plans, or all the room of its column. */
const TRACK = {
  fixed: 'relative h-1 w-16 shrink-0 overflow-hidden rounded-full bg-mark',
  fill: 'relative h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-mark',
} as const

/**
 * The row around bar and count. A filling bar needs a row as wide as its column: in an inline row
 * that hugs its content, `flex-1` has nothing to grow into and the bar drew no pixels at all.
 */
const ROW = {
  fixed: 'inline-flex min-w-0 items-center gap-2',
  fill: 'flex w-full min-w-0 items-center gap-2',
} as const

/** The props of `ProgressMeter`. */
export interface ProgressMeterProps {
  /** How many are done: the steps of a plan, the criteria that pass. */
  value: number
  max: number
  /** The accessible name of the meter: what it measures ("PLAN-10", "Acceptatie"). */
  label: string
  /**
   * What a screen reader hears instead of a percentage: "2 van 5". A function, because the words
   * around the figures are the host's language.
   */
  valueText(value: number, max: number): string
  /** `fixed` (default): 64px, as in a row of plans; `fill`: the rest of its row. */
  width?: keyof typeof TRACK
  /** Shows `value/max` beside the bar, in mono; on by default. */
  count?: boolean
}

/**
 * A thin bar with its count beside it (`2/5`): the progress of a plan in Plannen en besluiten and
 * in Eigenschappen, and the criteria that pass under Acceptatie.
 *
 * `role="meter"`, not `progressbar`: it says how far something *is*, not how far a task that is
 * running has come, and a screen reader hears "2 van 5" (`aria-valuetext`) instead of a percentage.
 * The visible count is hidden from it, so it is heard once. The fill is `text-secondary`, not the
 * accent: colour is for the status shapes, and the value clamps to its ends.
 */
export function ProgressMeter({
  value,
  max,
  label,
  valueText,
  width = 'fixed',
  count = true,
}: ProgressMeterProps) {
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <span className={ROW[width]}>
      {/* biome-ignore lint/a11y/useSemanticElements: a native meter paints the gauge of the platform in colours of its own (green, amber) that only vendor pseudo-elements undo; a span takes the tokens. */}
      <span
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={valueText(value, max)}
        className={TRACK[width]}
      >
        <span
          data-nt-meter-fill
          className="absolute inset-y-0 left-0 rounded-full bg-secondary"
          // The one value no class can hold: the share itself.
          style={{ width: `${Math.round(share * 100)}%` }}
        />
      </span>
      {count ? (
        <span aria-hidden="true" className="shrink-0 font-mono text-[12px] text-muted tabular-nums">
          {value}/{max}
        </span>
      ) : null}
    </span>
  )
}
