import { cva } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { Icon } from '../primitives/Icon'
import { Spinner } from '../primitives/Spinner'

/**
 * One quiet line. `success` keeps the sentence in `text-fg` and tints only the check: the words
 * are what carries the status, and a green sentence would make the colour do that work instead.
 */
const statusLine = cva('flex items-center gap-2 text-[12px]', {
  variants: {
    tone: {
      muted: 'text-muted',
      success: 'text-fg',
      danger: 'text-danger',
    },
  },
  defaultVariants: { tone: 'muted' },
})

/**
 * The glyph's slot, in every state that has a glyph.
 *
 * Saving → saved → failed swaps a spinner for a check and then a triangle, and one slot of the same
 * size keeps the sentence beside it still on each change. A plain muted line has no glyph and no
 * slot: an empty box of 14px plus its gap pushed it 22px off the left line it shares with
 * everything above it.
 */
const slot = 'flex size-(--nt-icon-sm) shrink-0 items-center justify-center'

/** The props of `StatusLine`. */
export interface StatusLineProps {
  /** `muted` is the resting tone; `success` and `danger` add a glyph beside the words. */
  tone?: 'muted' | 'success' | 'danger'
  /** Shows a spinner in the glyph slot; wins over the tone's own glyph. */
  busy?: boolean
  /** Right-hand detail, e.g. the token count; mono so it does not jiggle as it counts up. */
  meta?: ReactNode
  /** Already translated: a pattern never reaches into the catalogue itself. */
  children: ReactNode
}

/**
 * One line that says what is going on: under a settings pane, above the composer during a turn.
 *
 * Always `role="status"`, whatever the tone. A live region is only announced when it was already in
 * the document before its text changed, so keep one `StatusLine` mounted across the states of a
 * process and change its children; mounting it with the message and unmounting it afterwards
 * announces nothing at all. The role never changes either: swapping a mounted node's role from
 * `status` to `alert` is handled unreliably by screen readers, so a failure here is announced
 * politely and its severity is carried by the words, then the triangle and the colour. What has to
 * interrupt the user is a `Banner tone="danger"` or a dialog, not a status line.
 */
export function StatusLine({ tone = 'muted', busy, meta, children }: StatusLineProps) {
  return (
    <div role="status" className={statusLine({ tone })}>
      {busy || tone !== 'muted' ? (
        <span className={tone === 'success' ? `${slot} text-success` : slot}>
          {busy ? (
            <Spinner size="sm" decorative />
          ) : tone === 'success' ? (
            <Icon name="check-circle" size="sm" />
          ) : (
            <Icon name="alert-triangle" size="sm" />
          )}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {meta ? (
        <span className="shrink-0 font-mono text-[11px] text-muted tabular-nums">{meta}</span>
      ) : null}
    </div>
  )
}
