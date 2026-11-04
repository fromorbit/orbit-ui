import { Slider as RadixSlider } from 'radix-ui'
import { type PointerEvent, type ReactNode, useState } from 'react'

/** The shape of a marker: what tells the kinds apart, so colour never does it alone. */
export type ScrubberShape = 'dot' | 'bar' | 'diamond' | 'ring'

/** The colour of a marker: quiet for what is normal, red or amber for what went wrong. */
export type ScrubberTone = 'neutral' | 'danger' | 'attention'

/** How one kind of marker looks and what it is called in the legend: "Klik", "Fout". */
export interface ScrubberKind {
  label: string
  shape: ScrubberShape
  /** `neutral` by default. */
  tone?: ScrubberTone
}

/** One moment on the timeline: a click, a navigation, an error. */
export interface ScrubberMarker<K extends string = string> {
  /** Seconds from the start. */
  at: number
  kind: K
  /** What happened, shown when the pointer rests on the marker: "TypeError in Kassa.betaal". */
  label: string
}

/** The props of `Scrubber`. */
export interface ScrubberProps<K extends string = string> {
  /** The name of the playhead for a screen reader: "Afspeelpositie". */
  label: string
  /** The length of the recording, in seconds. */
  duration: number
  /** Where the playhead stands, in seconds. */
  value: number
  onValueChange(value: number): void
  /** Called once the drag or key press is over: the moment to seek a costly player. */
  onValueCommit?(value: number): void
  /** What one arrow key moves, in seconds; Page Up and Page Down move ten. 1 by default. */
  step?: number
  disabled?: boolean
  markers?: readonly ScrubberMarker<K>[]
  /** The look and the word of every kind a marker can have. */
  kinds: Readonly<Record<K, ScrubberKind>>
  /** A time as the player writes it, for the ticks and the hover label: "0:14". */
  formatTime(seconds: number): string
  /** The position in words for a screen reader: "0:14 van 0:24". */
  valueText(seconds: number): string
  /**
   * The name of the legend under the ticks ("Markeringen"): given, every kind that occurs is
   * listed with its shape and its count. Left out, there is no legend.
   */
  legendLabel?: string
  /** At most this many time labels under the track; 6 by default, fewer on a narrow screen. */
  maxTicks?: number
}

/** The seconds a tick may step by: round numbers of a clock. */
const TICK_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200]

/** The time labels under a track of `duration` seconds: at round steps, at most `max` of them. */
export function scrubberTicks(duration: number, max = 6): number[] {
  if (!(duration > 0)) return [0]
  const step =
    TICK_STEPS.find((candidate) => Math.floor(duration / candidate) + 1 <= max) ??
    Math.ceil(duration / Math.max(1, max - 1))
  return Array.from({ length: Math.floor(duration / step) + 1 }, (_, index) => index * step)
}

/**
 * The marker before or after `value`, of the given kinds or of any: what "previous error" and
 * "next error" seek to. A marker closer than `epsilon` to `value` counts as where one stands, so
 * pressing "next" at an error moves on to the following one.
 */
export function adjacentMarker<K extends string>(
  markers: readonly ScrubberMarker<K>[],
  value: number,
  direction: 'previous' | 'next',
  kinds?: readonly K[],
  epsilon = 0.05,
): ScrubberMarker<K> | undefined {
  const pool = [...markers]
    .filter((marker) => kinds === undefined || kinds.includes(marker.kind))
    .sort((a, b) => a.at - b.at)
  return direction === 'next'
    ? pool.find((marker) => marker.at > value + epsilon)
    : pool.findLast((marker) => marker.at < value - epsilon)
}

/** The colour of a filled shape, of a ring's line, and the soft glow of what went wrong. */
const TONE: Record<ScrubberTone, { fill: string; line: string; glow: string }> = {
  neutral: { fill: 'bg-secondary', line: 'border-secondary', glow: '' },
  danger: {
    fill: 'bg-danger',
    line: 'border-danger',
    glow: 'shadow-[0_0_calc(6px*var(--nt-status-glow))_color-mix(in_srgb,var(--nt-danger)_55%,transparent)]',
  },
  attention: {
    fill: 'bg-attention',
    line: 'border-attention',
    glow: 'shadow-[0_0_calc(6px*var(--nt-status-glow))_color-mix(in_srgb,var(--nt-attention)_55%,transparent)]',
  },
}

/** The drawing of each shape; a ring is hollow on the card plane it is made for. */
function shapeClass(kind: ScrubberKind): string {
  const tone = TONE[kind.tone ?? 'neutral']
  switch (kind.shape) {
    case 'dot':
      return `size-2 rounded-full ${tone.fill} ${tone.glow}`
    case 'bar':
      return `h-3 w-0.5 rounded-full ${tone.fill}`
    case 'diamond':
      return `size-2 rotate-45 rounded-[2px] ${tone.fill} ${tone.glow}`
    case 'ring':
      return `size-2 rounded-full border-2 bg-overlay ${tone.line} ${tone.glow}`
  }
}

/** How close, in pixels, the pointer must be to a marker for the hover label to name it. */
const NEAR = 8

/** Where the pointer rests over the track, as a share of its width and in pixels from the left. */
interface Hover {
  share: number
  x: number
  width: number
}

