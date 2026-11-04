import { type ReactNode, type RefObject, useId, useLayoutEffect, useRef, useState } from 'react'

/** How a chart draws its values: columns from a baseline, or lines through the points. */
export type ChartKind = 'bar' | 'line'

/**
 * The ink of a series. `mark` is the quiet default of the kit (`--nt-chart-mark`); a status colour
 * only for a series that means that status ("Mislukt" in `danger`), never for "the third series".
 */
export type ChartTone = 'mark' | 'accent' | 'danger' | 'attention' | 'success'

/** One series of a chart: its name in the legend, the tooltip and the table. */
export interface ChartSeries {
  id: string
  label: string
  tone?: ChartTone
  /**
   * A line to measure against (a plan, a limit): dashed in `--nt-chart-reference`, without a dot or a
   * wash. Only in a line chart.
   */
  reference?: boolean
}

/** One point on the horizontal axis: its label and one value per series. */
export interface ChartPoint {
  /** "ma", "14:00", "3 okt". */
  label: string
  /** One value per series, in the order of `series`; `null` where there is none (a day to come). */
  values: readonly (number | null)[]
}

/** The props of `Chart`. */
export interface ChartProps {
  /** The name of the chart, the caption of its table for a screen reader: "Builds per dag". */
  label: string
  kind?: ChartKind
  series: readonly ChartSeries[]
  points: readonly ChartPoint[]
  /** A value as the reader writes it, on the axis and in the tooltip; the host's locale without. */
  format?: (value: number) => string
  /** The height of the plot in px, without the legend and the labels under it. 192 without. */
  height?: number
  /** While the data is on its way: the words a screen reader hears ("Builds laden"). */
  loading?: string
  /** The words in the empty plot when there are no points or every value is zero. */
  empty?: string
}

const TONE: Record<ChartTone, string> = {
  mark: 'var(--nt-chart-mark)',
  accent: 'var(--nt-accent)',
  danger: 'var(--nt-danger)',
  attention: 'var(--nt-attention-fill)',
  success: 'var(--nt-success)',
}
const REFERENCE = 'var(--nt-chart-reference)'
/** The ring around a dot: the plane the chart lies on, a card unless the host sets it. */
const GROUND = 'var(--nt-chart-ground, var(--nt-overlay-background))'

/** Air above the top line of the grid, so a dot or a rounded end on it is not cut. */
const PAD_TOP = 8
/** The widest a bar gets: thin marks, the rest of the band is air. */
const BAR_MAX = 24
/** The rounded end of a bar and the gap between the parts of a stacked one. */
const RADIUS = 4
const GAP = 2

function defaultFormat(value: number): string {
  return new Intl.NumberFormat().format(value)
}

/** A step between grid lines of 1, 2, 2.5 or 5 times a power of ten, so there are three to five. */
export function chartStep(max: number): number {
  if (max <= 0) return 1
  const rough = max / 4
  const power = 10 ** Math.floor(Math.log10(rough))
  return [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((step) => step >= rough) ?? rough
}

/** The values of the grid, from zero to the first step at or above the largest value. */
export function chartTicks(max: number): number[] {
  const step = chartStep(max)
  const top = Math.max(step, Math.ceil(max / step) * step)
  return Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step)
}

/** The width of an element, followed as it changes; a fallback where nothing can measure (a test). */
function useWidth(ref: RefObject<HTMLElement | null>, fallback: number): number {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => setWidth(element.getBoundingClientRect().width)
    measure()
    if (typeof ResizeObserver !== 'function') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return width > 0 ? width : fallback
}

/** A column with a rounded end at the top and a square foot on the baseline. */
function columnPath(x: number, y: number, width: number, height: number, round: boolean): string {
  const r = round ? Math.min(RADIUS, width / 2, height) : 0
  const bottom = y + height
  if (r === 0) return `M${x},${bottom}V${y}H${x + width}V${bottom}Z`
  return `M${x},${bottom}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}H${x + width - r}A${r},${r} 0 0 1 ${x + width},${y + r}V${bottom}Z`
}

/** The runs of a series between its gaps, as the points of a path. */
function runs(points: readonly ChartPoint[], index: number): [number, number][][] {
  const out: [number, number][][] = []
  let run: [number, number][] = []
  points.forEach((point, at) => {
    const value = point.values[index]
    if (value === null || value === undefined) {
      if (run.length > 0) out.push(run)
      run = []
    } else run.push([at, value])
  })
  if (run.length > 0) out.push(run)
  return out
}

