import { type ReactNode, useMemo, useState } from 'react'
import {
  buildChartModel,
  CHART_MAX_SERIES,
  type ChartFigureType,
  type ChartModel,
  type ChartModelSeries,
  type ChartRow,
  type ChartSpec,
  chartPieSlices,
  formatTick,
  linearScale,
} from './chart-model'

/** The width and height of the drawing's viewBox; it scales to the width of its column. */
export const CHART_WIDTH = 480
export const CHART_HEIGHT = 260
const TOP = 12
const RIGHT = 12
const BOTTOM = 34
/** The axis labels: 11px, the meta step of the scale. */
const LABEL_SIZE = 11

/** What a hover tells the figure: where to put the tooltip (in viewBox units) and what to say. */
export interface ChartHover {
  x: number
  y: number
  title: string
  rows: { color: string; name: string; value: string }[]
}

const AXIS = 'var(--nt-text-muted)'
const GRID = 'var(--nt-border-strong)'
/** The gap that keeps overlapping marks apart: the plane the chart lies on. */
const RING = 'var(--nt-chart-ground, var(--nt-canvas))'
const fmt = (value: number): string => Number(value.toPrecision(6)).toLocaleString('nl')
const clip = (label: string, max = 12): string =>
  label.length > max ? `${label.slice(0, max - 1)}…` : label

function extent(
  series: readonly ChartModelSeries[],
  pick: 'x' | 'y',
  zero: boolean,
): [number, number] {
  const values = series.flatMap((entry) => entry.points.map((point) => point[pick]))
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (zero) {
    min = Math.min(min, 0)
    max = Math.max(max, 0)
  }
  return [min, max]
}

/** The props of `ChartSvg`: the same as the desktop app's drawing of a chart element. */
export interface ChartSvgProps {
  model: ChartModel
  /** The name of the folded tail of a pie: "Overig". */
  restLabel: string
  onHover: (info: ChartHover | null) => void
}

/**
 * The drawing of one chart described as data: dashed gridlines on a round scale with a solid
 * baseline, muted labels, and the marks in the series colours (`CHART_SERIES_COLORS`), every colour
 * a token, so the light and the dark theme each bring theirs. A ring in the colour of the plane
 * keeps overlapping marks apart. The look and the API of Orbit's desktop chart (`ChartSvg`), in our
 * own SVG.
 */
