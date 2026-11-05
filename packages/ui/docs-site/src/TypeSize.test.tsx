import { cleanup, render } from '@testing-library/react'
import { type ComponentType, createElement } from 'react'
import { afterEach, expect, test } from 'vitest'
import { UiProvider } from '../../src'
import { stories, storyId } from '../../src/gallery'
import { DEMOS } from './demo-kit/registry'

/**
 * Every piece of text a story or demo draws takes its size from the scale, not from the browser.
 *
 * `tests/rhythm.test.ts` reads the classes in the source, so it cannot see text that sets no size
 * at all: such text inherits the browser's 16px, a step outside the five of `family-style.md`. The
 * library sets no font size in CSS, so the size a text gets is the nearest size class on it or on
 * an ancestor; this walks up from every text node as the browser's inheritance does, which is the
 * size `getComputedStyle` reports in the published gallery.
 */
const SIZED = /(?:^|\s)(?:text-\[\d+(?:\.\d+)?px\]|text-(?:xs|sm|base|lg|xl|2xl)|nt-doc)(?:\s|$)/

/** Text no one sees at a size: hidden, inside an icon, or only for a screen reader. */
const UNSEEN = 'svg,style,script,[hidden],.sr-only'

/** The start of each text under `root` that inherits its size from outside the library. */
function unsized(root: Element): string[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const found: string[] = []
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? ''
    const parent = node.parentElement
    if (text === '' || parent === null || parent.closest(UNSEEN) !== null) continue
    let element: Element | null = parent
    while (element !== null && element !== root) {
      const sized =
        SIZED.test(element.getAttribute('class') ?? '') ||
        (element instanceof HTMLElement && element.style.fontSize !== '')
      if (sized) break
      element = element.parentElement
    }
    if (element === null || element === root) found.push(text.slice(0, 40))
  }
  return found
}

/** Draws `component` alone and lists its unsized text, portals (open layers) included. */
function offendersOf(name: string, component: ComponentType, props = {}): string[] {
  render(createElement(UiProvider, null, createElement(component, props)))
  const found = unsized(document.body).map((text) => `${name}: ${text}`)
  cleanup()
  return found
}

afterEach(cleanup)

test('no story text falls back to the browser font size', () => {
  const offenders = stories.flatMap((story) =>
    Object.entries(story.states).flatMap(([caption, state]) =>
      offendersOf(`${storyId(story)} / ${caption}`, state),
    ),
  )
  expect(offenders).toEqual([])
})

test('no demo text falls back to the browser font size', () => {
  const offenders = DEMOS.flatMap((demo) =>
    (demo.variants ?? [{ value: undefined, label: '' }]).flatMap((variant) =>
      offendersOf(`${demo.slug} / ${variant.label}`, demo.Screen, { variant: variant.value }),
    ),
  )
  expect(offenders).toEqual([])
})
