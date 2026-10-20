import { afterEach, describe, expect, test } from 'vitest'
import { collectOccluders, observeLayers } from './layers'

const viewport = { width: 1280, height: 800 }

/** Rects by element, standing in for layout: happy-dom lays nothing out. */
const rects = new Map<Element, { x: number; y: number; width: number; height: number }>()
const measure = (element: Element) => rects.get(element) ?? { x: 0, y: 0, width: 0, height: 0 }

function layer(html: string): HTMLElement {
  const root = document.createElement('div')
  root.innerHTML = html
  document.body.append(root)
  return root
}

afterEach(() => {
  rects.clear()
  document.body.innerHTML = ''
})

describe('collectOccluders', () => {
  test('a menu counts with its own rect', () => {
    const root = layer('<div data-radix-popper-content-wrapper><div role="menu"></div></div>')
    const menu = { x: 900, y: 60, width: 220, height: 180 }
    rects.set(root.firstElementChild as Element, menu)
    expect(collectOccluders(root, viewport, measure)).toEqual([menu])
  })

  test('a passive layer does not count', () => {
    const root = layer(
      '<div data-radix-popper-content-wrapper><div role="tooltip" data-nt-layer="passive"></div></div>',
    )
    rects.set(root.firstElementChild as Element, { x: 900, y: 60, width: 120, height: 24 })
    expect(collectOccluders(root, viewport, measure)).toEqual([])
  })

  test('a dialog counts as the whole window', () => {
    // The backdrop of a dialog covers the window anyway; the dialog itself says so even when its
    // box is small, so a dialog without a backdrop still freezes every view.
    const root = layer('<div role="alertdialog"></div>')
    rects.set(root.firstElementChild as Element, { x: 400, y: 300, width: 480, height: 200 })
    expect(collectOccluders(root, viewport, measure)).toEqual([
      { x: 0, y: 0, width: 1280, height: 800 },
    ])
  })

  test('a wrapper without a box of its own counts with what it holds', () => {
    // Radix' portal root around the toast viewport has no height: the viewport inside it is fixed.
    const root = layer('<div><ol><li></li></ol></div>')
    const list = root.querySelector('ol') as Element
    rects.set(list, { x: 16, y: 700, width: 320, height: 84 })
    expect(collectOccluders(root, viewport, measure)).toEqual([
      { x: 16, y: 700, width: 320, height: 84 },
    ])
  })

  test('an empty layer counts for nothing', () => {
    // An empty toast viewport is a list with a width and no height.
    const root = layer('<div><ol></ol></div>')
    rects.set(root.querySelector('ol') as Element, { x: 16, y: 784, width: 320, height: 0 })
    expect(collectOccluders(root, viewport, measure)).toEqual([])
  })

  test('without a container there are no layers', () => {
    expect(collectOccluders(null, viewport, measure)).toEqual([])
  })
})

describe('observeLayers', () => {
  test('hears a layer come and go', async () => {
    const root = layer('')
    let changes = 0
    const stop = observeLayers(root, () => {
      changes++
    })
    const menu = document.createElement('div')
    root.append(menu)
    await Promise.resolve()
    menu.remove()
    await Promise.resolve()
    expect(changes).toBeGreaterThanOrEqual(2)
    stop()
    root.append(document.createElement('div'))
    await Promise.resolve()
    const after = changes
    await Promise.resolve()
    expect(changes).toBe(after)
  })
})