export function ChartSvg({ model, restLabel, onHover }: ChartSvgProps): ReactNode {
  if (model.type === 'pie') return <Pie model={model} restLabel={restLabel} onHover={onHover} />
  const scatter = model.type === 'scatter'
  const zero = model.type === 'bar' || model.type === 'area'
  const [ymin, ymax] = extent(model.series, 'y', zero)
  const yProbe = linearScale(ymin, ymax, 0, 1)
  const left = 14 + Math.max(...yProbe.ticks.map((tick) => formatTick(tick).length)) * 6.5
  const plot = { l: left, r: CHART_WIDTH - RIGHT, t: TOP, b: CHART_HEIGHT - BOTTOM }
  const y = linearScale(ymin, ymax, plot.b, plot.t)
  const labels = scatter
    ? []
    : model.series.reduce(
        (longest, entry) => (entry.points.length > longest.length ? entry.points : longest),
        [] as ChartModelSeries['points'],
      )
  const count = scatter
    ? 0
    : Math.max(
        ...model.series.map((entry) => Math.max(...entry.points.map((point) => point.x), -1)),
      ) + 1
  const band = (plot.r - plot.l) / Math.max(1, count)
  const [xmin, xmax] = scatter ? extent(model.series, 'x', false) : [0, 1]
  const xs = scatter ? linearScale(xmin, xmax, plot.l + 8, plot.r - 8) : null
  const cx = (x: number): number => (xs ? xs.map(x) : plot.l + (x + 0.5) * band)
  const baseline = y.map(Math.max(0, y.domain[0]))
  const every = Math.max(1, Math.ceil(count / Math.max(1, Math.floor((plot.r - plot.l) / 64))))

  const hoverAt = (index: number): ChartHover => {
    const rows = model.series.flatMap((entry) => {
      const point = entry.points.find((candidate) => candidate.x === index)
      return point ? [{ color: entry.color, name: entry.name, value: fmt(point.y) }] : []
    })
    const label = labels.find((point) => point.x === index)?.label ?? ''
    const top = Math.min(
      ...model.series.flatMap((entry) =>
        entry.points.filter((point) => point.x === index).map((point) => y.map(point.y)),
      ),
    )
    return { x: cx(index), y: top, title: label, rows }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover only; every number is also in the table for a screen reader
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      className="block h-auto w-full"
      role="presentation"
      onMouseLeave={() => onHover(null)}
    >
      {y.ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={plot.l}
            x2={plot.r}
            y1={y.map(tick)}
            y2={y.map(tick)}
            stroke={GRID}
            strokeWidth={tick === 0 ? 1.5 : 0.5}
            strokeDasharray={tick === 0 ? undefined : '2 3'}
          />
          <text
            x={plot.l - 6}
            y={y.map(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={LABEL_SIZE}
            fill={AXIS}
          >
            {formatTick(tick)}
          </text>
        </g>
      ))}
      {xs
        ? xs.ticks.map((tick) => (
            <text
              key={tick}
              x={xs.map(tick)}
              y={plot.b + 16}
              textAnchor="middle"
              fontSize={LABEL_SIZE}
              fill={AXIS}
            >
              {formatTick(tick)}
            </text>
          ))
        : labels.map((point, index) =>
            index % every === 0 ? (
              <text
                key={point.x}
                x={cx(point.x)}
                y={plot.b + 16}
                textAnchor="middle"
                fontSize={LABEL_SIZE}
                fill={AXIS}
              >
                {clip(point.label)}
              </text>
            ) : null,
          )}
      <text
        x={(plot.l + plot.r) / 2}
        y={CHART_HEIGHT - 4}
        textAnchor="middle"
        fontSize={LABEL_SIZE}
        fill={AXIS}
      >
        {model.xLabel}
      </text>

      {model.type === 'bar' &&
        model.series.map((entry, place) => {
          const width = Math.min(40, (band * 0.72) / model.series.length)
          return entry.points.map((point) => {
            const x = cx(point.x) - (width * model.series.length) / 2 + place * width + 1
            const top = y.map(point.y)
            return (
              <rect
                key={`${entry.name}${point.x}`}
                x={x}
                y={Math.min(top, baseline)}
                width={Math.max(1, width - 2)}
                height={Math.max(1, Math.abs(baseline - top))}
                rx={2}
                fill={entry.color}
              />
            )
          })
        })}
      {(model.type === 'line' || model.type === 'area') &&
        model.series.map((entry) => {
          const line = entry.points
            .map(
              (point, index) =>
                `${index === 0 ? 'M' : 'L'}${cx(point.x).toFixed(1)} ${y.map(point.y).toFixed(1)}`,
            )
            .join(' ')
          const last = entry.points[entry.points.length - 1]
          const first = entry.points[0]
          return (
            <g key={entry.name}>
              {model.type === 'area' && first && last && (
                <path
                  d={`${line} L${cx(last.x).toFixed(1)} ${baseline} L${cx(first.x).toFixed(1)} ${baseline} Z`}
                  fill={entry.color}
                  fillOpacity={0.18}
                />
              )}
              <path
                d={line}
                fill="none"
                stroke={entry.color}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {entry.points.length <= 40 &&
                entry.points.map((point) => (
                  <circle
                    key={point.x}
                    cx={cx(point.x)}
                    cy={y.map(point.y)}
                    r={3.5}
                    fill={entry.color}
                    stroke={RING}
                    strokeWidth={2}
                  />
                ))}
            </g>
          )
        })}
      {scatter &&
        model.series.flatMap((entry) =>
          entry.points.map((point, index) => (
            // biome-ignore lint/a11y/noStaticElementInteractions: hover only; every number is also in the table for a screen reader
            <g
              // biome-ignore lint/suspicious/noArrayIndexKey: two points may share coordinates
              key={index}
              onMouseEnter={() =>
                onHover({
                  x: cx(point.x),
                  y: y.map(point.y),
                  title: model.xLabel ? `${model.xLabel}: ${point.label}` : point.label,
                  rows: [{ color: entry.color, name: entry.name, value: fmt(point.y) }],
                })
              }
            >
              <circle
                cx={cx(point.x)}
                cy={y.map(point.y)}
                r={4}
                fill={entry.color}
                stroke={RING}
                strokeWidth={2}
              />
              <circle cx={cx(point.x)} cy={y.map(point.y)} r={11} fill="transparent" />
            </g>
          )),
        )}
      {!scatter &&
        Array.from({ length: count }, (_, index) => (
          // biome-ignore lint/a11y/noStaticElementInteractions: hover only; every number is also in the table for a screen reader
          <rect
            // biome-ignore lint/suspicious/noArrayIndexKey: a column is its position
            key={index}
            x={plot.l + index * band}
            y={plot.t}
            width={band}
            height={plot.b - plot.t}
            fill="transparent"
            onMouseEnter={() => onHover(hoverAt(index))}
          />
        ))}
    </svg>
  )
}

