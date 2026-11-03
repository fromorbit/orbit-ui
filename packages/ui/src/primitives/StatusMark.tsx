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
 * The status of something that runs as a small mark with a soft glow: a circle running, a
 * triangle at fault, a diamond blocked, a square stopped.
 *
 * The shape is the information; it is a flat fill in its status colour
 * (`--nt-status-run|fail|block|stop`) with a soft glow of that colour around it, full in dark and a
 * whisper in light (`--nt-status-glow`, 1 and 0.22). A host may set the glow on an element to calm
 * the marks inside. The same tokens and drawing as Halo's own marks. It stands still under the
 * pointer. All of it is drawn by `theme.css` (`nt-status-mark`), not by an SVG: the glow of the
 * triangle is a `drop-shadow` on the outer element, because its `clip-path` cuts a `box-shadow` off.
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
