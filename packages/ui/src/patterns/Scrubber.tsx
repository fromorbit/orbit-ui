import { Slider as RadixSlider } from 'radix-ui'
import { type PointerEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

/**
 * The shape of a marker: what tells the kinds apart, so colour never does it alone. A chevron is
 * for a step to another page; no other mark of the track, and no time label, has its shape.
 */
export type ScrubberShape = 'dot' | 'chevron' | 'diamond' | 'ring'

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
  /** Called once a drag, a key press or a press on a marker is over: the moment to seek a costly player. */
  onValueCommit?(value: number): void
  /** What one arrow key moves, in seconds; Page Up and Page Down move ten. 1 by default. */
  step?: number
  disabled?: boolean
  markers?: readonly ScrubberMarker<K>[]
  /** The look and the word of every kind a marker can have, in the order of the legend. */
  kinds: Readonly<Record<K, ScrubberKind>>
  /** A time as the player writes it, for the ticks and the hover label: "0:14". */
  formatTime(seconds: number): string
  /**
   * The position in words for a screen reader, with the markers the playhead stands on ("0:14 van
   * 0:24, Fout: TypeError in Kassa.betaal"), so a reader who scrubs with the arrows hears the
   * events they pass.
   */
  valueText(seconds: number, here: readonly ScrubberMarker<K>[]): string
  /**
   * The name of the legend under the ticks ("Markeringen"): given, every kind that occurs is
   * listed with its shape and its count. Left out, there is no legend.
   */
  legendLabel?: string
  /**
   * A control in the legend in place of a kind's count, such as stepping between the errors right
   * beside the word "Fout": the marks, their number and the way to reach them form one group.
   */
  legendActions?: Partial<Record<K, ReactNode>>
  /** At most this many time labels under the track; 6 by default, fewer as the track narrows. */
  maxTicks?: number
}

/** The seconds a tick may step by: round numbers of a clock. */
const TICK_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200]

/** The room, in pixels, each time label takes on the track: at 288px three labels, at 640px six. */
const TICK_ROOM = 96

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

/** Markers that fall together on the track, drawn as one mark at the moment of its loudest. */
export interface ScrubberGroup<K extends string = string> {
  /** The moment of the marker that leads the group: where it is drawn and what a press seeks to. */
  at: number
  /** Every marker of the group, in order of time. */
  markers: ScrubberMarker<K>[]
}

/** How loud a tone is: what went wrong leads a group, and is the shape on top. */
const WEIGHT: Record<ScrubberTone, number> = { danger: 0, attention: 1, neutral: 2 }

/**
 * The markers of a track `width` pixels wide, gathered where they would touch, so every shape
 * stays whole (a diamond and a ring a quarter of a second apart are one mark, not one red blob).
 * The loudest markers lead (what went wrong first, then the earliest): each in turn joins the
 * nearest leader less than `gap` pixels away, or leads a group of its own. So two marks never
 * stand closer than `gap`, and an error is always drawn at its own moment. Without a width (not
 * measured yet) every marker is its own group.
 */
export function scrubberGroups<K extends string>(
  markers: readonly ScrubberMarker<K>[],
  duration: number,
  width: number,
  kinds?: Readonly<Record<K, ScrubberKind>>,
  gap = 14,
): ScrubberGroup<K>[] {
  if (!(duration > 0) || !(width > 0))
    return [...markers]
      .sort((a, b) => a.at - b.at)
      .map((marker) => ({ at: marker.at, markers: [marker] }))
  const weight = (marker: ScrubberMarker<K>) => WEIGHT[kinds?.[marker.kind].tone ?? 'neutral']
  const x = (seconds: number) => (seconds / duration) * width
  const groups: ScrubberGroup<K>[] = []
  for (const marker of [...markers].sort((a, b) => weight(a) - weight(b) || a.at - b.at)) {
    const leader = groups
      .map((group) => ({ group, distance: Math.abs(x(group.at) - x(marker.at)) }))
      .filter((entry) => entry.distance < gap)
      .sort((a, b) => a.distance - b.distance)[0]?.group
    if (leader) leader.markers.push(marker)
    else groups.push({ at: marker.at, markers: [marker] })
  }
  for (const group of groups) group.markers.sort((a, b) => a.at - b.at)
  return groups.sort((a, b) => a.at - b.at)
}

/** The kinds of a group, the loudest first and then in the order of the legend, each once. */
function kindsOf<K extends string>(
  group: ScrubberGroup<K>,
  kinds: Readonly<Record<K, ScrubberKind>>,
): K[] {
  const order = Object.keys(kinds)
  return [...new Set(group.markers.map((marker) => marker.kind))].sort(
    (a, b) =>
      WEIGHT[kinds[a].tone ?? 'neutral'] - WEIGHT[kinds[b].tone ?? 'neutral'] ||
      order.indexOf(a) - order.indexOf(b),
  )
}

