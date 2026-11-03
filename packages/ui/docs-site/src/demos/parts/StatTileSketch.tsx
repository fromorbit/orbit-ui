import type { ReactNode } from 'react'
import { Icon } from '../../../../src'
import { Missing } from '../../demo-kit/Missing'

/** One made-up figure: what it counts, its value and the change against the period before. */
export interface Figure {
  label: string
  value: string
  delta: string
  /** Whether the change is good news; the arrow follows `rising`, the colour follows this. */
  good: boolean
  rising: boolean
  /** What the figure is compared with: "t.o.v. vorige week". */
  against?: string
}

/**
 * The KPI card the dashboards share, drawn as the two missing pieces it would be: a `StatTile`
 * with a `TrendBadge` in it.
 */
export function StatTileSketch({ figure }: { figure: Figure }): ReactNode {
  return (
    <Missing name="StatTile">
      <div className="flex h-full flex-col gap-1.5 rounded-xl border border-border bg-overlay p-3.5 @lg:p-4">
        <p className="m-0 text-[12px] text-muted">{figure.label}</p>
        <p className="m-0 whitespace-nowrap font-heading text-[22px] text-fg leading-8 @lg:text-[26px] tabular-nums tracking-[-0.02em]">
          {figure.value}
        </p>
        <p className="m-0 flex min-w-0 items-center gap-1.5 text-[11.5px]">
          <Missing name="TrendBadge" inline>
            <span
              className={`inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-px font-medium tabular-nums ${
                figure.good ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger'
              }`}
            >
              <Icon name={figure.rising ? 'arrow-up' : 'arrow-down'} size="sm" />
              {figure.delta}
            </span>
          </Missing>
          <span className="truncate text-muted">{figure.against ?? 't.o.v. vorige periode'}</span>
        </p>
      </div>
    </Missing>
  )
}
