import type { ReactNode } from 'react'
import { Tooltip } from '../overlays/Tooltip'
import type { RunStatusKind } from './status-kind'

/** The outline of every drawn shape: thin enough that a column of them stays quiet. */
const STROKE = 1.4

/** The radius of the busy circle, inside the 14 box with room for the stroke. */
const RADIUS = 4.5

/**
 * The open arc of the busy circle: sixty percent of its circumference drawn, the rest open, so the
 * turning is visible and the circle never reads as a closed ring.
 */
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const ARC = `${(CIRCUMFERENCE * 0.6).toFixed(2)} ${(CIRCUMFERENCE * 0.4).toFixed(2)}`

/**
 * Dots rather than dashes: a zero-length dash with a round cap is a dot as wide as the stroke.
 * What a prepared message looks like on any shape.
 */
const DOTTED = '0.01 2.2'

/** The polygons, on the 14-unit box of the original mockup. */
const TRIANGLE = 'M7 2.5l5 8.5H2z'
const PENTAGON = 'M7 2.2l4.6 3.3-1.8 5.4H4.2L2.4 5.5z'
const HEXAGON = 'M7 2l4.33 2.5v5L7 12 2.67 9.5v-5z'

/**
 * The small check inside the hexagon of a finished chat, centred in it, so a finished
 * chat reads as done at a glance.
 *
 * Its stroke is a touch thinner than the outline's, so the two lines do not run together at 14px.
 */
const CHECK = 'M5.3 7.1l1.2 1.2 2.2-2.4'
const CHECK_STROKE = 1.2

type Shape = 'circle' | 'triangle' | 'square' | 'pentagon' | 'hexagon'

/** How one kind is drawn: its shape, its tone, and whether it is filled. */
interface Drawing {
  shape: Shape
  /** The text colour of the SVG, as a Tailwind class over the tokens; the shape paints in it. */
  tone: string
  filled: boolean
}

/**
 * How a closed chat last ended: finished, failed, or broken off (by a stop or a restart).
 *
 * Its own small type rather than the protocol's `RunOutcome`: this library draws shapes and knows
 * nothing about the wire; a feature maps its own vocabulary onto these three words.
 */
export type ClosedAs = 'done' | 'failed' | 'interrupted'

/**
 * The drawing per kind, or `null` for a chat that never started.
 *
 * `closed` is drawn by how the chat ended ({@link closedDrawings}); this entry is the fallback for a
 * closed chat whose ending nobody knows — one written down before core kept it — which reads as
 * finished, because most of those were.
 */
const drawings: Record<RunStatusKind, Drawing> = {
  running: { shape: 'circle', tone: 'text-accent-text', filled: false },
  // An outline, like the rest: amber is loud enough on its own, and a
  // filled triangle in a column of quiet lines shouted. Only a live failure stays filled.
  attention: { shape: 'triangle', tone: 'text-attention', filled: false },
  failed: { shape: 'square', tone: 'text-danger', filled: true },
  interrupted: { shape: 'square', tone: 'text-muted', filled: false },
  queued: { shape: 'pentagon', tone: 'text-muted', filled: false },
  done: { shape: 'hexagon', tone: 'text-success', filled: false },
  closed: { shape: 'hexagon', tone: 'text-success', filled: false },
}

/**
 * A closed chat by how it ended: the shape and the colour of that ending, but always an outline —
 * a closed chat asks for nothing, so the fill of a live failure does not belong to it. The
 * colour does: after a restart every chat is closed, and a column of grey outlines
 * said nothing about which of them went well.
 */
const closedDrawings: Record<ClosedAs, Drawing> = {
  done: drawings.done,
  failed: { shape: 'square', tone: 'text-danger', filled: false },
  interrupted: drawings.interrupted,
}

