import type { KeyboardEvent, PointerEvent } from 'react'
import { useRef } from 'react'

interface WidthAfterDragArgs {
  /** The value the drag began at. */
  start: number
  /** Pointer movement since the drag began, in the same units as `start`; right is positive. */
  dx: number
  min: number
  max: number
}

/**
 * The whole arithmetic of a drag: where it started, plus how far the pointer has moved, clamped.
 *
 * Pulled out of the component because happy-dom has no real pointer capture and no layout, so a
 * drag itself can only be proven in a real browser; this pure half is what Vitest can still
 * pin down on its own.
 */
export function widthAfterDrag({ start, dx, min, max }: WidthAfterDragArgs): number {
  return Math.min(max, Math.max(min, start + dx))
}

/** The props of `ResizeHandle`. */
export interface ResizeHandleProps {
  /** Accessible name; the handle has no visible text of its own. */
  label: string
  /** The width it reports on, in pixels. It does not own this value — see the component doc. */
  value: number
  min: number
  max: number
  /** Pixels per arrow-key press. @default 16 */
  step?: number
  /** Called with the next width, while dragging and on every key press. */
  onValueChange(next: number): void
  /**
   * A key press is a finished change: the same width, said once more, as worth keeping.
   *
   * Only the keyboard has this, and it carries the value rather than leaving the caller to read it
   * back: a press sets and finishes in one event, so the render that shows the new width has not
   * happened yet and a caller reading its own props would keep the width from *before* the press.
   * A drag says so through `onDragChange(false)` instead, where the value has long since arrived.
   */
  onCommit?(value: number): void
  /** Called on a double click, e.g. to restore the default width. */
  onReset?(): void
  /**
   * Called during a drag with the value the pointer points at, *before* `min` and `max` clamp it,
   * and before `onValueChange` hears the clamped one.
   *
   * For a caller that does something past a bound rather than stopping there: the right panel snaps
   * to full screen when its edge is dragged well beyond the widest (`fullscreenAfterDrag`). The
   * keyboard has no such value — a key asks for a bound, never for beyond it.
   */
  onDragMove?(pointer: number): void
  /** `true` when a drag begins, `false` when it ends — before any width has necessarily changed. */
  onDragChange?(dragging: boolean): void
  /** `id` of the element this handle resizes, for `aria-controls`. */
  controls?: string
}

/**
 * A vertical, draggable and keyboard-operable separator between two panes — the ARIA "window
 * splitter" pattern, which Radix has no primitive for.
 *
 * **It does not own the width it shows.** A caller passes `value` and gets `onValueChange` calls
 * back; nothing here decides when that number is worth keeping (the right
 * panel only writes it to settings on `pointerup`, a key press, a double click, or open/close, not
 * on every frame of a drag). `onDragChange` exists for the same reason and one more: a native view
 * drawn on top of the renderer will need to know when to freeze itself
 * for the drag and thaw once it ends, and that signal costs nothing to add now.
 *
 * **This draws the only separating line.** The 1px `bg-border` line below sits in the middle of the
 * 7px hitbox, so it doubles as the affordance for what you can grab — a caller placing this handle
 * beside a pane must not paint its own border there too, or the visible line stops matching the
 * area that responds to a pointer.
 */
export function ResizeHandle({
  label,
  value,
  min,
  max,
  step = 16,
  onValueChange,
  onCommit,
  onReset,
  onDragChange,
  onDragMove,
  controls,
}: ResizeHandleProps) {
  // A ref, not state: the drag's own bookkeeping never needs to trigger a render by itself, only
  // the `onValueChange` calls it makes along the way do.
  const drag = useRef<{ pointerId: number; startValue: number; startX: number } | null>(null)

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    drag.current = { pointerId: event.pointerId, startValue: value, startX: event.clientX }
    // happy-dom stubs this but does not implement it; guarded all the same, since a real pointer
    // capture can fail (e.g. the pointer was already released) for reasons that have nothing to do
    // with this handle.
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Capture is an optimisation (keeps receiving moves outside the handle); losing it just
      // means a fast drag can outrun the 7px hit area, which Playwright's drag test would catch.
    }
    onDragChange?.(true)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    onDragMove?.(current.startValue + event.clientX - current.startX)
    onValueChange(
      widthAfterDrag({ start: current.startValue, dx: event.clientX - current.startX, min, max }),
    )
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return
    drag.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // See handlePointerDown: releasing a capture this handle may never have gotten is harmless.
    }
    onDragChange?.(false)
  }

  /** The width the four keys this handle answers ask for, or `undefined` for any other key. */
  function valueAfterKey(key: string): number | undefined {
    switch (key) {
      case 'ArrowLeft':
        return Math.max(min, value - step)
      case 'ArrowRight':
        return Math.min(max, value + step)
      case 'Home':
        return min
      case 'End':
        return max
      default:
        return undefined
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = valueAfterKey(event.key)
    if (next === undefined) return
    event.preventDefault()
    onValueChange(next)
    // And in the same breath: a press is a whole change, not a frame of one. See `onCommit`.
    onCommit?.(next)
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: an `<hr>` cannot take focus or carry `aria-value*`; this is the interactive "window splitter" separator ARIA describes, not a plain divider.
    <div
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      aria-valuenow={Math.round(value)}
      aria-valuemin={Math.round(min)}
      aria-valuemax={Math.round(max)}
      {...(controls ? { 'aria-controls': controls } : {})}
      tabIndex={0}
      // `no-drag`: this sits against the title bar, and a plain click there would otherwise drag
      // the window instead of grabbing the handle. `touch-none` keeps a touch drag from also
      // scrolling the page underneath it. The 7px hit area is invisible; only the 1px line paints.
      className="no-drag relative w-[7px] shrink-0 cursor-col-resize touch-none outline-focus focus-visible:outline-2 focus-visible:-outline-offset-2"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={handleKeyDown}
      onDoubleClick={() => onReset?.()}
    >
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
    </div>
  )
}
