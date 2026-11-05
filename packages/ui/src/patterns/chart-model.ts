/**
 * The model of a chart described as data (`ChartFigure`): what to draw from a chart block and its
 * rows, and the number axis it stands on. The same API as the chart element of Orbit's desktop app
 * (`features/artifacts/elements/chart`: `model.ts` and `scale.ts`), so the app can import these
 * instead of its own copies; only the names that would be too general in a library carry `chart`.
 */

/** The five kinds of a chart block. */
export type ChartFigureType = 'bar' | 'line' | 'area' | 'pie' | 'scatter'

/** One row of a chart's data: a column per key. */
export type ChartRow = Record<string, string | number | boolean | null>

/**
 * A chart block as the desktop's `chart` element describes it: its kind, the column for the x axis
 * (the first without), the column or columns to draw (every other numeric column without), its
 * rows, a title, and the source a host reads the rows from.
 */
export interface ChartSpec {
  type: ChartFigureType
  title?: string
  x?: string
  y?: string | readonly string[]
  data?: readonly ChartRow[]
  source?: string
}

/** The colours of the series, in fixed order: tokens of the kit, so both themes have their own. */
export const CHART_SERIES_COLORS = [
  'var(--nt-accent-text)',
  'var(--nt-kind-decision)',
  'var(--nt-attention)',
  'var(--nt-kind-plan)',
  'var(--nt-kind-spec)',
] as const

/** More series than colours is not readable; the rest is announced, not drawn. */
export const CHART_MAX_SERIES = CHART_SERIES_COLORS.length

/** One point of a series: the category label (or the x of a scatter point), its place and value. */
export interface ChartModelPoint {
  label: string
  x: number
  y: number
}

/** One series of the model: its name, its colour and its points. */
export interface ChartModelSeries {
  name: string
  color: string
  points: ChartModelPoint[]
}

/** What `ChartSvg` draws. */
export interface ChartModel {
  type: ChartFigureType
  series: ChartModelSeries[]
  /** Series left out because there are no more colours. */
  hidden: number
  xLabel: string
  yLabel: string
}

const num = (cell: unknown): number | null =>
  typeof cell === 'number' && Number.isFinite(cell) ? cell : null

/**
 * What to draw, from the chart block and its rows. `x` defaults to the first column, `y` to every
 * other column with a number in it; a row without a number for a series leaves a gap, not a zero.
 */
export function buildChartModel(spec: ChartSpec, rows: readonly ChartRow[]): ChartModel {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  const x = spec.x ?? columns[0] ?? ''
  const wanted =
    spec.y === undefined ? undefined : typeof spec.y === 'string' ? [spec.y] : [...spec.y]
  const candidates = (wanted ?? columns.filter((column) => column !== x)).filter((column) =>
    rows.some((row) => num(row[column]) !== null),
  )
  // A pie and a scatter have one measure; a second is not a slice.
  const names = spec.type === 'pie' || spec.type === 'scatter' ? candidates.slice(0, 1) : candidates
  const shown = names.slice(0, CHART_MAX_SERIES)
  const series = shown.map((name, index): ChartModelSeries => {
    const points: ChartModelPoint[] = []
    rows.forEach((row, at) => {
      const y = num(row[name])
      if (y === null) return
      if (spec.type === 'pie' && y <= 0) return
      const raw = row[x]
      if (spec.type === 'scatter') {
        const px = num(raw)
        if (px === null) return
        points.push({ label: String(px), x: px, y })
        return
      }
      points.push({
        label: raw === null || raw === undefined ? String(at + 1) : String(raw),
        x: at,
        y,
      })
    })
    return { name, color: CHART_SERIES_COLORS[index] ?? CHART_SERIES_COLORS[0], points }
  })
  return {
    type: spec.type,
    series,
    hidden: names.length - shown.length,
    xLabel: x,
    yLabel: shown.length === 1 ? (shown[0] ?? '') : '',
  }
}

/** One slice of a pie. */
export interface ChartSlice {
  label: string
  value: number
  color: string
  /** The folded tail of a pie with more slices than colours. */
  rest: boolean
}

/** Pie slices in data order; past the fourth colour the tail folds into one muted "rest" slice. */
export function chartPieSlices(
  points: readonly ChartModelPoint[],
  restLabel: string,
): ChartSlice[] {
  const keep = points.length > CHART_MAX_SERIES ? CHART_MAX_SERIES - 1 : points.length
  const slices = points.slice(0, keep).map(
    (point, index): ChartSlice => ({
      label: point.label,
      value: point.y,
      color: CHART_SERIES_COLORS[index] ?? CHART_SERIES_COLORS[0],
      rest: false,
    }),
  )
  if (points.length > keep) {
    const value = points.slice(keep).reduce((sum, point) => sum + point.y, 0)
    slices.push({ label: restLabel, value, color: 'var(--nt-text-muted)', rest: true })
  }
  return slices
}

/** A number axis: where a value lands, and the round numbers the gridlines stand on. */
export interface LinearScale {
  domain: [number, number]
  ticks: number[]
  /** Maps a value to a position between `from` and `to`. */
  map: (value: number) => number
}

/** A step of 1, 2 or 5 times a power of ten, so the ticks read as round numbers. */
function niceStep(rough: number): number {
  const power = 10 ** Math.floor(Math.log10(rough))
  const fraction = rough / power
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return nice * power
}

/**
 * Round ticks that cover `min..max` in about `count` steps. A flat series (min equals max) still
 * gets a range, so the scale never divides by zero.
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1]
  let lo = min
  let hi = max
  if (lo === hi) {
    if (lo === 0) return [0, 1]
    ;[lo, hi] = lo > 0 ? [0, lo] : [lo, 0]
  }
  const step = niceStep((hi - lo) / Math.max(1, count))
  const first = Math.floor(lo / step + 1e-9) * step
  const last = Math.ceil(hi / step - 1e-9) * step
  const ticks: number[] = []
  // Multiplying instead of adding keeps 0.1 + 0.2 out of the labels.
  for (let index = 0; first + index * step <= last + step / 1e6; index++) {
    ticks.push(Number((first + index * step).toPrecision(12)))
  }
  return ticks
}

/** A scale from `min..max`, widened to round ticks, onto the range `from..to`. */
export function linearScale(
  min: number,
  max: number,
  from: number,
  to: number,
  count = 5,
): LinearScale {
  const ticks = niceTicks(min, max, count)
  const lo = ticks[0] ?? 0
  const hi = ticks[ticks.length - 1] ?? 1
  const span = hi - lo || 1
  return { domain: [lo, hi], ticks, map: (value) => from + ((value - lo) / span) * (to - from) }
}

const COMPACT = [
  { limit: 1e9, suffix: 'B' },
  { limit: 1e6, suffix: 'M' },
  { limit: 1e3, suffix: 'k' },
] as const

/** A tick label that stays short: 12 500 becomes 12,5k. */
export function formatTick(value: number, locale = 'nl'): string {
  const abs = Math.abs(value)
  for (const { limit, suffix } of COMPACT) {
    if (abs >= limit)
      return `${Number((value / limit).toPrecision(3)).toLocaleString(locale)}${suffix}`
  }
  return Number(value.toPrecision(6)).toLocaleString(locale)
}
