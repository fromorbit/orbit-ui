import { useEffect, useRef, useState } from 'react'
import { collectOccluders, observeLayers } from '../overlays/layers'
import { usePortalContainer } from '../overlays/portal'
import type { HostSurfaces, SurfaceEvent, SurfaceRect, SurfaceReport } from '../provider/host'
import { useUi } from '../provider/UiProvider'

/** What a mounted surface gives the reporter: its element, and where main's events go. */
interface Registration {
  element: HTMLElement
  listener(event: SurfaceEvent): void
}

/** The per-window collector behind every `HostedSurface`, as a caller outside one sees it. */
export interface SurfaceReporter {
  /** The panel edge started or stopped being dragged; every visible surface freezes meanwhile. */
  setDragging(dragging: boolean): void
  /** Moves the keyboard focus into the page of `id` (F6 from the address bar). */
  focus(id: string): void
}

/** The full reporter; `HostedSurface` alone registers and confirms. */
interface InternalReporter extends SurfaceReporter {
  register(id: string, element: HTMLElement, listener: (event: SurfaceEvent) => void): () => void
  setLayerRoot(root: HTMLElement | null): void
  drawn(id: string, seq: number): void
}

/** Where a surface stands in CSS pixels, or `null` when nothing of it is visible. */
function rectOf(element: HTMLElement): SurfaceRect | null {
  if (!element.isConnected) return null
  const { x, y, width, height } = element.getBoundingClientRect()
  return width > 0 && height > 0 ? { x, y, width, height } : null
}

/**
 * Re-dispatches a shortcut main took from a hosted view as a `keydown` on the document, so the
 * handlers that already listen on `window` (⌘⌥B, ⌘,) answer it as if it was pressed here.
 */
function dispatchShortcut(event: Extract<SurfaceEvent, { type: 'shortcut' }>): void {
  const { key } = event
  document.body.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: key.key,
      code: key.code,
      metaKey: key.meta,
      ctrlKey: key.control,
      altKey: key.alt,
      shiftKey: key.shift,
      bubbles: true,
      cancelable: true,
    }),
  )
}

/**
 * Builds the one collector of a window: it merges every surface, the layers and the drag into one
 * report per animation frame, and sends it only when it differs from the last.
 *
 * It only watches while a surface is mounted. Without one it sends nothing at all — not a drag,
 * not a layer — so a window without hosted content costs main no IPC (the perf budget "a
 * streaming answer sends no geometry report").
 */
function createSurfaceReporter(surfaces: HostSurfaces): InternalReporter {
  const registrations = new Map<string, Registration>()
  /** Surfaces that unmounted since the last report: said once as `null`, then forgotten. */
  const leaving = new Set<string>()
  let dragging = false
  let layerRoot: HTMLElement | null = null
  let last: string | null = null
  let seq = 0
  let scheduled = false
  let stopWatching: (() => void) | null = null
  let stopLayers: (() => void) | null = null
  let sizes: ResizeObserver | null = null

  function schedule(): void {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(flush)
  }

  function flush(): void {
    scheduled = false
    if (registrations.size === 0 && leaving.size === 0) return
    const state: Omit<SurfaceReport, 'seq'> = {
      surfaces: [
        ...[...registrations].map(([id, { element }]) => ({ id, rect: rectOf(element) })),
        ...[...leaving].map((id) => ({ id, rect: null })),
      ],
      occluders: collectOccluders(layerRoot, {
        width: window.innerWidth,
        height: window.innerHeight,
      }),
      dragging,
    }
    leaving.clear()
    const key = JSON.stringify(state)
    if (key !== last) {
      last = key
      seq += 1
      surfaces.report({ seq, ...state })
    }
    if (registrations.size === 0) stop()
  }

  function watchLayers(): void {
    stopLayers?.()
    stopLayers = layerRoot ? observeLayers(layerRoot, schedule) : null
  }

  function start(): void {
    const unsubscribe = surfaces.onEvent((event) => {
      if (event.type === 'shortcut') dispatchShortcut(event)
      else registrations.get(event.id)?.listener(event)
    })
    sizes = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null
    window.addEventListener('resize', schedule)
    // Scrolling moves a surface without resizing it; any scroller, hence the capture phase.
    document.addEventListener('scroll', schedule, { capture: true, passive: true })
    watchLayers()
    stopWatching = () => {
      unsubscribe()
      window.removeEventListener('resize', schedule)
      document.removeEventListener('scroll', schedule, { capture: true })
      sizes?.disconnect()
      sizes = null
      stopLayers?.()
      stopLayers = null
    }
  }

  function stop(): void {
    stopWatching?.()
    stopWatching = null
    // A next surface starts a new conversation: its first report is always sent.
    last = null
  }

  return {
    register(id, element, listener) {
      if (!stopWatching) start()
      leaving.delete(id)
      const registration = { element, listener }
      registrations.set(id, registration)
      sizes?.observe(element)
      schedule()
      return () => {
        if (registrations.get(id) !== registration) return
        registrations.delete(id)
        sizes?.unobserve(element)
        leaving.add(id)
        schedule()
      }
    },
    setLayerRoot(root) {
      if (root === layerRoot) return
      layerRoot = root
      if (stopWatching) watchLayers()
      schedule()
    },
    setDragging(next) {
      if (next === dragging) return
      dragging = next
      schedule()
    },
    focus: (id) => surfaces.focus(id),
    drawn: (id, seq) => surfaces.drawn(id, seq),
  }
}

