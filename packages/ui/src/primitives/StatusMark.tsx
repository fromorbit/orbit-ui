import type { ReactNode } from 'react'

/**
 * The state of something that runs on its own (a service, an app, a space), as `StatusMark`
 * draws it: up, broken, held back by something it waits for, or down.
 *
 * Its own four words rather than the seven of a chat (`RunStatusKind`, drawn by `StatusShape`):
 * a process has no "waiting for you" or "done", and a host maps its own vocabulary onto these.
 */
export type StatusMarkKind = 'running' | 'fault' | 'blocked' | 'stopped'

/** The shape of each kind, so none of them leans on colour alone. */
const SHAPES: Record<StatusMarkKind, 'circle' | 'triangle' | 'diamond' | 'square'> = {
  running: 'circle',
  fault: 'triangle',
  blocked: 'diamond',
  stopped: 'square',
}

/** The props of `StatusMark`. */
export interface StatusMarkProps {
  kind: StatusMarkKind
  /**
   * The status word ("Draait"): given, the mark is named by it (`role="img"`), for a mark that
   * stands without the word beside it. Left out, the mark stays decorative, because the row around
   * it already says its status in words. A host that wants the word on hover wraps the mark in a
   * `Tooltip` itself.
   */
  label?: string
}

/**
 * The status of something that runs as a small glossy sweet: a circle running, a triangle at
 * fault, a diamond blocked, a square stopped.
 *
 * The shape is the information; the colour (`--nt-status-run|fail|block|stop`), a light highlight
 * (their `-hi`) and a soft glow in the mark's own colour make it pleasant to look at. On a light
 * ground the glow and the gloss are weaker (`--nt-status-glow` 0.45, `--nt-status-gloss` 0.5;
 * both 1 in dark), and a host may set either on an element to calm the marks inside. The same
 * tokens and drawing as Halo's own status sweets. Inside a button, link, tab or option the mark springs up a little under the pointer,
 * never with reduced motion. All of it is drawn by `theme.css` (`nt-status-mark`), not by an SVG:
 * the glow of the triangle is a `drop-shadow` on the outer element, because its `clip-path` cuts a
 * `box-shadow` off.
 *
 * Always the same 14px slot, so a column of names beside it stays in line.
 */
export function StatusMark({ kind, label }: StatusMarkProps): ReactNode {
  const body = <span className="nt-status-mark-body" />
  return label ? (
    <span
      role="img"
      aria-label={label}
      data-nt-status-mark
      data-kind={kind}
      data-shape={SHAPES[kind]}
      className="nt-status-mark"
    >
      {body}
    </span>
  ) : (
    <span
      aria-hidden="true"
      data-nt-status-mark
      data-kind={kind}
      data-shape={SHAPES[kind]}
      className="nt-status-mark"
    >
      {body}
    </span>
  )
}
