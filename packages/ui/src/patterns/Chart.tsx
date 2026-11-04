import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

/** How a chart draws its values: columns from a baseline, or lines through the points. */
export type ChartKind = 'bar' | 'line'

/**
 * The ink of a series. `mark` is the quiet default of the kit (`--nt-chart-mark` for a bar,
 * `--nt-chart-line` for a line); a status colour only for a series that means that status
 * ("Mislukt" in `danger`), never for "the third series".
 */
export type ChartTone = 'mark' | 'accent' | 'danger' | 'attention' | 'success'

/** One series of a chart: its name in the legend, the tooltip and the table. */
export interface ChartSeries {
  id: string
  label: string
  tone?: ChartTone
  /**
   * A line to measure against (a plan, a pace): dashed in `--nt-chart-reference`, without a dot or
   * a wash. Only in a line chart.
   */
  reference?: boolean
}

/** One point on the horizontal axis: its label and one value per series. */
export interface ChartPoint {
  /** "ma", "14:00", "3 okt". */
  label: string
  /** The point in full, at the top of its tooltip: "donderdag", "3 oktober". `label` without. */
  title?: string
  /** One value per series, in the order of `series`; `null` where there is none (a day to come). */
  values: readonly (number | null)[]
}

/** A level to stay under (the hours of a plan): a quiet line across the plot, named at its start. */
export interface ChartLimit {
  value: number
  /** "Plan 250 u": on the line, and in the caption of the table. */
  label: string
}

/**
 * Where a series ends at its pace: a faint dotted run from its last value to the last point, with
 * the value it reaches named quietly at its end ("≈282 u").
 */
export interface ChartForecast {
  /** The `id` of the series it continues. */
  series: string
  /** The value at the last point. */
  value: number
  /** The quiet words at the end of the run: "≈282 u". */
  label: string
  /** The same in full, for the caption of the table: "verwacht eind oktober: 282 u". `label` without. */
  text?: string
}

/** The props of `Chart`. */
export interface ChartProps {
  /** The name of the chart: the plot's name and the caption of its table: "Builds per dag". */
  label: string
  kind?: ChartKind
  series: readonly ChartSeries[]
  points: readonly ChartPoint[]
  /** A value as the reader writes it, on the axis and in the tooltip; the host's locale without. */
  format?: (value: number) => string
  /** The sum of a stacked bar in words, beside the title of its tooltip: "33 builds". */
  total?: (value: number) => string
  /** A level to stay under, drawn across the plot; the axis runs at least to it. */
  limit?: ChartLimit
  /** Where a line series ends at its pace, drawn on from its last value; the axis runs to it. */
  forecast?: ChartForecast
  /** The height of the plot in px, without the legend and the labels under it. 192 without. */
  height?: number
  /** While the data is on its way: the words a screen reader hears ("Builds laden"). */
  loading?: string
  /** The words in the empty plot when there are no points or every value is zero. */
  empty?: string
  /** The next step under `empty`: a line of advice. */
  emptyNext?: ReactNode
  /** One quiet control under `emptyNext` that takes that step: a small secondary `Button`. */
  emptyAction?: ReactNode
  /**
   * How to read the plot by key, for a screen reader, as its description: "Pijltjes links en
   * rechts om de dagen te lezen, Home en End voor de eerste en de laatste". In the host's language.
   */
  keys?: string
  /** What a screen reader calls the plot instead of "group": "grafiek". */
  roleDescription?: string
  /** What the table says where a point has no value ("nog geen waarde"); a dash without. */
  none?: string
}

const TONE: Record<ChartTone, string> = {
  mark: 'var(--nt-chart-mark)',
  accent: 'var(--nt-accent)',
  danger: 'var(--nt-danger)',
  attention: 'var(--nt-attention-fill)',
  success: 'var(--nt-success)',
}
/** A line in the quiet tone takes the full ink: a stroke has less mass than a bar. */
const LINE_MARK = 'var(--nt-chart-line)'
const REFERENCE = 'var(--nt-chart-reference)'
/** The ring around a dot and the stripes of a status: the plane the chart lies on, a card without. */
const GROUND = 'var(--nt-chart-ground, var(--nt-overlay-background))'

