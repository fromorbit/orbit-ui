import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { PortalContainerProvider } from '../overlays/portal'
import { Button } from '../primitives/Button'

/** What stands open while one of the stage's layers is in the box. */
const LAYER = '[role="dialog"],[role="alertdialog"]'

/**
 * The stage of a story whose modal layer starts open: a box of the given height that the layer
 * opens in, scrim and all, instead of over the whole gallery.
 *
 * The box is a containing block (`transform`), so the layer's `fixed` panel and scrim are placed
 * against it, and the provider is `contained`, so the layer is not modal. That holds for the
 * keyboard as for the mouse:
 *
 * - **No focus on load.** The layer stands open in the picture, but the focus stays where the
 *   reader had it (the list of components, or the top of the page), so Tab walks the gallery as
 *   ever and reaches the layer at its place in the page.
 * - **No loop.** Tab past the last control of the layer goes on to what follows the stage, and
 *   Shift+Tab before the first back to what precedes it; the layer never holds the focus.
 * - **A way back.** The stage owns the open state and, while the layer is closed, shows a framed
 *   button (`reopenLabel`) that opens it again. Closing the layer, by Escape or by one of its
 *   buttons, hands the focus to that button, so it never falls to the page's body.
 */
export function LayerStage({
  height = 440,
  reopenLabel,
  children,
}: {
  height?: number
  /** The words of the button that opens the layer again, as the story's own trigger would say. */
  reopenLabel: string
  /** The layer, given the stage's open state. */
  children: (open: boolean, setOpen: (open: boolean) => void) => ReactNode
}): ReactNode {
  const [box, setBox] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(true)
  const trigger = useRef<HTMLButtonElement>(null)
  // Where the focus was as the story mounted: the layer hands it back there once it has taken it.
  const [before] = useState(() => (typeof document === 'undefined' ? null : document.activeElement))
  const loaded = useRef(false)

  // The first opening only: the layer focuses itself as it mounts; the focus goes back to where
  // the reader was.
  useEffect(() => {
    if (box === null || loaded.current) return
    loaded.current = true
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement
      if (!(active instanceof HTMLElement) || !box.contains(active)) return
      if (before instanceof HTMLElement && before !== document.body && before.isConnected) {
        before.focus({ preventScroll: true })
      } else active.blur()
    })
    return () => cancelAnimationFrame(frame)
  }, [box, before])

  // After a close, once the layer has left the box and handed the focus where it came from, the
  // button that opens it again takes it, unless the reader already went somewhere else.
  useEffect(() => {
    if (open || box === null) return
    let timer: ReturnType<typeof setTimeout> | undefined
    let tries = 0
    const wait = () => {
      tries += 1
      if (box.querySelector(LAYER) !== null && tries < 40) {
        timer = setTimeout(wait, 25)
        return
      }
      const active = document.activeElement
      if (active === null || active === document.body || box.contains(active)) {
        trigger.current?.focus({ preventScroll: true })
      }
    }
    timer = setTimeout(wait, 0)
    return () => clearTimeout(timer)
  }, [open, box])

  // Tab is the browser's own here: the layer's focus scope would loop it back to its first
  // control. Stopped on its way down, before the scope hears it; the browser still moves the focus.
  const onKeyDownCapture = (event: KeyboardEvent) => {
    if (event.key === 'Tab') event.stopPropagation()
  }

  return (
    <div
      ref={setBox}
      data-nt-layer-stage=""
      onKeyDownCapture={onKeyDownCapture}
      className="relative flex w-full transform-gpu items-center justify-center overflow-hidden rounded-lg bg-canvas"
      style={{ height }}
    >
      {open ? null : (
        <Button ref={trigger} onClick={() => setOpen(true)}>
          {reopenLabel}
        </Button>
      )}
      {box === null ? null : (
        <PortalContainerProvider container={box} contained>
          {children(open, setOpen)}
        </PortalContainerProvider>
      )}
    </div>
  )
}