/** The props of `StatusShape`. */
export interface StatusShapeProps {
  kind: RunStatusKind | null
  /**
   * A message stands ready for this chat — prepared, or not yet sent. The shape stays the same,
   * drawn as a dotted outline, so the state still reads and the waiting message shows beside it.
   */
  pending?: boolean
  /** For a `closed` chat: how it last ended; left out when nobody knows. */
  closedAs?: ClosedAs | null
  /**
   * Keeps the shape but drops its colour and fill: for a row that asks for nothing whatever its
   * state, such as an archived chat.
   */
  muted?: boolean
  /**
   * The status word ("Wacht op jou"): given, the shape is named by it (`role="img"`) and shows it
   * as a tooltip, for a shape that stands without the word beside it. Left out, the
   * shape stays decorative, because the row around it already says its status in words.
   */
  label?: string
}

/**
 * The status of a chat as a shape on its number of sides: circle busy, triangle waiting for you,
 * square failed (filled) or interrupted (outline), pentagon queued, hexagon done (with a small
 * check inside, closed or not).
 *
 * The more sides, the further along the work: the circle moves, the triangle warns, the square
 * stops. Only a failure is filled; the rest, waiting for you too, is a 1.4px outline in a 14px box,
 * so the column stays quiet at rest. Colour follows meaning, one token each: busy in the accent, waiting
 * in attention, finished in success, failed in danger; queued and interrupted stay muted. Every
 * state has a shape of its own, so none of them leans on colour alone.
 *
 * Decorative (`aria-hidden`): the row around it carries the status in words —
 * unless it is given a `label`, and then it carries the word itself, as its name and its tooltip.
 * Always the same 14px slot, drawn or not, so the titles beside it keep one column. The shapes
 * stay our own drawing, not Lucide.
 */
export function StatusShape({
  kind,
  pending = false,
  closedAs,
  muted = false,
  label,
}: StatusShapeProps): ReactNode {
  const drawing =
    kind === 'closed' && closedAs ? closedDrawings[closedAs] : kind ? drawings[kind] : null
  if (!drawing) {
    return (
      <span
        aria-hidden="true"
        data-nt-status-shape
        data-kind="none"
        className="block size-3.5 shrink-0"
      />
    )
  }
  const filled = drawing.filled && !pending && !muted
  const paint = {
    fill: filled ? 'currentColor' : 'none',
    stroke: filled ? 'none' : 'currentColor',
    strokeWidth: STROKE,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
    ...(pending ? { strokeDasharray: DOTTED } : {}),
  }
  const shape = (
    <svg
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      data-nt-status-shape
      data-kind={kind}
      data-shape={drawing.shape}
      {...(pending ? { 'data-pending': 'true' } : {})}
      {...(muted ? { 'data-muted': 'true' } : {})}
      viewBox="0 0 14 14"
      className={`block size-3.5 shrink-0 ${muted ? 'text-muted' : drawing.tone}`}
    >
      {figure(drawing.shape, paint)}
      {/* Every hexagon is a finished chat, closed or not; in the same colour, and solid even on a
          dotted outline, because the dots are what say a message stands ready. */}
      {drawing.shape === 'hexagon' ? (
        <path
          data-nt-status-check
          d={CHECK}
          fill="none"
          stroke="currentColor"
          strokeWidth={CHECK_STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  )
  return label ? <Tooltip label={label}>{shape}</Tooltip> : shape
}

/** The one element that draws a shape, with the paint of its state. */
function figure(shape: Shape, paint: Record<string, string | number>): ReactNode {
  switch (shape) {
    case 'circle':
      // The open arc turns; a dotted circle turns as well, so "busy" keeps its motion.
      return (
        <circle
          className="nt-shape-spin"
          cx="7"
          cy="7"
          r={RADIUS}
          {...paint}
          strokeDasharray={paint.strokeDasharray ?? ARC}
        />
      )
    case 'square':
      return <rect x="3" y="3" width="8" height="8" rx="1" {...paint} />
    case 'triangle':
      return <path d={TRIANGLE} {...paint} />
    case 'pentagon':
      return <path d={PENTAGON} {...paint} />
    case 'hexagon':
      return <path d={HEXAGON} {...paint} />
  }
}