/**
 * The timeline of a recording: the part played, a playhead to drag, a marker per event in the
 * shape of its kind, round times underneath and an optional legend.
 *
 * Built on Radix's slider, so the playhead is one tab stop with the `slider` role and the keys:
 * the arrows move one `step`, Page Up and Page Down ten, Home and End to the ends; a press
 * anywhere on the track seeks there. The thumb is drawn at zero width, so Radix keeps no inset at
 * the ends and the playhead, the played part and the markers all stand at exactly
 * `seconds / duration` of the width.
 *
 * The markers are decoration for a screen reader (`aria-hidden`): the events belong in a list
 * beside the player, which is where a screen reader reads them. Each kind has its own shape, and
 * what went wrong takes its colour with the soft glow of the status marks (`--nt-status-glow`),
 * so an error stands out among the clicks (Von Restorff). The played part is quiet, not the
 * accent: the one emphasis of a player is its play button. With a mouse, a small label over the
 * track says the time under the pointer and the event of a marker within reach (8px).
 */
export function Scrubber<K extends string>({
  label,
  duration,
  value,
  onValueChange,
  onValueCommit,
  step = 1,
  disabled = false,
  markers = [],
  kinds,
  formatTime,
  valueText,
  legendLabel,
  maxTicks = 6,
}: ScrubberProps<K>): ReactNode {
  const [hover, setHover] = useState<Hover | null>(null)
  const length = Math.max(duration, 0)
  const at = (seconds: number) =>
    length === 0 ? '0%' : `${(Math.min(Math.max(seconds, 0), length) / length) * 100}%`
  const ticks = scrubberTicks(length, maxTicks)
  const usedKinds = (Object.keys(kinds) as K[]).filter((kind) =>
    markers.some((marker) => marker.kind === kind),
  )

  const track = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' || disabled || length === 0) return
    const box = event.currentTarget.getBoundingClientRect()
    if (box.width === 0) return
    const x = Math.min(Math.max(event.clientX - box.left, 0), box.width)
    setHover({ share: x / box.width, x, width: box.width })
  }
  const hoverSeconds = hover === null ? 0 : hover.share * length
  const nearby =
    hover === null
      ? undefined
      : markers
          .map((marker) => ({
            marker,
            distance: Math.abs((marker.at / length) * hover.width - hover.x),
          }))
          .filter((entry) => entry.distance <= NEAR)
          .sort((a, b) => a.distance - b.distance)[0]?.marker

  return (
    <div data-nt-scrubber className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-col">
        <RadixSlider.Root
          value={[Math.min(Math.max(value, 0), length)]}
          min={0}
          max={length}
          step={step}
          disabled={disabled || length === 0}
          onValueChange={([next]) => {
            if (next !== undefined) onValueChange(next)
          }}
          {...(onValueCommit
            ? {
                onValueCommit: ([next]: number[]) => {
                  if (next !== undefined) onValueCommit(next)
                },
              }
            : {})}
          onPointerMove={track}
          onPointerLeave={() => setHover(null)}
          className="no-drag group/scrubber relative flex h-(--nt-control-md) min-w-0 touch-none items-center select-none data-disabled:opacity-40"
        >
          <RadixSlider.Track className="relative h-1 grow rounded-full bg-mark">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 rounded-full bg-muted"
              style={{ width: at(value) }}
            />
          </RadixSlider.Track>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0">
            {markers.map((marker) => (
              <span
                key={`${marker.kind}-${marker.at}`}
                data-nt-scrubber-marker={marker.kind}
                className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 ${shapeClass(kinds[marker.kind])}`}
                style={{ left: at(marker.at) }}
              />
            ))}
          </span>
          {hover === null ? null : (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-full mb-1 flex max-w-64 items-center gap-1.5 whitespace-nowrap rounded-md bg-surface-active px-2 py-0.5 text-[11px] text-fg shadow-menu"
              style={
                hover.x < hover.width / 2
                  ? { left: Math.max(hover.x - 8, 0) }
                  : { right: Math.max(hover.width - hover.x - 8, 0) }
              }
            >
              <span className="text-secondary tabular-nums">
                {formatTime(nearby === undefined ? hoverSeconds : nearby.at)}
              </span>
              {nearby === undefined ? null : (
                <span className="min-w-0 truncate">{nearby.label}</span>
              )}
            </span>
          )}
          <RadixSlider.Thumb
            aria-label={label}
            aria-valuetext={valueText(value)}
            className="group/thumb relative block size-0 outline-none"
          >
            <span className="absolute top-0 left-0 block size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-overlay bg-fg shadow-menu outline-focus transition-transform duration-(--nt-duration-fast) group-hover/scrubber:scale-110 group-focus-visible/thumb:outline-2 group-focus-visible/thumb:outline-offset-2 motion-reduce:transition-none" />
          </RadixSlider.Thumb>
        </RadixSlider.Root>
        <div aria-hidden="true" className="relative h-4 text-[11px] text-muted tabular-nums">
          {ticks.map((tick) => {
            const share = length === 0 ? 0 : tick / length
            const align = share === 0 ? '' : share > 0.92 ? '-translate-x-full' : '-translate-x-1/2'
            return (
              <span key={tick} className={`absolute top-0 ${align}`} style={{ left: at(tick) }}>
                {formatTime(tick)}
              </span>
            )
          })}
        </div>
      </div>
      {legendLabel === undefined || usedKinds.length === 0 ? null : (
        <ul
          aria-label={legendLabel}
          className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[12px] text-secondary"
        >
          {usedKinds.map((kind) => (
            <li key={kind} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="flex size-3 items-center justify-center">
                <span className={shapeClass(kinds[kind])} />
              </span>
              {kinds[kind].label}
              <span className="text-muted tabular-nums">
                {markers.filter((marker) => marker.kind === kind).length}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
