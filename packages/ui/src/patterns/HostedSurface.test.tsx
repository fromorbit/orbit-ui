import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { PortalContainerProvider } from '../overlays/portal'
import type { SurfaceRect } from '../provider/host'
import { UiProvider } from '../provider/UiProvider'
import { createFakeHost, type FakeHost } from '../testing/fake-host'
import { HostedSurface, useSurfaceReporter } from './HostedSurface'

/** Where each surface stands, by id, and each layer by `data-test-layer`: happy-dom lays out nothing. */
const layout = new Map<string, SurfaceRect>()
const EMPTY = { x: 0, y: 0, width: 0, height: 0 }

/** Animation frames, run by hand: a test decides when a frame passes. */
let frames: FrameRequestCallback[] = []
function frame() {
  const due = frames
  frames = []
  act(() => {
    for (const callback of due) callback(performance.now())
  })
}

let host: FakeHost

beforeEach(() => {
  host = createFakeHost()
  frames = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    // A hidden ancestor lays its subtree out at nothing, as in a browser.
    if (this.closest('[hidden]')) return DOMRect.fromRect(EMPTY)
    const key = this.dataset.ntHostedSurface ?? this.dataset.testLayer
    return DOMRect.fromRect(key === undefined ? EMPTY : (layout.get(key) ?? EMPTY))
  })
})

