import type { ReactNode } from 'react'
import { Missing } from '../../demo-kit/Missing'

/** One bar of the chart: its label on the axis and the two parts it is stacked from. */
export interface Bar {
  label: string
  /** The main part, in the monochrome accent. */
  value: number
  /** A part on top that went wrong, in the danger colour. */
  failed?: number
}

/** The props of {@link ChartSketch}. */
export interface ChartSketchProps {
  bars: readonly Bar[]
  /** What the main and the failed part are called, for the legend. */
  legend: { value: string; failed?: string }
  /** The unit of the axis values ("builds"). */
  unit: string
  /** What it would do here, for the mark's tooltip. */
  note?: string
}

/** The step between two lines of the grid, so there are three or four of them. */
function stepOf(max: number): number {
  const rough = max / 4
  const power = 10 ** Math.floor(Math.log10(rough))
  return [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((step) => step >= rough) ?? rough
}

/**
 * A stacked bar chart drawn from the tokens, as the missing `Chart` would draw it: a grid with its
 * values, monochrome bars (Paper on Midnight, Midnight on Paper), failures in red on top, and a
 * label under every few bars. The bars are plain elements, so the chart follows the frame's width.
 */
export function ChartSketch({ bars, legend, unit, note }: ChartSketchProps): ReactNode {
  const max = Math.max(...bars.map((bar) => bar.value + (bar.failed ?? 0)), 1)
  const step = stepOf(max)
  const top = Math.ceil(max / step) * step
  const lines = Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step)
  const every = Math.ceil(bars.length / 8)
  return (
    <Missing name="Chart" {...(note === undefined ? {} : { note })}>
      <figure className="m-0 flex flex-col gap-3">
        <figcaption className="flex items-center gap-4 text-[12px] text-secondary">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-[3px] bg-accent" />
            {legend.value}
          </span>
          {legend.failed === undefined ? null : (
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-[3px] bg-danger" />
              {legend.failed}
            </span>
          )}
        </figcaption>
        <div className="flex gap-2">
          <div
            aria-hidden="true"
            className="relative h-48 w-8 shrink-0 text-right text-[11px] text-muted tabular-nums"
          >
            {lines.map((line) => (
              <span
                key={line}
                className="absolute right-0 translate-y-1/2"
                style={{ bottom: `${(line / top) * 100}%` }}
              >
                {line}
              </span>
            ))}
          </div>
          <div className="relative h-48 min-w-0 flex-1">
            {lines.map((line) => (
              <div
                key={line}
                aria-hidden="true"
                className={`absolute inset-x-0 border-t ${line === 0 ? 'border-border-strong' : 'border-border border-dashed'}`}
                style={{ bottom: `${(line / top) * 100}%` }}
              />
            ))}
            <ol
              aria-label={`${unit} per dag`}
              className="relative m-0 flex h-full list-none items-end justify-around gap-[3px] p-0"
            >
              {bars.map((bar) => (
                <li
                  key={bar.label}
                  title={`${bar.label}: ${bar.value} ${legend.value.toLowerCase()}${bar.failed ? `, ${bar.failed} ${legend.failed?.toLowerCase() ?? ''}` : ''}`}
                  className="group flex h-full min-w-0 max-w-14 flex-1 flex-col justify-end"
                >
                  <span className="sr-only">{`${bar.label}: ${bar.value} ${unit}`}</span>
                  {bar.failed ? (
                    <span
                      className="block rounded-t-[3px] bg-danger"
                      style={{ height: `${(bar.failed / top) * 100}%` }}
                    />
                  ) : null}
                  <span
                    className={`block bg-accent opacity-85 group-hover:opacity-100 ${bar.failed ? '' : 'rounded-t-[3px]'}`}
                    style={{ height: `${(bar.value / top) * 100}%` }}
                  />
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="flex justify-around gap-[3px] pl-10 text-[11px] text-muted"
        >
          {bars.map((bar, index) => (
            <span
              key={bar.label}
              className="min-w-0 max-w-14 flex-1 overflow-visible whitespace-nowrap text-center"
            >
              {index % every === 0 ? bar.label : ''}
            </span>
          ))}
        </div>
      </figure>
    </Missing>
  )
}