function Pie({ model, restLabel, onHover }: ChartSvgProps): ReactNode {
  const slices = chartPieSlices(model.series[0]?.points ?? [], restLabel)
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const c = { x: CHART_WIDTH / 2, y: CHART_HEIGHT / 2 }
  const r = CHART_HEIGHT / 2 - 16
  let angle = -Math.PI / 2
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover only; every number is also in the table for a screen reader
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      className="block h-auto w-full"
      role="presentation"
      onMouseLeave={() => onHover(null)}
    >
      {slices.map((slice) => {
        const sweep = (slice.value / total) * Math.PI * 2
        const from = angle
        angle += sweep
        const mid = from + sweep / 2
        const info: ChartHover = {
          x: c.x + Math.cos(mid) * r * 0.7,
          y: c.y + Math.sin(mid) * r * 0.7,
          title: slice.label,
          rows: [
            {
              color: slice.color,
              name: `${Math.round((slice.value / total) * 100)}%`,
              value: fmt(slice.value),
            },
          ],
        }
        const at = (a: number): string =>
          `${(c.x + Math.cos(a) * r).toFixed(2)} ${(c.y + Math.sin(a) * r).toFixed(2)}`
        // One slice of 100% is a circle: an arc from a point to itself draws nothing.
        const d =
          slices.length === 1
            ? `M${c.x - r} ${c.y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0Z`
            : `M${c.x} ${c.y} L${at(from)} A${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${at(from + sweep)} Z`
        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: hover only; every number is also in the table for a screen reader
          <path
            key={slice.label}
            d={d}
            fill={slice.color}
            stroke={RING}
            strokeWidth={2}
            onMouseEnter={() => onHover(info)}
          />
        )
      })}
    </svg>
  )
}

/** The words of `ChartFigure`, in the host's language. */
export interface ChartFigureLabels {
  /** The name of the figure from its title: "Grafiek Omzet". */
  label: (title: string) => string
  /** The title of a block without one: "zonder titel". */
  untitled: string
  /** The kind of chart, after its name for a screen reader: "staafdiagram". */
  types: Record<ChartFigureType, string>
  /** While a block with a `source` waits for its rows: "Gegevens laden…". */
  loading: string
  /** A block without a value to draw. */
  empty: string
  /** Series left out past the colours: "1 reeks niet getoond: meer dan 5 reeksen lezen niet". */
  hidden: (count: number, max: number) => string
  /** The folded tail of a pie: "Overig". */
  rest: string
  /** The name of the legend: "Legenda". */
  legend: string
  /** The name of the table a screen reader reads: "Gegevens van de grafiek". */
  dataTable: string
}

