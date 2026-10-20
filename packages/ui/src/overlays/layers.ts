import type { SurfaceRect } from '../provider/host'

/** Reads the box of an element in CSS pixels of the viewport; a test hands in its own layout. */
export type Measure = (element: Element) => SurfaceRect

/** The browser's own layout: the element's border box, relative to the viewport. */
const layoutOf: Measure = (element) => {
  const { x, y, width, height } = element.getBoundingClientRect()
  return { x, y, width, height }
}

/**
 * A layer that says it covers the whole window: a modal dialog. Its backdrop covers it anyway, but
 * the dialog itself decides, so one without a backdrop still freezes every hosted view.
 */
const MODAL = '[role="alertdialog"],[aria-modal="true"],[data-nt-layer="modal"]'

/**
 * A layer that never counts: a tooltip. It opens on hover and on every focus, and a page that froze
 * each time the pointer crossed the address bar would be worse than a tooltip that may not fall
 * over it.
 */
const PASSIVE = '[data-nt-layer="passive"]'

function hasArea(rect: SurfaceRect): boolean {
  return rect.width > 0 && rect.height > 0
}

/**
 * The boxes a layer covers: its own, or — for a wrapper without a box of its own, such as the
 * portal root around the fixed toast viewport — those of what it holds.
 */
function boxesOf(element: Element, measure: Measure): SurfaceRect[] {
  const rect = measure(element)
  if (hasArea(rect)) return [rect]
  return [...element.children].flatMap((child) => boxesOf(child, measure))
}

/**
 * The rectangles of every open layer in the portal container, as `SurfaceReport.occluders`.
 *
 * Every direct child of the container is a layer: that is where each `Popover`, `DropdownMenu`,
 * `ConfirmDialog`, `Tooltip` and the toast viewport land, and
 * nothing else does. A menu counts with its own box, a modal dialog as the whole window, a passive
 * layer (a tooltip) not at all, and an empty one (a toast viewport without toasts) neither.
 */
export function collectOccluders(
  root: HTMLElement | null,
  viewport: { width: number; height: number },
  measure: Measure = layoutOf,
): SurfaceRect[] {
  if (!root) return []
  const occluders: SurfaceRect[] = []
  for (const layer of root.children) {
    if (layer.matches(PASSIVE) || layer.querySelector(PASSIVE)) continue
    if (layer.matches(MODAL) || layer.querySelector(MODAL)) {
      occluders.push({ x: 0, y: 0, width: viewport.width, height: viewport.height })
      continue
    }
    occluders.push(...boxesOf(layer, measure))
  }
  return occluders
}

/**
 * Calls `onChange` whenever a layer in the container may have come, gone, moved or changed size.
 *
 * A `MutationObserver` for coming and going and for moving (Radix positions a layer by rewriting
 * its `style`), and a `ResizeObserver` on each layer for a size that changes without any attribute
 * doing so, such as a menu whose rows arrive late. The caller merges the calls per frame.
 *
 * @returns The function that stops observing.
 */
export function observeLayers(root: HTMLElement, onChange: () => void): () => void {
  const sizes = typeof ResizeObserver === 'function' ? new ResizeObserver(() => onChange()) : null
  const watchSizes = () => {
    if (!sizes) return
    sizes.disconnect()
    for (const layer of root.children) {
      sizes.observe(layer)
      if (layer.firstElementChild) sizes.observe(layer.firstElementChild)
    }
  }
  const mutations = new MutationObserver((records) => {
    if (records.some((record) => record.type === 'childList' && record.target === root)) {
      watchSizes()
    }
    onChange()
  })
  mutations.observe(root, { childList: true, subtree: true, attributes: true })
  watchSizes()
  return () => {
    mutations.disconnect()
    sizes?.disconnect()
  }
}