/** Air above the top line of the grid, so a dot or a rounded end on it is not cut. */
const PAD_TOP = 8
/** The share of its band a bar takes, and the widest it gets: the rest of the band is air. */
const BAR_SHARE = 0.56
const BAR_MAX = 40
/** The rounded end of a bar (one radius at every width), and the gap between stacked parts. */
const RADIUS = 2
const GAP = 2
/** The least a part of a stacked bar shows, so one failure among many still reads as a striped cap. */
const MIN_PART = 4
/**
 * Below this width a bar has no room for stripes: a status part is its flat tint, in the legend too.
 * The stripes repeat every 4px, so a bar of a month at phone width (5–6px) still carries them: one
 * encoding at every width; only a sliver this thin goes flat.
 */
const HATCH_MIN = 4
/** The least room a label of the axis gets before it is cut with an ellipsis (its point in full is in the tooltip). */
const LABEL_MIN = 80
/** The grid of an empty plot: three quiet steps without values, the shape of a filled one, its middle free for the sentence. */
const EMPTY_TICKS = [0, 1, 2, 3]

function defaultFormat(value: number): string {
  return new Intl.NumberFormat().format(value)
}

/**
 * A step between grid lines of 1, 2, 2.5 or 5 times a power of ten, so there are three to five.
 * For counts (`integer`) the step is a whole number: 1, 2 or 5 times a power of ten, at least 1.
 */
export function chartStep(max: number, integer = false): number {
  if (max <= 0) return 1
  const rough = max / 4
  const power = 10 ** Math.floor(Math.log10(rough))
  const factors = integer ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10]
  const step = factors.map((factor) => factor * power).find((entry) => entry >= rough) ?? rough
  return integer ? Math.max(1, Math.round(step)) : step
}

/** The values of the grid, from zero to the first step at or above the largest value. */
export function chartTicks(max: number, integer = false): number[] {
  const step = chartStep(max, integer)
  const top = Math.max(step, Math.ceil(max / step) * step)
  return Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step)
}

/**
 * The heights in px of the parts of a stacked bar, from the foot up: each in proportion, but a part
 * above zero at least `MIN_PART` visible (and the gap under it), taken from the tallest part, so
 * one failure among thirty builds still shows.
 */