/** The props of `ChartFigure`. */
export interface ChartFigureProps {
  /** The chart block: its kind, its columns, its title and, without `rows`, its data. */
  spec: ChartSpec
  /** The rows a host read from the block's `source`; until then the figure says it is loading. */
  rows?: readonly ChartRow[]
  labels: ChartFigureLabels
}

/**
 * A chart described as data — bar, line, area, pie or scatter — on a plane of its own, with its
 * title, a tooltip under the pointer, a legend from two series (or slices) on, and the same
 * numbers in a table for a screen reader. The `chart` element of Orbit's desktop app in API and
 * look (`ChartElement`), with its words as `labels`, so the app can switch to it. For a dashboard's
 * figures over time, with a limit, a forecast and keys, take `Chart`.
 */
export function ChartFigure({ spec, rows, labels }: ChartFigureProps): ReactNode {
  const data = rows ?? spec.data
  const [hover, setHover] = useState<ChartHover | null>(null)
  const model = useMemo(() => (data ? buildChartModel(spec, data) : null), [spec, data])
  const title = spec.title ?? labels.untitled
  const label = labels.label(title)
  const box = 'rounded-md bg-plane p-3 shadow-plane'

  if (!model)
    return (
      <div data-nt-chart-figure className={`${box} text-[12px] text-muted`} role="status">
        {labels.loading}
      </div>
    )
  if (model.series.every((entry) => entry.points.length === 0))
    return (
      <div data-nt-chart-figure className={`${box} text-[12px] text-muted`} role="status">
        {labels.empty}
      </div>
    )

  const legend =
    model.type === 'pie'
      ? chartPieSlices(model.series[0]?.points ?? [], labels.rest).map((slice) => ({
          name: slice.label,
          color: slice.color,
        }))
      : model.series.map((entry) => ({ name: entry.name, color: entry.color }))
  const head = model.series.length > 1 ? model.series.map((entry) => entry.name) : [model.yLabel]
  const longest = model.series.reduce(
    (best, entry) => (entry.points.length > best.length ? entry.points : best),
    [] as { x: number; label: string }[],
  )

  return (
    <figure data-nt-chart-figure className={`${box} m-0`} aria-label={label}>
      {spec.title ? (
        <figcaption className="mb-2 font-medium text-[13px] text-fg">{spec.title}</figcaption>
      ) : null}
      <div className="relative" role="img" aria-label={`${label}, ${labels.types[model.type]}`}>
        <ChartSvg model={model} restLabel={labels.rest} onHover={setHover} />
        {hover ? (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border-strong bg-overlay px-2 py-1 text-[11px] text-fg"
            style={{
              left: `${(hover.x / CHART_WIDTH) * 100}%`,
              top: `${(hover.y / CHART_HEIGHT) * 100}%`,
            }}
          >
            <div className="text-muted">{hover.title}</div>
            {hover.rows.map((row) => (
              <div key={row.name} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-sm"
                  style={{ background: row.color }}
                />
                <span>{row.name}</span>
                <span className="ml-auto pl-2 tabular-nums">{row.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {legend.length > 1 ? (
        <ul
          className="m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-[11px] text-secondary"
          aria-label={labels.legend}
        >
          {legend.map((item) => (
            <li key={item.name} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2 rounded-sm"
                style={{ background: item.color }}
              />
              {item.name}
            </li>
          ))}
        </ul>
      ) : null}
      {model.hidden > 0 ? (
        <p className="m-0 mt-1 text-[11px] text-muted">
          {labels.hidden(model.hidden, CHART_MAX_SERIES)}
        </p>
      ) : null}
      <table className="sr-only" aria-label={labels.dataTable}>
        <thead>
          <tr>
            <th scope="col">{model.xLabel}</th>
            {head.map((name) => (
              <th key={name} scope="col">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {longest.map((point, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a scatter may repeat an x
            <tr key={index}>
              <th scope="row">{point.label}</th>
              {model.series.map((entry) => (
                <td key={entry.name}>
                  {entry.points[index]?.x === point.x
                    ? entry.points[index]?.y
                    : (entry.points.find((candidate) => candidate.x === point.x)?.y ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
