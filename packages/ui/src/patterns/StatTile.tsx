import { type ReactNode, useId } from 'react'

/** The props of `StatTile`. */
export interface StatTileProps {
  /** What the figure counts: "Actieve spaces". */
  label: string
  /** The figure, already formatted in the reader's locale: "1.284", "€ 12,4k". */
  value: string
  /** A `TrendBadge` with the change against the period before. */
  trend?: ReactNode
  /** What the change is measured against: "t.o.v. vorige week". */
  comparison?: string
  /** Something small at the top right: a `Pill` with the period, a menu. */
  aside?: ReactNode
  /** Under the figures: a sparkline, a `ProgressMeter`. */
  children?: ReactNode
}

/**
 * The card a dashboard starts with: what is counted, the figure large, and the change against the
 * period before.
 *
 * A group named by its label, so a screen reader that jumps through a row of tiles hears "Actieve
 * spaces, 1.284, 12% gestegen, t.o.v. vorige week" for each. The figure takes the heading weight
 * and tabular digits, so a row of tiles lines its numbers up. Several tiles stand in a grid the
 * caller lays out; a tile fills its cell. In a narrow tile the comparison wraps under the trend
 * rather than being cut: the words that explain the number stay whole.
 */
export function StatTile({ label, value, trend, comparison, aside, children }: StatTileProps) {
  const labelId = useId()
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset is for form controls, and a named section would make every tile a landmark.
    <div
      role="group"
      aria-labelledby={labelId}
      data-nt-stat-tile
      className="flex h-full min-w-0 flex-col gap-2 rounded-lg bg-overlay p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <p id={labelId} className="m-0 text-[12px] text-muted">
          {label}
        </p>
        {aside}
      </div>
      <p className="m-0 whitespace-nowrap font-heading text-[20px] text-fg tabular-nums leading-7">
        {value}
      </p>
      {trend !== undefined || comparison !== undefined ? (
        <p className="m-0 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px]">
          {trend}
          {comparison === undefined ? null : <span className="text-muted">{comparison}</span>}
        </p>
      ) : null}
      {children}
    </div>
  )
}