/**
 * The host without a channel for hosted views: it hears nothing and never answers, so a surface
 * outside such a host is an empty box that tells no one where it stands. Not free: its reporter
 * still measures on an animation frame, observes the box's size and listens for layers, it only
 * sends what it measured nowhere.
 */
const NO_SURFACES: HostSurfaces = {
  report: () => {},
  focus: () => {},
  drawn: () => {},
  onEvent: () => () => {},
}

/** One reporter per host channel, which is one per window; a test's fake host gets its own. */
const reporters = new WeakMap<HostSurfaces, InternalReporter>()

function reporterFor(surfaces: HostSurfaces = NO_SURFACES): InternalReporter {
  let reporter = reporters.get(surfaces)
  if (!reporter) {
    reporter = createSurfaceReporter(surfaces)
    reporters.set(surfaces, reporter)
  }
  return reporter
}

/**
 * The collector of this window, for what lies outside a surface but changes where it may stand:
 * the resize edge of the panel says when it is dragged, the address bar asks for the focus.
 */
export function useSurfaceReporter(): SurfaceReporter {
  return reporterFor(useUi().host.surfaces)
}

/** Resolves after `count` animation frames. */
function afterFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    const next = (left: number) => {
      if (left === 0) resolve()
      else requestAnimationFrame(() => next(left - 1))
    }
    next(count)
  })
}

/** The props of `HostedSurface`. */
export interface HostedSurfaceProps {
  /** The id main knows the view by: the id of the tab. */
  id: string
  /** Called when the view itself gains or loses the keyboard focus. */
  onFocusChange?(focused: boolean): void
}

/** The still image of a frozen view, at the size the view had when it was captured. */
interface Frozen {
  seq: number
  image: string
  width: number
  height: number
}

/**
 * The place where main lays a hosted view — a `WebContentsView` — over the renderer.
 *
 * It speaks to main through the `surfaces` of the `UiProvider`'s host port; without them it is
 * only the empty box.
 *
 * It takes the rest of its column and draws nothing of the page itself: the view lies on top of
 * it. What it does is say where it stands, through the window's one reporter, once per frame and
 * only on a change; hidden or unmounted it says `null` and main takes the view off the window.
 * Nothing of the renderer may lie over this box (no transform, no rounded corner cutting into it):
 * what has to be above the page stands above it in the column, like the address bar.
 *
 * **Frozen.** When a layer (a menu, a dialog) opens over it, or the panel edge is dragged, main
 * captures the page and sends the image; this draws it in the view's place and confirms, and only
 * then does main hide the view. So there is never a frame without content, and the layer lies
 * above a still image instead of under a live page. The image keeps the view's size and hangs from
 * the top left: a drag that widens the panel shows the old page at its old size, not a stretched
 * one. On `thawed` the view is visible again and the image goes.
 */
export function HostedSurface({ id, onFocusChange }: HostedSurfaceProps) {
  const reporter = reporterFor(useUi().host.surfaces)
  const container = usePortalContainer()
  const box = useRef<HTMLDivElement>(null)
  const picture = useRef<HTMLImageElement>(null)
  const [frozen, setFrozen] = useState<Frozen | null>(null)
  const [focused, setFocused] = useState(false)
  // Read at the moment an event arrives, so a new callback never re-registers the surface.
  const focusChange = useRef(onFocusChange)
  focusChange.current = onFocusChange

  useEffect(() => {
    reporter.setLayerRoot(container)
  }, [reporter, container])

  useEffect(() => {
    const element = box.current
    if (!element) return
    return reporter.register(id, element, (event) => {
      if (event.type === 'frozen') {
        const { width, height } = element.getBoundingClientRect()
        setFrozen({ seq: event.seq, image: event.image, width, height })
      } else if (event.type === 'thawed') {
        setFrozen(null)
      } else if (event.type === 'focus') {
        setFocused(event.focused)
        focusChange.current?.(event.focused)
      }
    })
  }, [reporter, id])

  useEffect(() => {
    if (!frozen) return
    let cancelled = false
    const image = picture.current
    const decoded =
      image && typeof image.decode === 'function' ? image.decode().catch(() => {}) : undefined
    // Two frames after decoding: the first puts the image in a frame, the second is when that
    // frame has been presented. Hiding the view any earlier shows the empty box for a frame.
    void Promise.resolve(decoded)
      .then(() => afterFrames(2))
      .then(() => {
        if (!cancelled) reporter.drawn(id, frozen.seq)
      })
    return () => {
      cancelled = true
    }
  }, [frozen, reporter, id])

  return (
    <div
      ref={box}
      data-nt-hosted-surface={id}
      data-state={frozen ? 'frozen' : 'live'}
      {...(focused ? { 'data-focused': '' } : {})}
      className="relative min-h-0 min-w-0 flex-1 overflow-hidden"
    >
      {frozen ? (
        <img
          ref={picture}
          src={frozen.image}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute top-0 left-0 max-w-none select-none"
          style={{ width: `${frozen.width}px`, height: `${frozen.height}px` }}
        />
      ) : null}
    </div>
  )
}