export function stackHeights(values: readonly number[], scale: number): number[] {
  const heights = values.map((value) => value * scale)
  const need = (at: number) => MIN_PART + (at === 0 ? 0 : GAP)
  heights.forEach((height, at) => {
    const short = need(at) - height
    if (short <= 0) return
    const tallest = heights.reduce(
      (best, entry, index) => (entry > (heights[best] ?? 0) ? index : best),
      0,
    )
    if (tallest === at || (heights[tallest] ?? 0) - short < need(tallest)) return
    heights[tallest] = (heights[tallest] ?? 0) - short
    heights[at] = need(at)
  })
  return heights
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

/** A column with a rounded end at the top and a square foot on the baseline or the gap. */
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

/** A status tone is striped as well as tinted, so it does not rest on hue alone (WCAG 1.4.1). */
function striped(tone: ChartTone): boolean {
  return tone !== 'mark' && tone !== 'accent'
}

/** The fill of a bar part: its tone, striped for a status where the bar is wide enough. */
function barFill(tone: ChartTone, hatch: string, flat = false): string {
  return striped(tone) && !flat ? `url(#${hatch}-${tone})` : TONE[tone]
}

/** The ink of a line series. */
function lineInk(series: ChartSeries): string {
  if (series.reference) return REFERENCE
  const tone = series.tone ?? 'mark'
  return tone === 'mark' ? LINE_MARK : TONE[tone]
}

/**
 * The key of a series in the legend and the tooltip: the mark itself, small. A square for a bar
 * (striped as the bar is), a 16px stroke with the dash of the line for a line.
 */
function Key({
  kind,
  series,
  hatch,
  flat,
}: {
  kind: ChartKind
  series: ChartSeries
  hatch: string
  flat: boolean
}): ReactNode {
  if (kind === 'bar') {
    return (
      <svg aria-hidden="true" width={8} height={8} className="block shrink-0">
        <rect width={8} height={8} rx={2} fill={barFill(series.tone ?? 'mark', hatch, flat)} />
      </svg>
    )
  }
  return (
    <svg aria-hidden="true" width={16} height={4} className="block shrink-0">
      <line
        x1={series.reference ? 0 : 1}
        x2={series.reference ? 16 : 15}
        y1={2}
        y2={2}
        stroke={lineInk(series)}
        strokeWidth={2}
        strokeLinecap={series.reference ? 'butt' : 'round'}
        strokeDasharray={series.reference ? '4 2' : undefined}
      />
    </svg>
  )
}

/** Varied heights of the shapes that stand in for the bars while the data loads. */
const LOADING_SHAPE = [42, 58, 50, 72, 64, 36, 30, 54, 68, 60, 46, 28]

/** The width a label of the axis takes, roughly, at 11px. */
const labelWidth = (text: string) => text.length * 6.5

/**
 * The points that get a label under the axis: every few when they would collide, on a step that
 * ends on the last point where one is near, so the labels keep one rhythm to the end. Otherwise the
 * last one is added and drops the regular label before it when less than `room` lies between the
 * two (`extent` gives a label's left and right edge as drawn, inside the plot).
 */
export function chartLabelled(
  count: number,
  least: number,
  extent: (index: number) => readonly [number, number],
  room: number,
): number[] {
  const last = count - 1
  if (last <= 0) return count === 1 ? [0] : []
  let every = least
  for (let step = least; step <= Math.ceil(least * 1.5); step++) {
    if (last % step === 0) {
      every = step
      break
    }
  }
  const out: number[] = []
  for (let index = 0; index <= last; index += every) out.push(index)
  if (out[out.length - 1] !== last) {
    const before = out[out.length - 1] ?? 0
    if (before > 0 && extent(last)[0] - extent(before)[1] < room) out.pop()
    out.push(last)
  }
  // Two labels that still touch (long names in a narrow plot): the first one alone.
  if (out.length === 2 && extent(last)[0] - extent(0)[1] < 8) out.pop()
  return out
}

/**
 * A bar or line chart drawn from the tokens: a quiet grid with its values at the left, the labels
 * of the points under it, a legend for two series or more, and a tooltip on the point being read.
 *
 * Bars take about half their band (at most 40px), stand square on the baseline with a 2px rounded
 * end, and a stacked bar keeps a 2px gap between its parts; a part above zero shows at least 3px.
 * A status part (`danger`) is striped as well as tinted, in the legend too. A line is 2px in the
 * full ink with round joins and runs from edge to edge; a single line lies on a wash of its own
 * ink that fades toward the baseline, and where a series stops (today) the wash stops with it: what
 * is to come is not measured. A `forecast` carries a series on from there as a faint dotted run to
 * the value it reaches, named quietly at its end. A `reference` series (a pace) is dashed in
 * `--nt-chart-reference`, a `limit` is a quiet level across the plot named at its start. Bars are
 * `--nt-chart-mark`, a step quieter than the accent, so a row of them reads calmly; the column
 * being read gets a tinted band and the bars keep their ink, so a status part stays the one
 * emphasis. Below 10px a bar has no room for stripes and a status part is its flat tint, in the
 * legend too. The labels of the axis keep one rhythm to the last point, stand inside the plot's
 * edges and cut a long name with an ellipsis. Every tooltip has the same head: the point in full
 * and, beside it, the sum of a stacked bar (`total`) or the value of the one line.
 *
 * The plot is one tab stop named by `label` and described by `keys`: Left and Right (Home, End)
 * move the point being read and show its tooltip, Escape closes it, and a screen reader hears the
 * point as the tooltip says it. A mouse reads under
 * the pointer; a tap reads a point and a second tap (or one outside) closes it. The drawing itself
 * is `aria-hidden`; a screen reader gets the same values as a table named by `label`. While
 * `loading` the plot shows soft shapes and the figure is busy; with no values it is the grid with
 * the words of `empty` and `emptyNext`, without a legend. The chart follows the width of its
 * parent.
 */
export function Chart({
  label,
  kind = 'bar',
  series,
  points,
  format = defaultFormat,
  total,
  limit,
  forecast,
  height = 192,
  loading,
  empty,
  emptyNext,
  emptyAction,
  keys,
  roleDescription,
  none = '–',
}: ChartProps): ReactNode {
  const plot = useRef<HTMLDivElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const width = useWidth(plot, 600)
  const tableId = useId()
  const keysId = useId()
  const hatch = `chart-hatch-${useId().replace(/[^\w-]/g, '')}`
  const [active, setActive] = useState<number | null>(null)
  const [byKey, setByKey] = useState(false)
  const [tipWidth, setTipWidth] = useState(0)

  const totals = points.map((point) =>
    kind === 'bar'
      ? point.values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
      : Math.max(0, ...point.values.map((value) => value ?? 0)),
  )
  const max = Math.max(0, ...totals)
  const isEmpty = loading === undefined && max === 0
  const integer = points.every((point) =>
    point.values.every((value) => value === null || Number.isInteger(value)),
  )
  const forecastIndex =
    kind === 'line' && forecast ? series.findIndex((entry) => entry.id === forecast.series) : -1
  const ceiling = Math.max(max, limit?.value ?? 0, forecastIndex >= 0 ? (forecast?.value ?? 0) : 0)
  const ticks = isEmpty ? EMPTY_TICKS : chartTicks(ceiling, integer && Number.isInteger(ceiling))
  const top = ticks[ticks.length - 1] ?? 1
  const inner = height - PAD_TOP
  const y = (value: number) => PAD_TOP + inner * (1 - value / top)
  const count = Math.max(points.length, 1)
  const band = width / count
  // Bars stand in the middle of their band; a line runs from the left edge to the right one.
  const spacing = kind === 'bar' || count === 1 ? band : width / (count - 1)
  const at = (index: number) =>
    kind === 'bar' ? band * (index + 0.5) : count === 1 ? width / 2 : spacing * index
  const barWidth = Math.max(1, Math.min(BAR_MAX, band * BAR_SHARE))
  const flat = barWidth < HATCH_MIN
  // A long name (a space, a branch) is cut to the room of its band, at least LABEL_MIN.
  const cap = Math.min(
    Math.max(...points.map((point) => labelWidth(point.label)), 1),
    Math.max(LABEL_MIN, spacing - 16),
  )
  const every = Math.max(1, Math.ceil((cap + 16) / spacing))
  const labelBox = (index: number): [number, number] => {
    const point = points[index]
    const size = Math.min(cap, labelWidth(point?.label ?? ''))
    const left = Math.max(0, Math.min(at(index) - size / 2, width - size))
    return [left, left + size]
  }
  const drawn = loading === undefined && !isEmpty
  const plain = series.filter((entry) => !entry.reference)
  const plainIndex = series.findIndex((entry) => !entry.reference)
  const activePoint = active === null ? undefined : points[active]
  const tones = [...new Set(series.map((entry) => entry.tone ?? 'mark'))].filter(striped)

  // The tooltip beside the point, on the side where it fits, and never past the plot's edges.
  useLayoutEffect(() => {
    if (active === null) return
    setTipWidth(tip.current?.offsetWidth ?? 0)
  }, [active])

  // A tap outside the plot closes the tooltip a tap opened.
  useEffect(() => {
    if (active === null) return
    const close = (event: globalThis.PointerEvent) => {
      if (!plot.current?.contains(event.target as Node)) setActive(null)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [active])

  const indexAt = (clientX: number): number | null => {
    const box = plot.current?.getBoundingClientRect()
    if (!box || points.length === 0 || box.width === 0) return null
    const share = (clientX - box.left) / box.width
    const index =
      kind === 'bar' ? Math.floor(share * points.length) : Math.round(share * (points.length - 1))
    return Math.min(points.length - 1, Math.max(0, index))
  }
  const onPointerMove = (event: PointerEvent) => {
    const index = indexAt(event.clientX)
    if (index === null) return
    setByKey(false)
    setActive(index)
  }
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') return
    const index = indexAt(event.clientX)
    if (index === null) return
    setByKey(false)
    setActive((current) => (current === index ? null : index))
  }
  const onPointerLeave = (event: PointerEvent) => {
    // A finger leaves the plot when it lifts; the point it tapped stays until the next tap.
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') setActive(null)
  }
  const onKeyDown = (event: KeyboardEvent) => {
    const last = points.length - 1
    const next: Record<string, (current: number | null) => number | null> = {
      ArrowRight: (current) => (current === null ? 0 : Math.min(last, current + 1)),
      ArrowLeft: (current) => (current === null ? last : Math.max(0, current - 1)),
      Home: () => 0,
      End: () => last,
      Escape: () => null,
    }
    const move = next[event.key]
    if (!move || (event.key === 'Escape' && active === null)) return
    event.preventDefault()
    setByKey(true)
    setActive(move)
  }

  const tipStyle = (): { left: number } => {
    if (active === null) return { left: 0 }
    const off = (kind === 'bar' ? barWidth / 2 : 4) + 8
    const x = at(active)
    const right = x + off
    const leftward = x - off - tipWidth
    // Over a line the tooltip takes the side where the line is lower, so the trace stays in sight.
    const mean = (from: number, to: number): number | null => {
      const values = points
        .slice(from, to)
        .map((point) => point.values[plainIndex])
        .filter((value): value is number => typeof value === 'number')
      return values.length === 0
        ? null
        : values.reduce((sum, value) => sum + value, 0) / values.length
    }
    const before = kind === 'line' ? mean(0, active) : null
    const after = kind === 'line' ? mean(active + 1, points.length) : null
    const preferLeft = before !== null && after !== null && before < after && leftward >= 0
    const left = preferLeft ? leftward : right + tipWidth <= width ? right : leftward
    return { left: Math.max(0, Math.min(left, width - tipWidth)) }
  }

  const sumOf = (point: ChartPoint) =>
    point.values.reduce<number>((all, value) => all + (value ?? 0), 0)
  /** The words beside the title of a tooltip: the sum of a stacked bar, or the value of the one line. */
  const headline = (point: ChartPoint): string | null => {
    if (kind === 'bar') return total && series.length > 1 ? total(sumOf(point)) : null
    const value = plain.length === 1 ? point.values[plainIndex] : null
    return value === null || value === undefined ? null : format(value)
  }
  const readout = (point: ChartPoint): string =>
    [
      point.title ?? point.label,
      ...(kind === 'bar' && headline(point) !== null ? [headline(point) ?? ''] : []),
      ...series.flatMap((entry, index) => {
        const value = point.values[index]
        return value === null || value === undefined ? [] : [`${entry.label} ${format(value)}`]
      }),
    ].join(', ')

  const head = activePoint ? headline(activePoint) : null
  // The run of the forecast: from the last value of its series to the last point.
  const forecastFrom = (() => {
    if (forecastIndex < 0) return null
    for (let index = points.length - 1; index >= 0; index--) {
      const value = points[index]?.values[forecastIndex]
      if (typeof value === 'number') return index < points.length - 1 ? { index, value } : null
    }
    return null
  })()

  return (
    <figure
      aria-busy={loading === undefined ? undefined : true}
      data-nt-chart={kind}
      className="m-0 flex min-w-0 flex-col gap-3"
    >
      {series.length > 1 && drawn ? (
        <ul
          aria-hidden="true"
          className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-[12px] text-secondary"
        >
          {series.map((entry) => (
            <li key={entry.id} className="flex items-center gap-1.5">
              <Key kind={kind} series={entry} hatch={hatch} flat={flat} />
              {entry.label}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        {isEmpty ? null : (
          // An empty grid has no values to name: it runs flush with the caption.
          <div
            aria-hidden="true"
            className="relative shrink-0 text-right text-[11px] text-muted tabular-nums"
            style={{ height }}
          >
            <span className="invisible block h-0 overflow-hidden">
              {drawn ? format(top) : '000'}
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
        )}
        {/* biome-ignore lint/a11y/useSemanticElements: a fieldset is for form controls; this is a plot read with the arrow keys, one tab stop for all its points. */}
        <div
          ref={plot}
          role="group"
          aria-label={label}
          aria-roledescription={roleDescription}
          aria-describedby={drawn && keys !== undefined ? keysId : undefined}
          tabIndex={drawn ? 0 : undefined}
          data-nt-chart-plot
          className="relative min-w-0 flex-1 touch-pan-y rounded-sm outline-focus focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{ height }}
          onPointerMove={drawn ? onPointerMove : undefined}
          onPointerDown={drawn ? onPointerDown : undefined}
          onPointerLeave={onPointerLeave}
          onKeyDown={drawn ? onKeyDown : undefined}
          onFocus={(event) => {
            let visible = false
            try {
              visible = event.currentTarget.matches(':focus-visible')
            } catch {
              visible = false
            }
            if (drawn && visible && active === null) {
              setByKey(true)
              setActive(points.length - 1)
            }
          }}
          onBlur={() => setActive(null)}
        >
          <svg
            aria-hidden="true"
            width={width}
            height={height}
            className="absolute inset-0 block overflow-visible"
          >
            <defs>
              {/* The wash under a single line fades toward the baseline: the area of the line, not a region. */}
              <linearGradient id={`${hatch}-wash`} x1={0} y1={0} x2={0} y2={1}>
                <stop offset={0} style={{ stopColor: 'var(--nt-chart-wash)' }} />
                <stop offset={1} style={{ stopColor: 'var(--nt-chart-wash)', stopOpacity: 0 }} />
              </linearGradient>
              {tones.map((tone) => (
                <pattern
                  key={tone}
                  id={`${hatch}-${tone}`}
                  width={4}
                  height={4}
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width={4} height={4} fill={TONE[tone]} />
                  <rect width={1.5} height={4} fill={GROUND} opacity={0.6} />
                </pattern>
              ))}
            </defs>
            {(loading === undefined ? ticks : [0]).map((tick) => (
              <line
                key={tick}
                x1={0}
                x2={width}
                y1={Math.round(y(tick)) + 0.5}
                y2={Math.round(y(tick)) + 0.5}
                stroke="var(--nt-border-strong)"
                strokeDasharray={tick === 0 ? undefined : '2 3'}
                shapeRendering="crispEdges"
              />
            ))}
            {drawn && limit ? (
              <line
                data-nt-chart-limit
                x1={0}
                x2={width}
                y1={Math.round(y(limit.value)) + 0.5}
                y2={Math.round(y(limit.value)) + 0.5}
                stroke={REFERENCE}
                shapeRendering="crispEdges"
              />
            ) : null}
            {drawn && active !== null ? (
              kind === 'bar' ? (
                <rect
                  x={at(active) - Math.min(band, barWidth + 12) / 2}
                  y={PAD_TOP}
                  width={Math.min(band, barWidth + 12)}
                  height={inner}
                  rx={4}
                  fill="var(--nt-row-hover)"
                />
              ) : (
                <line
                  x1={Math.round(at(active)) + 0.5}
                  x2={Math.round(at(active)) + 0.5}
                  y1={PAD_TOP}
                  y2={height}
                  stroke="var(--nt-border-strong)"
                  shapeRendering="crispEdges"
                />
              )
            ) : null}
            {drawn && kind === 'bar'
              ? points.map((point, index) => {
                  const parts = series
                    .map((entry, place) => ({ entry, value: point.values[place] ?? 0 }))
                    .filter((part) => part.value > 0)
                  const heights = stackHeights(
                    parts.map((part) => part.value),
                    inner / top,
                  )
                  let cursor = y(0)
                  return (
                    <g key={point.label} data-nt-chart-bar={point.label}>
                      {parts.map((part, place) => {
                        const bottom = cursor - (place === 0 ? 0 : GAP)
                        cursor -= heights[place] ?? 0
                        const tone = part.entry.tone ?? 'mark'
                        return (
                          <path
                            key={part.entry.id}
                            d={columnPath(
                              at(index) - barWidth / 2,
                              cursor,
                              barWidth,
                              Math.max(0, bottom - cursor),
                              place === parts.length - 1,
                            )}
                            fill={barFill(tone, hatch, flat)}
                          />
                        )
                      })}
                    </g>
                  )
                })
              : null}
            {drawn && kind === 'line'
              ? series.map((entry, index) => {
                  const color = lineInk(entry)
                  return runs(points, index).map((run) => {
                    const line = run
                      .map(
                        ([place, value], step) =>
                          `${step === 0 ? 'M' : 'L'}${at(place)},${y(value)}`,
                      )
                      .join('')
                    const first = run[0]
                    const last = run[run.length - 1]
                    const wash =
                      !entry.reference && plain.length === 1 && first && last
                        ? `${line}L${at(last[0])},${y(0)}L${at(first[0])},${y(0)}Z`
                        : null
                    return (
                      <g key={`${entry.id}-${first?.[0] ?? 0}`} data-nt-chart-line={entry.id}>
                        {wash ? <path d={wash} fill={`url(#${hatch}-wash)`} /> : null}
                        <path
                          d={line}
                          fill="none"
                          stroke={color}
                          strokeWidth={2}
                          strokeDasharray={entry.reference ? '4 4' : undefined}
                          strokeLinecap={entry.reference ? 'butt' : 'round'}
                          strokeLinejoin="round"
                        />
                        {!entry.reference && last && active === null ? (
                          <circle
                            cx={at(last[0])}
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
            {drawn && forecastFrom ? (
              <path
                data-nt-chart-forecast
                d={`M${at(forecastFrom.index)},${y(forecastFrom.value)}L${at(points.length - 1)},${y(forecast?.value ?? 0)}`}
                fill="none"
                stroke={LINE_MARK}
                strokeOpacity={0.5}
                strokeWidth={2}
                strokeDasharray="0.1 5"
                strokeLinecap="round"
              />
            ) : null}
            {drawn && kind === 'line' && activePoint && active !== null
              ? series.map((entry, index) => {
                  const value = activePoint.values[index]
                  if (value === null || value === undefined || entry.reference) return null
                  return (
                    <circle
                      key={entry.id}
                      cx={at(active)}
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
          {drawn && limit ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-0 text-[11px] text-muted leading-4"
              style={{ top: Math.round(y(limit.value)) - 17 }}
            >
              {limit.label}
            </span>
          ) : null}
          {drawn && forecastFrom && forecast ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-0 whitespace-nowrap text-[11px] text-muted tabular-nums leading-4"
              style={{ top: Math.max(0, Math.round(y(forecast.value)) - 18) }}
            >
              {forecast.label}
            </span>
          ) : null}
          {loading === undefined ? null : (
            <div
              aria-hidden="true"
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
                  className="nt-shimmer block w-3 rounded-t-sm bg-(--nt-chart-skeleton)"
                  style={{ height: `${shape}%` }}
                />
              ))}
            </div>
          )}
          {isEmpty && empty !== undefined ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center text-[12px]">
              <p className="m-0 text-secondary">{empty}</p>
              {emptyNext === undefined ? null : <div className="text-muted">{emptyNext}</div>}
              {emptyAction === undefined ? null : <div className="mt-2">{emptyAction}</div>}
            </div>
          ) : null}
          {drawn && activePoint && active !== null ? (
            <div
              ref={tip}
              aria-hidden="true"
              data-nt-chart-tooltip
              className="pointer-events-none absolute top-0 z-(--nt-z-popover) flex min-w-32 flex-col gap-1 rounded-lg border border-border bg-overlay px-2.5 py-2 text-[12px] shadow-menu"
              style={tipStyle()}
            >
              <span className="whitespace-nowrap text-muted">
                {activePoint.title ?? activePoint.label}
                {head === null ? null : <span className="text-secondary"> · {head}</span>}
              </span>
              {series.map((entry, index) => {
                const value = activePoint.values[index]
                // One line alone: its value is in the title already.
                if (value === null || value === undefined || series.length === 1) return null
                return (
                  <span key={entry.id} className="flex items-center gap-1.5 whitespace-nowrap">
                    <Key kind={kind} series={entry} hatch={hatch} flat={flat} />
                    <span className="text-secondary">{entry.label}</span>
                    <span className="ml-auto pl-3 text-fg tabular-nums">{format(value)}</span>
                  </span>
                )
              })}
            </div>
          ) : null}
          {drawn && keys !== undefined ? (
            <span id={keysId} hidden>
              {keys}
            </span>
          ) : null}
          {drawn ? (
            <span aria-live="polite" className="sr-only">
              {byKey && activePoint ? readout(activePoint) : ''}
            </span>
          ) : null}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="relative ml-auto h-4 text-[11px] text-muted"
        style={{ width }}
      >
        {loading === undefined
          ? chartLabelled(points.length, every, labelBox, cap).map((index) => {
              const point = points[index]
              if (!point) return null
              const x = at(index)
              const half = Math.min(cap, labelWidth(point.label)) / 2
              const place =
                x - half < 0
                  ? { style: { left: 0 }, className: '' }
                  : x + half > width
                    ? { style: { right: 0 }, className: '' }
                    : { style: { left: x }, className: '-translate-x-1/2' }
              return (
                <span
                  key={point.label}
                  className={`absolute top-0 overflow-hidden text-ellipsis whitespace-nowrap leading-4 ${place.className}`}
                  style={
                    labelWidth(point.label) > cap ? { ...place.style, maxWidth: cap } : place.style
                  }
                >
                  {point.label}
                </span>
              )
            })
          : null}
      </div>
      {loading === undefined ? null : <span className="sr-only">{loading}</span>}
      {/* A table ignores the width and the clip of `sr-only`, and its columns would widen the page: the
          wrapper is what is hidden. */}
      <div className="sr-only">
        <table id={tableId}>
          <caption>
            {limit || forecastFrom
              ? `${label} (${[limit?.label, forecastFrom ? (forecast?.text ?? forecast?.label) : undefined].filter(Boolean).join('; ')})`
              : label}
          </caption>
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
                <th scope="row">{point.title ?? point.label}</th>
                {series.map((entry, index) => {
                  const value = point.values[index]
                  return (
                    <td key={entry.id}>
                      {value === null || value === undefined ? none : format(value)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

/** The props of `Sparkline`. */
export interface SparklineProps {
  /** What the line shows and its course, for a screen reader: "Builds per dag, van 26 naar 5". */
  label: string
  values: readonly number[]
  tone?: ChartTone
  /** The height in px; 28 without. */
  height?: number
  /**
   * The same stretch of the period before ("vorige week"), as a faint line behind it: where the
   * change of the figure is between the periods, not along the line. Its `label` says it too.
   */
  previous?: readonly number[]
}

/**
 * The shape of a series in a line the height of a word, for a `StatTile` or a row: no axis and no
 * grid, a 2px line in the quiet chart ink on its wash, and a dot in the accent on the latest
 * value, the one the figure above it tells. Scaled from its lowest to its highest value, since it
 * shows a course, not an amount; with `previous` both lines share that scale, the earlier one a
 * faint 1.5px line behind. An image named by `label`, which says the course in words; it
 * follows the width of its parent.
 */
export function Sparkline({
  label,
  values,
  tone = 'mark',
  height = 28,
  previous,
}: SparklineProps): ReactNode {
  const box = useRef<HTMLSpanElement>(null)
  const width = useWidth(box, 160)
  const all = [...values, ...(previous ?? [])]
  const low = Math.min(...all)
  const high = Math.max(...all)
  const span = high - low || 1
  const pad = 4
  const x = (index: number) => pad + ((width - pad * 2) * index) / Math.max(values.length - 1, 1)
  const y = (value: number) =>
    high === low ? height / 2 : pad + (height - pad * 2) * (1 - (value - low) / span)
  const path = (series: readonly number[]) =>
    series.map((value, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(value)}`).join('')
  const line = path(values)
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
          {previous && previous.length > 1 ? (
            <path
              data-nt-sparkline-previous
              d={path(previous)}
              fill="none"
              stroke={REFERENCE}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
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
