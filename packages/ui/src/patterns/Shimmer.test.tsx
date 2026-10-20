import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Shimmer } from './Shimmer'

test('draws nothing extra while it is quiet', () => {
  const { container } = render(
    <Shimmer active={false}>
      <span role="status">Bezig</span>
    </Shimmer>,
  )
  expect(container.querySelectorAll('[role="status"]')).toHaveLength(1)
  expect(container.querySelector('.nt-wave')).toBeNull()
  expect(container.querySelector('[aria-hidden]')).toBeNull()
})

test('lays a second, hidden copy over its children while it runs', () => {
  const { container } = render(
    <Shimmer active={true}>
      <span role="status">Bezig</span>
    </Shimmer>,
  )
  expect(container.querySelectorAll('[role="status"]')).toHaveLength(2)
  const overlay = container.querySelector('.nt-wave')
  expect(overlay).not.toBeNull()
  expect(overlay).toHaveAttribute('aria-hidden', 'true')
})

test('the copy is never read out', () => {
  render(
    <Shimmer active={true}>
      <button type="button">Bezig</button>
    </Shimmer>,
  )
  // Two copies stand in the DOM (the test above proves it), but `aria-hidden` removes the
  // overlay's copy from the accessibility tree, so a role query finds the real one only, with the
  // accessible name of the children and nothing doubled onto it.
  expect(screen.getAllByRole('button')).toHaveLength(1)
  expect(screen.getByRole('button')).toHaveAccessibleName('Bezig')
})

test('the lit copy is the children themselves, with no layer in between', () => {
  const { container } = render(
    <Shimmer active={true}>
      <span role="status">Bezig</span>
    </Shimmer>,
  )
  const overlay = container.querySelector('.nt-wave')
  // Straight under the mask. A span of its own in between would have to slide back exactly as far
  // as the layer slides forward, over a width that is not the layer's — and letters that miss that
  // distance stand beside the real ones instead of over them, which is doubled text, not a band.
  expect(overlay?.children).toHaveLength(1)
  expect(overlay?.firstElementChild?.getAttribute('role')).toBe('status')
})

test('the children stay the same nodes when the band stops or starts', () => {
  // Inside a `role="log"` a node that is replaced counts as text added, and the log reads it out
  // again. A block the agent moves past stops its wave, and that may not repeat its sentence.
  const { container, rerender } = render(
    <Shimmer active={true}>
      <span data-label>Bezig</span>
    </Shimmer>,
  )
  // The real children come first; the lit copy follows them.
  const label = container.querySelector('[data-label]')
  expect(label?.closest('[aria-hidden]')).toBeNull()
  const text = label?.firstChild
  rerender(
    <Shimmer active={false}>
      <span data-label>Bezig</span>
    </Shimmer>,
  )
  expect(container.querySelector('[data-label]')).toBe(label)
  expect(label?.firstChild).toBe(text)
  rerender(
    <Shimmer active={true}>
      <span data-label>Bezig</span>
    </Shimmer>,
  )
  expect(container.querySelector('[data-label]')).toBe(label)
  expect(label?.firstChild).toBe(text)
})

test('the band sweeps its mask, and the copy under it never moves', () => {
  const css = indexCss()
  const layer = css.match(/\n\.nt-wave\s*\{([^}]*)\}/)?.[1]
  expect(layer).toBeDefined()
  // The copy covers the real line exactly: the same box, no offset and no width of its own. Only
  // then does every letter it lights up stand where the real one stands.
  expect(layer).toMatch(/inset:\s*0/)
  expect(layer).not.toMatch(/left:/)
  expect(layer).not.toMatch(/[\s;]width:/)
  // So what travels is the window and not the layer: the keyframes move the mask.
  const frames = css.match(/@keyframes nt-wave\s*\{([\s\S]*?)\n\}/)?.[1]
  expect(frames).toBeDefined()
  expect(frames).toMatch(/mask-position/)
  expect(frames).not.toMatch(/transform/)
  // And with the layer standing still there is nothing left to hold still under it.
  expect(css).not.toContain('nt-wave-hold')
})

/** `theme.css` as it stands, where the band's classes live; no DOM involved, so this runs fine under happy-dom. */
function indexCss(): string {
  return readFileSync(join(import.meta.dirname, '..', 'theme.css'), 'utf8')
}

/**
 * Reads the `prefers-reduced-motion` block straight out of `theme.css`: no DOM involved, so this
 * runs fine under happy-dom.
 */
function reducedMotionBlock(): string {
  const media = indexCss().match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/)
  if (!media?.[1]) throw new Error('no prefers-reduced-motion block in theme.css')
  return media[1]
}

test('the reduced-motion block turns the band off', () => {
  const block = reducedMotionBlock()
  expect(block).toMatch(/\.nt-wave\s*\{[^}]*animation:\s*none/)
  expect(block).toMatch(/\.nt-wave\s*\{[^}]*opacity:\s*0/)
  // The block keeps its existing shape: a rule added here has to stay a rule inside the block,
  // never a change to its boundaries. The turning circle of `StatusShape` stands still in it too.
  expect(block).toMatch(/\.nt-shape-spin/)
  expect(block).toMatch(/\.nt-spin/)
  expect(block).toMatch(/\.nt-shimmer/)
  expect(block).toMatch(/\.nt-fade-in/)
})
