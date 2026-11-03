import type { ReactNode } from 'react'
import { StatTile, TrendBadge } from '../../../../src'

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

/** The KPI card the dashboards share: a `StatTile` with a `TrendBadge` in it. */
export function KpiTile({ figure }: { figure: Figure }): ReactNode {
  return (
    <StatTile
      label={figure.label}
      value={figure.value}
      trend={
        <TrendBadge
          value={figure.delta}
          direction={figure.rising ? 'up' : 'down'}
          tone={figure.good ? 'good' : 'bad'}
          description={`${figure.rising ? 'Gestegen' : 'Gedaald'} met ${figure.delta}`}
        />
      }
      comparison={figure.against ?? 't.o.v. vorige periode'}
    />
  )
}