/**
 * The shapes a group shows: its loudest kind, and under it a second one only when that one went
 * wrong as well (an error and its failed request); quiet company is in the count.
 */
function shownKinds<K extends string>(
  group: ScrubberGroup<K>,
  kinds: Readonly<Record<K, ScrubberKind>>,
): K[] {
  const [lead, second] = kindsOf(group, kinds)
  if (lead === undefined) return []
  return second !== undefined && (kinds[second].tone ?? 'neutral') !== 'neutral'
    ? [lead, second]
    : [lead]
}

/** The colour each tone paints its shape in (`currentColor`). */
const TONE_TEXT: Record<ScrubberTone, string> = {
  neutral: 'text-secondary',
  danger: 'text-danger',
  attention: 'text-attention',
}

/** The soft glow of the status marks (`--nt-status-glow`, near flat in light) on what went wrong. */
const TONE_GLOW: Record<ScrubberTone, string> = {
  neutral: '',
  danger:
    'drop-shadow-[0_0_calc(3px*var(--nt-status-glow))_color-mix(in_srgb,var(--nt-danger)_70%,transparent)]',
  attention:
    'drop-shadow-[0_0_calc(3px*var(--nt-status-glow))_color-mix(in_srgb,var(--nt-attention)_70%,transparent)]',
}

/** The ring the thumb opens into, in the tone of the marker it stands on. */
const TONE_THUMB: Record<ScrubberTone, string> = {
  neutral: 'border-fg',
  danger:
    'border-danger shadow-[0_0_calc(6px*var(--nt-status-glow))_color-mix(in_srgb,var(--nt-danger)_55%,transparent)]',
  attention:
    'border-attention shadow-[0_0_calc(6px*var(--nt-status-glow))_color-mix(in_srgb,var(--nt-attention)_55%,transparent)]',
}

/** The plane the track lies on: each shape is cut out of it by a 2px edge, on the played part too. */
const PLANE = 'var(--nt-overlay-background)'

/** The outline of a diamond and of a chevron, in the 14px box of a shape. */
const DIAMOND = 'M7 2 12 7 7 12 2 7Z'
const CHEVRON = 'M5 2.5 9.5 7 5 11.5'

/**
 * One shape in a 14px box, every kind at the same optical size (about 10px), with a 2px edge in
 * the colour of the plane around it, so a quiet dot on the played part still stands apart.
 */
function Shape({ kind }: { kind: ScrubberKind }): ReactNode {
  const tone = kind.tone ?? 'neutral'
  const drawing = (() => {
    switch (kind.shape) {
      case 'dot':
        return (
          <>
            <circle cx="7" cy="7" r="6" fill={PLANE} />
            <circle cx="7" cy="7" r="4" fill="currentColor" />
          </>
        )
      case 'ring':
        return (
          <>
            <circle cx="7" cy="7" r="6.5" fill={PLANE} />
            <circle cx="7" cy="7" r="3.75" fill={PLANE} stroke="currentColor" strokeWidth="2" />
          </>
        )
      case 'diamond':
        return (
          <>
            <path
              d={DIAMOND}
              fill={PLANE}
              stroke={PLANE}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path
              d={DIAMOND}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </>
        )
      case 'chevron':
        return (
          <>
            <path
              d={CHEVRON}
              fill="none"
              stroke={PLANE}
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={CHEVRON}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )
    }
  })()
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 14 14"
      className={`block size-3.5 shrink-0 overflow-visible ${TONE_TEXT[tone]} ${TONE_GLOW[tone]}`}
    >
      {drawing}
    </svg>
  )
}

/** How close, in pixels, the playhead must be to a mark to stand on it, and the pointer to name it. */
const ON = 7
const NEAR = 12

/** Where the pointer rests over the track, in pixels from its left. */
interface Hover {
  x: number
  width: number
}

