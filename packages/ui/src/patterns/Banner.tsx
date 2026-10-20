import { cva } from 'class-variance-authority'
import { type ReactNode, useRef } from 'react'
import { Icon } from '../primitives/Icon'
import { Spinner } from '../primitives/Spinner'

/**
 * The bar itself: one row of the list-row height, tinted by its tone.
 *
 * `min-h-` rather than `h-`: a banner carries a sentence the caller did not write (a core error, a
 * provider code), and a fixed height would either clip it or force the caller to keep it short.
 * One line lands on exactly 32px, so it still lines up with the controls beside it.
 */
const banner = cva(
  'flex min-h-(--nt-control-lg) w-full items-center gap-2 rounded-md border px-2 py-1 text-[12px]',
  {
    variants: {
      tone: {
        attention: 'border-attention-border bg-attention-subtle text-attention',
        danger: 'border-danger-border bg-danger-subtle text-danger',
      },
    },
  },
)

/** The props of `Banner`. */
export interface BannerProps {
  /**
   * `attention` is a passing condition, `danger` something that went wrong and needs reading.
   *
   * Fixed for the life of one mounted `Banner`: it decides the role, which is read once. Render a
   * separate `Banner` per tone (`key={tone}`) rather than changing this on a mounted one.
   */
  tone: 'attention' | 'danger'
  /** Swaps the icon for a spinner: the condition is being worked on, e.g. core is restarting. */
  busy?: boolean
  /**
   * `false` drops the role, for a caller that announces the sentence itself.
   *
   * The escape hatch for a bar that is mounted and unmounted with its condition: its own `status`
   * then announces nothing (see below), and the caller that solves that with a live region of its
   * own would otherwise have the sentence read out twice. Fixed at the first render, like the
   * role it removes.
   */
  announce?: boolean
  /** What to do about it, e.g. a `Button` that retries; sits against the right edge. */
  action?: ReactNode
  /** Already translated: a pattern never reaches into the catalogue itself. */
  children: ReactNode
}

/**
 * A full-width bar for a condition of the whole app or chat, which stays until it is over.
 *
 * `role="status"` for `attention` and `role="alert"` for `danger`: the first is a fact the user may
 * read when it suits them, the second interrupts because something they asked for did not happen.
 * An `alert` is announced reliably when it is *inserted*, which is exactly when an error banner
 * appears, so an error is free to mount with its message.
 *
 * The contract that follows from that: one tone per mounted `Banner`. Render a fresh one per tone
 * (`key={tone}`) rather than changing `tone` on a mounted bar, because a role is read once when the
 * element joins the accessibility tree and screen readers handle a later change to it unreliably.
 * The component holds that line for a caller who changes `tone` anyway: the role is taken from the
 * first render and kept. Only the role, though — the colours follow `tone` on every render, so a
 * caller who breaks the contract ends up with an `alert` painted amber, or a `status` painted red.
 * That mismatch is deliberate: it is visible on screen the first time it happens, where a silently
 * re-tinted role would only show up for someone using a screen reader. Within one tone the opposite
 * advice applies — keep the bar mounted while
 * the condition can recur and change its children, since a `status` region that is mounted together
 * with its message announces nothing. A caller that cannot keep the bar mounted (an empty bar would
 * be a 32px stripe of nothing) puts its own always-mounted `sr-only` region beside it and passes
 * `announce={false}`, so the sentence is heard once instead of twice or not at all.
 */
export function Banner({ tone, busy, announce = true, action, children }: BannerProps) {
  // Fixed at the first render of this instance: see the contract above.
  const role = useRef<'status' | 'alert' | undefined>(
    announce ? (tone === 'danger' ? 'alert' : 'status') : undefined,
  ).current
  return (
    <div role={role} className={banner({ tone })}>
      <span className="flex shrink-0 items-center">
        {busy ? <Spinner size="sm" decorative /> : <Icon name="alert-triangle" size="sm" />}
      </span>
      {/* `min-w-0` so a long sentence wraps inside the bar instead of pushing the action out. */}
      <p className="m-0 min-w-0 flex-1">{children}</p>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
