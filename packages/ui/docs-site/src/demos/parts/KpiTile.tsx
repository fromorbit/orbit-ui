import type { ReactNode } from 'react'
import { ProgressMeter, Sparkline, StatTile, TrendBadge } from '../../../../src'

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
  /** The course of the figure over the period, drawn as a sparkline under it. */
  trail?: readonly number[]
  /** How full it is, for a figure with a limit ("18,4 van 50 GB"): a meter instead of a line. */
  meter?: { value: number; max: number; text: string }
}

/**
 * The KPI card the dashboards share: a `StatTile` with a `TrendBadge` in it, and under it the
 * course of the period as a `Sparkline` or, for a figure with a limit, a `ProgressMeter`.
 */
export function KpiTile({ figure, period }: { figure: Figure; period: string }): ReactNode {
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
    >
      {figure.meter ? (
        <div className="mt-auto flex h-7 items-end">
          <ProgressMeter
            value={figure.meter.value}
            max={figure.meter.max}
            label={figure.label}
            valueText={() => figure.meter?.text ?? ''}
            width="fill"
            count={false}
          />
        </div>
      ) : figure.trail ? (
        <div className="mt-auto">
          <Sparkline label={`${figure.label}, ${period}`} values={figure.trail} />
        </div>
      ) : null}
    </StatTile>
  )
}
