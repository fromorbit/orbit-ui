import type { ReactNode } from 'react'
import { Missing } from '../../demo-kit/Missing'

/** One made-up figure: what it counts, its value and the change against the period before. */
export interface Figure {
  label: string
  value: string
  delta: string
  up: boolean
}

/**
 * The KPI card the dashboard and the payments share, drawn as the two missing pieces it would be:
 * a `StatTile` with a `TrendBadge` in it.
 */
export function StatTileSketch({ figure }: { figure: Figure }): ReactNode {
  return (
    <Missing name="StatTile">
      <p className="m-0 text-[12px] text-muted">{figure.label}</p>
      <p className="m-0 whitespace-nowrap text-[22px] font-medium text-fg tabular-nums">
        {figure.value}
      </p>
      <span>
        <Missing name="TrendBadge" inline>
          <span
            className={
              figure.up
                ? 'whitespace-nowrap text-[11px] text-success tabular-nums'
                : 'whitespace-nowrap text-[11px] text-danger tabular-nums'
            }
          >
            {figure.up ? '▲' : '▼'} {figure.delta}
          </span>
        </Missing>
      </span>
    </Missing>
  )
}