afterEach(() => {
  layout.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const panel = { x: 880, y: 80, width: 400, height: 720 }

function renderSurface(ui: React.ReactNode, container: HTMLElement | null = null) {
  return render(
    <UiProvider host={host}>
      <PortalContainerProvider container={container}>{ui}</PortalContainerProvider>
    </UiProvider>,
  )
}

/** Lets pending promises (an image's decode) settle. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe('HostedSurface', () => {
  test('reports its rect through the host port', () => {
    layout.set('tab_a', panel)
    renderSurface(<HostedSurface id="tab_a" />)
    frame()
    expect(host.surfaces.reports).toEqual([
      { seq: 1, surfaces: [{ id: 'tab_a', rect: panel }], occluders: [], dragging: false },
    ])
  })

  test('without a host it draws its empty box and reports nothing', () => {
    layout.set('tab_a', panel)
    // A host without a channel inside one with a channel: the outer one must hear nothing, so the
    // surface really reports to the host it stands in rather than to whichever is near.
    const { container } = render(
      <UiProvider host={host}>
        <UiProvider host={{}}>
          <HostedSurface id="tab_a" />
        </UiProvider>
      </UiProvider>,
    )
    frame()
    expect(container.querySelector('[data-nt-hosted-surface="tab_a"]')).not.toBeNull()
    expect(host.surfaces.reports).toEqual([])
  })

  test('a hidden surface reports null', () => {
    layout.set('tab_a', panel)
    renderSurface(
      <div hidden>
        <HostedSurface id="tab_a" />
      </div>,
    )
    frame()
    expect(host.surfaces.reports.at(-1)?.surfaces).toEqual([{ id: 'tab_a', rect: null }])
  })

  test('reports at most once per frame', () => {
    layout.set('tab_a', panel)
    layout.set('tab_b', { ...panel, y: 400, height: 400 })
    function Both() {
      const reporter = useSurfaceReporter()
      return (
        <>
          <HostedSurface id="tab_a" />
          <HostedSurface id="tab_b" />
          <button type="button" onClick={() => reporter.setDragging(true)}>
            sleep
          </button>
        </>
      )
    }
    const { getByRole } = renderSurface(<Both />)
    frame()
    expect(host.surfaces.reports).toHaveLength(1)

    // Three changes inside one frame: the window grows twice and the drag starts.
    layout.set('tab_a', { ...panel, x: 900 })
    window.dispatchEvent(new Event('resize'))
    window.dispatchEvent(new Event('resize'))
    act(() => getByRole('button').click())
    frame()
    expect(host.surfaces.reports).toHaveLength(2)
    expect(host.surfaces.reports[1]).toMatchObject({ seq: 2, dragging: true })
  })

  test('reports nothing when nothing changed', () => {
    layout.set('tab_a', panel)
    renderSurface(<HostedSurface id="tab_a" />)
    frame()
    window.dispatchEvent(new Event('resize'))
    frame()
    expect(host.surfaces.reports).toHaveLength(1)
  })

  test('a scroll that moves the surface is reported', () => {
    // A move is no resize: without listening to scrolling, a surface in a scrolled column would
    // leave its view behind where it stood.
    layout.set('tab_a', panel)
    renderSurface(<HostedSurface id="tab_a" />)
    frame()
    layout.set('tab_a', { ...panel, y: 40 })
    document.body.dispatchEvent(new Event('scroll'))
    frame()
    expect(host.surfaces.reports.at(-1)?.surfaces).toEqual([
      { id: 'tab_a', rect: { ...panel, y: 40 } },
    ])
  })

  test('counts the layers in the portal container, and a tooltip not', () => {
    layout.set('tab_a', panel)
    const layers = document.createElement('div')
    document.body.append(layers)
    try {
      renderSurface(<HostedSurface id="tab_a" />, layers)
      frame()
      const menu = { x: 860, y: 60, width: 200, height: 160 }
      layout.set('menu', menu)
      layout.set('tip', { x: 900, y: 100, width: 80, height: 24 })
      layers.innerHTML =
        '<div data-test-layer="menu" role="menu"></div><div data-test-layer="tip" data-nt-layer="passive"></div>'
      window.dispatchEvent(new Event('resize'))
      frame()
      expect(host.surfaces.reports.at(-1)?.occluders).toEqual([menu])
    } finally {
      layers.remove()
    }
  })

  test('draws the frozen image and confirms it', async () => {
    layout.set('tab_a', panel)
    const { container } = renderSurface(<HostedSurface id="tab_a" />)
    frame()
    act(() =>
      host.surfaces.emit({
        type: 'frozen',
        id: 'tab_a',
        seq: 4,
        image: 'data:image/jpeg;base64,AA',
      }),
    )
    const image = container.querySelector('img')
    expect(image).toHaveAttribute('src', 'data:image/jpeg;base64,AA')
    // At the size of the view it replaces, not stretched over a surface that changes under a drag.
    expect(image).toHaveStyle({ width: '400px', height: '720px' })
    await settle()
    // Confirmed only once the image has been on screen for a frame: two frames after it decoded.
    frame()
    await settle()
    expect(host.surfaces.messages).not.toContainEqual({ kind: 'drawn', id: 'tab_a', seq: 4 })
    frame()
    await settle()
    expect(host.surfaces.messages).toContainEqual({ kind: 'drawn', id: 'tab_a', seq: 4 })
  })

  test('removes the image when thawed', () => {
    layout.set('tab_a', panel)
    const { container } = renderSurface(<HostedSurface id="tab_a" />)
    act(() =>
      host.surfaces.emit({
        type: 'frozen',
        id: 'tab_a',
        seq: 1,
        image: 'data:image/jpeg;base64,AA',
      }),
    )
    act(() => host.surfaces.emit({ type: 'thawed', id: 'tab_a' }))
    expect(container.querySelector('img')).toBeNull()
  })

  test('an image of another surface is not drawn here', () => {
    layout.set('tab_a', panel)
    const { container } = renderSurface(<HostedSurface id="tab_a" />)
    act(() =>
      host.surfaces.emit({
        type: 'frozen',
        id: 'tab_b',
        seq: 1,
        image: 'data:image/jpeg;base64,AA',
      }),
    )
    expect(container.querySelector('img')).toBeNull()
  })

  test('an unmounted surface reports null', () => {
    layout.set('tab_a', panel)
    const { unmount } = renderSurface(<HostedSurface id="tab_a" />)
    frame()
    unmount()
    frame()
    expect(host.surfaces.reports.at(-1)?.surfaces).toEqual([{ id: 'tab_a', rect: null }])
    // Said once; with no surface left there is nothing more to say.
    window.dispatchEvent(new Event('resize'))
    frame()
    expect(host.surfaces.reports).toHaveLength(2)
  })

  test('without a surface nothing is reported, not even a drag', () => {
    function Edge() {
      const reporter = useSurfaceReporter()
      return (
        <button type="button" onClick={() => reporter.setDragging(true)}>
          sleep
        </button>
      )
    }
    const { getByRole } = renderSurface(<Edge />)
    act(() => getByRole('button').click())
    frame()
    expect(host.surfaces.reports).toEqual([])
  })

  test('shows where the focus is and asks main to move it', () => {
    layout.set('tab_a', panel)
    const onFocusChange = vi.fn()
    function WithF6() {
      const reporter = useSurfaceReporter()
      return (
        <>
          <HostedSurface id="tab_a" onFocusChange={onFocusChange} />
          <button type="button" onClick={() => reporter.focus('tab_a')}>
            F6
          </button>
        </>
      )
    }
    const { container, getByRole } = renderSurface(<WithF6 />)
    act(() => getByRole('button').click())
    expect(host.surfaces.messages).toContainEqual({ kind: 'focus', id: 'tab_a' })
    act(() => host.surfaces.emit({ type: 'focus', id: 'tab_a', focused: true }))
    expect(container.querySelector('[data-nt-hosted-surface]')).toHaveAttribute('data-focused')
    expect(onFocusChange).toHaveBeenCalledWith(true)
  })

  test('a shortcut from the page arrives as a keydown in the app', () => {
    layout.set('tab_a', panel)
    renderSurface(<HostedSurface id="tab_a" />)
    const heard: KeyboardEvent[] = []
    const listener = (event: KeyboardEvent) => heard.push(event)
    window.addEventListener('keydown', listener)
    try {
      act(() =>
        host.surfaces.emit({
          type: 'shortcut',
          id: 'tab_a',
          key: { key: '∫', code: 'KeyB', meta: true, control: false, alt: true, shift: false },
        }),
      )
    } finally {
      window.removeEventListener('keydown', listener)
    }
    expect(heard).toHaveLength(1)
    expect(heard[0]).toMatchObject({ code: 'KeyB', metaKey: true, altKey: true, shiftKey: false })
  })
})