/** The key of a series in the legend and the tooltip: a square for a bar, a stroke for a line. */
function Key({ kind, series }: { kind: ChartKind; series: ChartSeries }): ReactNode {
  const color = series.reference ? REFERENCE : TONE[series.tone ?? 'mark']
  if (kind === 'bar') {
    return (
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-[2px]"
        style={{ background: color }}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="w-3 shrink-0 border-t-2"
      style={{ borderColor: color, borderTopStyle: series.reference ? 'dashed' : 'solid' }}
    />
  )
}

/** Varied heights of the shapes that stand in for the bars while the data loads. */
const LOADING_SHAPE = [42, 58, 50, 72, 64, 36, 30, 54, 68, 60, 46, 28]

/**
 * A bar or line chart drawn from the tokens: a quiet grid with its values at the left, the labels
 * of the points under it, a legend for two series or more, and a tooltip under the pointer.
 *
 * Bars are thin (at most 24px, the rest of the band is air), stand square on the baseline with a
 * 4px rounded end, and a stacked bar keeps a 2px gap between its parts. A line is 2px with round
 * joins; a single line lies on a wash of its own ink, a `reference` series (a plan) is dashed in
 * `--nt-chart-reference`. The marks are `--nt-chart-mark`, a step quieter than the accent, so a row of bars
 * reads calmly and the one under the pointer turns to the accent (one emphasis per view).
 *
 * The drawing is decoration for the eye (`aria-hidden`); a screen reader gets the same values as a
 * table named by `label`. While `loading` the plot shows soft shapes and the figure is busy; with
 * no values it is the grid with the words of `empty`. The chart follows the width of its parent.
 */
export function Chart({
  label,
  kind = 'bar',
  series,
  points,
  format = defaultFormat,
  height = 192,
  loading,
  empty,
}: ChartProps): ReactNode {
  const plot = useRef<HTMLDivElement>(null)
  const width = useWidth(plot, 600)
  const tableId = useId()
  const [active, setActive] = useState<number | null>(null)

  const totals = points.map((point) =>
    kind === 'bar'
      ? point.values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
      : Math.max(0, ...point.values.map((value) => value ?? 0)),
  )
  const max = Math.max(0, ...totals)
  const isEmpty = loading === undefined && max === 0
  const ticks = chartTicks(max)
  const top = ticks[ticks.length - 1] ?? 1
  const inner = height - PAD_TOP
  const y = (value: number) => PAD_TOP + inner * (1 - value / top)
  const count = Math.max(points.length, 1)
  const band = width / count
  const center = (index: number) => band * (index + 0.5)
  const barWidth = Math.max(1, Math.min(BAR_MAX, band * 0.6))
  const longest = Math.max(...points.map((point) => point.label.length), 1)
  const every = Math.max(1, Math.ceil((count * (longest * 6.5 + 16)) / width))
  const drawn = loading === undefined && !isEmpty
  const plain = series.filter((entry) => !entry.reference)
  const activePoint = active === null ? undefined : points[active]

  const onPointer = (clientX: number) => {
    const box = plot.current?.getBoundingClientRect()
    if (!box || points.length === 0) return
    const index = Math.floor(((clientX - box.left) / box.width) * points.length)
    setActive(Math.min(points.length - 1, Math.max(0, index)))
  }

  return (
    <figure
      aria-busy={loading === undefined ? undefined : true}
      data-nt-chart={kind}
      className="m-0 flex min-w-0 flex-col gap-3"
    >
      {series.length > 1 ? (
        <ul
          aria-hidden="true"
          className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-[12px] text-secondary"
        >
          {series.map((entry) => (
            <li key={entry.id} className="flex items-center gap-1.5">
              <Key kind={kind} series={entry} />
              {entry.label}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <div
          aria-hidden="true"
          className="relative shrink-0 text-right text-[11px] text-muted tabular-nums"
          style={{ height }}
        >
          <span className="invisible block h-0 overflow-hidden">
            {format(ticks[ticks.length - 1] ?? 0)}
          </span>
          {drawn
            ? ticks.map((tick) => (
                <span
                  key={tick}
                  className="absolute right-0 -translate-y-1/2 leading-none"
                  style={{ top: y(tick) }}
                >
                  {format(tick)}
                </span>
              ))
            : null}
        </div>
        <div
          ref={plot}
          aria-hidden="true"
          className="relative min-w-0 flex-1"
          style={{ height }}
          onPointerMove={drawn ? (event) => onPointer(event.clientX) : undefined}
          onPointerLeave={() => setActive(null)}
        >
          <svg
            aria-hidden="true"
            width={width}
            height={height}
            className="absolute inset-0 block overflow-visible"
          >
            {(drawn ? ticks : [0]).map((tick) => (
              <line
                key={tick}
                x1={0}
                x2={width}
                y1={Math.round(y(tick)) + 0.5}
                y2={Math.round(y(tick)) + 0.5}
                stroke={tick === 0 ? 'var(--nt-border-strong)' : 'var(--nt-border)'}
                shapeRendering="crispEdges"
              />
            ))}
            {drawn && active !== null ? (
              kind === 'bar' ? (
                <rect
                  x={center(active) - Math.min(band, barWidth + 12) / 2}
                  y={PAD_TOP}
                  width={Math.min(band, barWidth + 12)}
                  height={inner}
                  rx={RADIUS}
                  fill="var(--nt-row-hover)"
                />
              ) : (
                <line
                  x1={Math.round(center(active)) + 0.5}
                  x2={Math.round(center(active)) + 0.5}
                  y1={PAD_TOP}
                  y2={height}
                  stroke="var(--nt-border-strong)"
                  shapeRendering="crispEdges"
                />
              )
            ) : null}
            {drawn && kind === 'bar'
              ? points.map((point, index) => {
                  let sum = 0
                  const parts = series
                    .map((entry, at) => ({ entry, value: point.values[at] ?? 0 }))
                    .filter((part) => part.value > 0)
                  return (
                    <g key={point.label} data-nt-chart-bar={point.label}>
                      {parts.map((part, at) => {
                        const bottom = y(sum) - (at === 0 ? 0 : GAP)
                        sum += part.value
                        const tip = y(sum)
                        const tone = part.entry.tone ?? 'mark'
                        const lit = index === active && tone === 'mark'
                        return (
                          <path
                            key={part.entry.id}
                            d={columnPath(
                              center(index) - barWidth / 2,
                              tip,
                              barWidth,
                              Math.max(0, bottom - tip),
                              at === parts.length - 1,
                            )}
                            fill={lit ? TONE.accent : TONE[tone]}
                            className="transition-[fill] duration-(--nt-duration-fast) motion-reduce:transition-none"
                          />
                        )
                      })}
                    </g>
                  )
                })
              : null}
            {drawn && kind === 'line'
              ? series.map((entry, index) => {
                  const color = entry.reference ? REFERENCE : TONE[entry.tone ?? 'mark']
                  return runs(points, index).map((run) => {
                    const line = run
                      .map(
                        ([at, value], step) => `${step === 0 ? 'M' : 'L'}${center(at)},${y(value)}`,
                      )
                      .join('')
                    const first = run[0]
                    const last = run[run.length - 1]
                    const wash =
                      !entry.reference && plain.length === 1 && first && last
                        ? `${line}L${center(last[0])},${y(0)}L${center(first[0])},${y(0)}Z`
                        : null
                    return (
                      <g key={`${entry.id}-${first?.[0] ?? 0}`} data-nt-chart-line={entry.id}>
                        {wash ? <path d={wash} fill="var(--nt-chart-wash)" /> : null}
                        <path
                          d={line}
                          fill="none"
                          stroke={color}
                          strokeWidth={entry.reference ? 1.5 : 2}
                          strokeDasharray={entry.reference ? '4 4' : undefined}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {!entry.reference && last && active === null ? (
                          <circle
                            cx={center(last[0])}
                            cy={y(last[1])}
                            r={4}
                            fill={color}
                            stroke={GROUND}
                            strokeWidth={2}
                          />
                        ) : null}
                      </g>
                    )
                  })
                })
              : null}
            {drawn && kind === 'line' && activePoint && active !== null
              ? series.map((entry, index) => {
                  const value = activePoint.values[index]
                  if (value === null || value === undefined || entry.reference) return null
                  return (
                    <circle
                      key={entry.id}
                      cx={center(active)}
                      cy={y(value)}
                      r={4}
                      fill={TONE.accent}
                      stroke={GROUND}
                      strokeWidth={2}
                    />
                  )
                })
              : null}
          </svg>
          {loading === undefined ? null : (
            <div
              className="absolute inset-x-0 bottom-0 flex items-end justify-around gap-1"
              style={{ top: PAD_TOP }}
            >
              {LOADING_SHAPE.slice(
                0,
                Math.min(LOADING_SHAPE.length, Math.max(4, Math.floor(width / 48))),
              ).map((shape, index) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative shapes that never reorder.
                  key={index}
                  className="nt-shimmer block w-3 rounded-t-sm bg-surface-hover"
                  style={{ height: `${shape}%` }}
                />
              ))}
            </div>
          )}
          {isEmpty && empty !== undefined ? (
            <p className="absolute inset-0 m-0 flex items-center justify-center px-4 text-center text-[12px] text-muted">
              {empty}
            </p>
          ) : null}
          {drawn && activePoint && active !== null ? (
            <div
              data-nt-chart-tooltip
              className="pointer-events-none absolute top-0 z-(--nt-z-popover) flex min-w-32 flex-col gap-1 rounded-lg border border-border bg-overlay px-2.5 py-2 text-[12px] shadow-menu"
              style={
                center(active) < width * 0.6
                  ? { left: center(active) + Math.max(barWidth / 2, 4) + 8 }
                  : { right: width - center(active) + Math.max(barWidth / 2, 4) + 8 }
              }
            >
              <span className="text-muted">{activePoint.label}</span>
              {series.map((entry, index) => {
                const value = activePoint.values[index]
                if (value === null || value === undefined) return null
                return (
                  <span key={entry.id} className="flex items-center gap-1.5 whitespace-nowrap">
                    <Key kind={kind} series={entry} />
                    <span className="text-secondary">{entry.label}</span>
                    <span className="ml-auto pl-3 text-fg tabular-nums">{format(value)}</span>
                  </span>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
      {drawn ? (
        <div
          aria-hidden="true"
          className="relative ml-auto h-4 text-[11px] text-muted"
          style={{ width }}
        >
          {points.map((point, index) =>
            index % every === 0 ? (
              <span
                key={point.label}
                className="absolute top-0 -translate-x-1/2 whitespace-nowrap leading-4"
                style={{ left: center(index) }}
              >
                {point.label}
              </span>
            ) : null,
          )}
        </div>
      ) : null}
      {loading === undefined ? null : <span className="sr-only">{loading}</span>}
      <table id={tableId} className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <td />
            {series.map((entry) => (
              <th key={entry.id} scope="col">
                {entry.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              {series.map((entry, index) => {
                const value = point.values[index]
                return (
                  <td key={entry.id}>
                    {value === null || value === undefined ? '' : format(value)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

/** The props of `Sparkline`. */
export interface SparklineProps {
  /** What the line shows, for a screen reader: "Builds per dag, de afgelopen 7 dagen". */
  label: string
  values: readonly number[]
  tone?: ChartTone
  /** The height in px; 28 without. */
  height?: number
}

/**
 * The shape of a series in a line the height of a word, for a `StatTile` or a row: no axis and no
 * grid, a 2px line in the quiet chart ink on its wash, and a dot in the accent on the latest
 * value, the one the figure above it tells. Scaled from its lowest to its highest value, since it
 * shows a course, not an amount. An image named by `label`; it follows the width of its parent.
 */
export function Sparkline({
  label,
  values,
  tone = 'mark',
  height = 28,
}: SparklineProps): ReactNode {
  const box = useRef<HTMLSpanElement>(null)
  const width = useWidth(box, 160)
  const low = Math.min(...values)
  const high = Math.max(...values)
  const span = high - low || 1
  const pad = 4
  const x = (index: number) => pad + ((width - pad * 2) * index) / Math.max(values.length - 1, 1)
  const y = (value: number) =>
    high === low ? height / 2 : pad + (height - pad * 2) * (1 - (value - low) / span)
  const line = values
    .map((value, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(value)}`)
    .join('')
  const lastIndex = values.length - 1
  const last = values[lastIndex]
  return (
    <span
      ref={box}
      role="img"
      aria-label={label}
      data-nt-sparkline
      className="block w-full"
      style={{ height }}
    >
      {values.length < 2 || last === undefined ? null : (
        <svg width={width} height={height} className="block overflow-visible" aria-hidden="true">
          <path
            d={`${line}L${x(lastIndex)},${height}L${x(0)},${height}Z`}
            fill="var(--nt-chart-wash)"
          />
          <path
            d={line}
            fill="none"
            stroke={TONE[tone]}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={x(lastIndex)}
            cy={y(last)}
            r={3}
            fill={TONE.accent}
            stroke={GROUND}
            strokeWidth={2}
          />
        </svg>
      )}
    </span>
  )
}
