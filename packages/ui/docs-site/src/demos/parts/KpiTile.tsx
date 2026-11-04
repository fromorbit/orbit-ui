import type { ReactNode } from 'react'
import { ProgressMeter, Sparkline, StatTile, TrendBadge, type TrendTone } from '../../../../src'

/** One made-up figure: what it counts, its value and the change against the period before. */
export interface Figure {
  label: string
  value: string
  delta: string
  /**
   * Whether the change is good for the reader: the colour follows this, the arrow follows
   * `rising`. `neutral` where more or less is not news by itself (use under a limit, recordings).
   */
  tone: TrendTone
  rising: boolean
  /** What the figure is compared with: "t.o.v. vorige week". */
  against?: string
  /** The course of the figure over the period, drawn as a sparkline under it. */
  trail?: readonly number[]
  /**
   * The same stretch of the period before, for a figure whose change is between the periods (the
   * builds of a week): a faint line behind the trail, and the two totals in its words.
   */
  previous?: readonly number[]
  /** A value of the trail in words, with its unit ("1 min 58 s"); a Dutch number without. */
  unit?: (value: number) => string
  /** How full it is, for a figure with a limit ("18,4 van 50 GB"): a meter instead of a line. */
  meter?: { value: number; max: number; text: string; note?: string }
}

/** A number of a sparkline in Dutch, for the words of its course. */
const nl = (value: number) => value.toLocaleString('nl-NL')

/**
 * The KPI card the dashboards share: a `StatTile` with a `TrendBadge` in it, and under it the
 * course of the period as a `Sparkline` or, for a figure with a limit, a `ProgressMeter` with its
 * share in words above it.
 */
export function KpiTile({ figure, period }: { figure: Figure; period: string }): ReactNode {
  const say = figure.unit ?? nl
  const first = figure.trail?.[0]
  const last = figure.trail?.[figure.trail.length - 1]
  const sum = (values: readonly number[]) => values.reduce((all, value) => all + value, 0)
  const totals =
    figure.previous && figure.trail
      ? `; ${say(sum(figure.trail))} in totaal, ${figure.against ?? 't.o.v. vorige periode'} ${say(sum(figure.previous))}`
      : ''
  const course =
    first === undefined || last === undefined
      ? ''
      : `, van ${say(first)} naar ${say(last)}${totals}`
  return (
    <StatTile
      label={figure.label}
      value={figure.value}
      trend={
        <TrendBadge
          value={figure.delta}
          direction={figure.rising ? 'up' : 'down'}
          tone={figure.tone}
          description={`${figure.rising ? 'Gestegen' : 'Gedaald'} met ${figure.delta}`}
        />
      }
      comparison={figure.against ?? 't.o.v. vorige periode'}
    >
      {figure.meter ? (
        <div className="mt-auto flex flex-col gap-1.5">
          {figure.meter.note ? (
            <span className="text-[11px] text-muted tabular-nums">{figure.meter.note}</span>
          ) : null}
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
          <Sparkline
            label={`${figure.label}, ${period}${course}`}
            values={figure.trail}
            {...(figure.previous ? { previous: figure.previous } : {})}
          />
        </div>
      ) : null}
    </StatTile>
  )
}