/**
 * The timeline of a recording: the part played, a playhead to drag, a mark per moment in the
 * shape of its kind, round times underneath and an optional legend.
 *
 * Built on Radix's slider, so the playhead is one tab stop with the `slider` role and the keys:
 * the arrows move one `step`, Page Up and Page Down ten, Home and End to the ends; a press
 * anywhere on the track seeks there. The thumb is drawn at zero width, so Radix keeps no inset at
 * the ends and the playhead, the played part and the marks all stand at exactly
 * `seconds / duration` of the width. A quiet cap closes the track where the recording ends.
 *
 * Markers that would touch are one mark (`scrubberGroups`): its loudest kind, with a second kind
 * that went wrong stacked under it (each shape whole), and a quiet count when it holds more. Each mark is a 24px target for a pointer: a press seeks
 * to it, and resting on it names every event in it with its time. For a screen reader the marks
 * are decoration (`aria-hidden`, out of the tab order): the events belong in a list beside the
 * player, and the playhead's `valueText` names the events it stands on. Each kind has its own
 * shape, and what went wrong takes its colour with the soft glow of the status marks
 * (`--nt-status-glow`), so an error stands out among the clicks (Von Restorff). The marks lie
 * above the playhead; where it stands on one, the thumb opens into a ring in that mark's tone, so
 * the error it is at stays in sight, and the time label under it steps aside. The played part is
 * quiet, not the accent: the one emphasis of a player is its play button.
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
  legendActions,
  maxTicks = 6,
}: ScrubberProps<K>): ReactNode {
  const [hover, setHover] = useState<Hover | null>(null)
  const [width, setWidth] = useState(0)
  const observer = useRef<ResizeObserver | null>(null)
  const measure = useCallback((node: HTMLSpanElement | null) => {
    observer.current?.disconnect()
    observer.current = null
    if (node === null) return
    setWidth(node.getBoundingClientRect().width)
    if (typeof ResizeObserver === 'undefined') return
    observer.current = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.current.observe(node)
  }, [])
  useEffect(() => () => observer.current?.disconnect(), [])

  const length = Math.max(duration, 0)
  const off = disabled || length === 0
  const clamp = (seconds: number) => Math.min(Math.max(seconds, 0), length)
  const share = (seconds: number) => (length === 0 ? 0 : clamp(seconds) / length)
  const at = (seconds: number) => `${share(seconds) * 100}%`
  const position = clamp(value)
  const groups = scrubberGroups(markers, length, width, kinds)
  // The mark the playhead stands on: within 7px of it, or, before the track is measured, at the
  // same moment.
  const current = groups.find((group) =>
    width > 0
      ? Math.abs(share(group.at) - share(position)) * width < ON
      : Math.abs(group.at - position) <= 0.05,
  )
  const currentKind = current === undefined ? undefined : kindsOf(current, kinds)[0]
  const currentTone = currentKind === undefined ? undefined : (kinds[currentKind].tone ?? 'neutral')
  // A mark of two stacked shapes takes a ring as tall as the stack: a capsule around both.
  const currentStacked = current !== undefined && shownKinds(current, kinds).length > 1

  const ticks = scrubberTicks(
    length,
    width > 0 ? Math.max(2, Math.min(maxTicks, Math.floor(width / TICK_ROOM) + 1)) : maxTicks,
  )
  const lastTick = ticks.at(-1) ?? 0
  // The end of the recording gets its own label where it leaves room after the last round one.
  const labels =
    width > 0 && length > lastTick && (1 - share(lastTick)) * width >= 56
      ? [...ticks, length]
      : ticks
  const usedKinds = (Object.keys(kinds) as K[]).filter((kind) =>
    markers.some((marker) => marker.kind === kind),
  )

  const track = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' || off) return
    const box = event.currentTarget.getBoundingClientRect()
    if (box.width === 0) return
    setHover({ x: Math.min(Math.max(event.clientX - box.left, 0), box.width), width: box.width })
  }
  const nearby =
    hover === null
      ? undefined
      : groups
          .map((group) => ({ group, distance: Math.abs(share(group.at) * hover.width - hover.x) }))
          .filter((entry) => entry.distance <= NEAR)
          .sort((a, b) => a.distance - b.distance)[0]?.group
  const seekTo = (seconds: number) => {
    onValueChange(seconds)
    onValueCommit?.(seconds)
  }

  return (
    <div
      data-nt-scrubber
      className={`@container flex min-w-0 flex-col gap-2 ${off ? 'opacity-40' : ''}`}
    >
      <div className="flex flex-col">
        <RadixSlider.Root
          value={[position]}
          min={0}
          max={length}
          step={step}
          disabled={off}
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
          className="no-drag group/scrubber relative flex h-(--nt-control-md) min-w-0 touch-none items-center select-none"
        >
          <RadixSlider.Track
            ref={measure}
            className="relative h-1 grow rounded-full bg-[color-mix(in_srgb,var(--nt-text-muted)_45%,transparent)]"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 rounded-full bg-[color-mix(in_srgb,var(--nt-text-secondary)_65%,transparent)]"
              style={{ width: at(position) }}
            />
          </RadixSlider.Track>
          <span
            aria-hidden="true"
            data-nt-scrubber-end
            className="pointer-events-none absolute top-1/2 right-0 h-2.5 w-0.5 -translate-y-1/2 rounded-full bg-muted"
          />
          {hover === null ? null : (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-full z-20 mb-1 flex max-w-72 flex-col gap-0.5 rounded-md bg-surface-active px-2 py-1 text-[11px] text-fg shadow-menu backdrop-blur-md"
              style={
                hover.x < hover.width / 2
                  ? { left: Math.max(hover.x - 8, 0) }
                  : { right: Math.max(hover.width - hover.x - 8, 0) }
              }
            >
              {nearby === undefined ? (
                <span className="text-secondary tabular-nums">
                  {formatTime((hover.x / hover.width) * length)}
                </span>
              ) : (
                nearby.markers.map((marker) => (
                  <span
                    key={`${marker.kind}-${marker.at}`}
                    className="flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span className="text-secondary tabular-nums">{formatTime(marker.at)}</span>
                    <Shape kind={kinds[marker.kind]} />
                    <span className="min-w-0 truncate">
                      {`${kinds[marker.kind].label} · ${marker.label}`}
                    </span>
                  </span>
                ))
              )}
            </span>
          )}
          <RadixSlider.Thumb
            aria-label={label}
            aria-valuetext={valueText(position, current?.markers ?? [])}
            className="group/thumb relative block size-0 outline-none"
          >
            <span
              data-nt-scrubber-thumb={currentTone ?? 'free'}
              className={`absolute top-0 left-0 block -translate-x-1/2 -translate-y-1/2 rounded-full border-2 outline-focus transition-transform duration-(--nt-duration-fast) group-hover/scrubber:scale-110 group-focus-visible/thumb:outline-2 group-focus-visible/thumb:outline-offset-2 motion-reduce:transition-none ${currentTone === undefined ? 'size-3.5 border-overlay bg-fg' : `${currentStacked ? 'h-8 w-[22px]' : 'size-[22px]'} bg-overlay ${TONE_THUMB[currentTone]}`}`}
            />
          </RadixSlider.Thumb>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
            {groups.map((group) => {
              const shown = shownKinds(group, kinds)
              return (
                <button
                  key={`${group.markers[0]?.kind}-${group.at}`}
                  type="button"
                  tabIndex={-1}
                  disabled={off}
                  data-nt-scrubber-marker={shown[0]}
                  data-nt-scrubber-count={group.markers.length}
                  className={`absolute top-0 flex h-full w-6 -translate-x-1/2 cursor-pointer flex-col items-center justify-center outline-none ${group === current || off ? 'pointer-events-none' : 'pointer-events-auto'}`}
                  style={{ left: at(group.at) }}
                  // A press on a mark seeks to its moment; it must not start the slider's own drag
                  // from wherever the pointer happened to land.
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => seekTo(group.at)}
                >
                  {shown.map((kind) => (
                    <Shape key={kind} kind={kinds[kind]} />
                  ))}
                  {group.markers.length > shown.length ? (
                    <span className="absolute top-0 left-1/2 ml-3 text-[11px] text-muted leading-none tabular-nums">
                      {group.markers.length}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </span>
        </RadixSlider.Root>
        <div aria-hidden="true" className="relative h-4 text-[11px] text-muted tabular-nums">
          {labels.map((tick) => {
            const where = share(tick)
            const align = where === 0 ? '' : where > 0.92 ? '-translate-x-full' : '-translate-x-1/2'
            // A label right under the playhead that says another time than the player steps aside.
            const under =
              width > 0 &&
              Math.abs(where - share(position)) * width < 20 &&
              formatTime(tick) !== formatTime(position)
            return (
              <span
                key={tick}
                className={`absolute top-0 transition-opacity duration-(--nt-duration-fast) motion-reduce:transition-none ${align} ${under ? 'opacity-0' : ''}`}
                style={{ left: at(tick) }}
              >
                {formatTime(tick)}
              </span>
            )
          })}
        </div>
      </div>
      {legendLabel === undefined || usedKinds.length === 0 ? null : (
        <ul
          aria-label={legendLabel}
          className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-[12px] text-secondary @max-[25rem]:gap-x-3"
        >
          {usedKinds.map((kind) => {
            const action = legendActions?.[kind]
            return (
              <li
                key={kind}
                className="flex min-h-6 items-center gap-1.5"
                {...(action === undefined ? { title: kinds[kind].label } : {})}
              >
                <Shape kind={kinds[kind]} />
                {/* On a narrow track a quiet kind keeps its shape and count; its word is the tooltip. */}
                <span className={action === undefined ? '@max-[25rem]:sr-only' : ''}>
                  {kinds[kind].label}
                </span>
                {action ?? (
                  <span className="text-muted tabular-nums">
                    {markers.filter((marker) => marker.kind === kind).length}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
