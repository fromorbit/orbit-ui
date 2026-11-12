import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { OrbMark, type OrbMarkSize } from './OrbMark'

// Read from disk: happy-dom applies no stylesheet, so the colours are checked in the CSS itself.
const tokensCss = readFileSync(join(import.meta.dirname, '..', 'tokens.css'), 'utf8')

/** The mark is decorative by default, so it has no role to query: read it from the container. */
function markOf(container: HTMLElement): HTMLElement {
  const mark = container.querySelector<HTMLElement>('[data-nt-orb-mark]')
  if (!mark) throw new Error('no orb mark rendered')
  return mark
}

test('OrbMark has three sizes and no gradient', () => {
  const sizes: [OrbMarkSize, string, string][] = [
    ['sm', 'size-4', 'inset_-3px_-3px'],
    ['md', 'size-[22px]', 'inset_-4px_-4px'],
    ['lg', 'size-10', 'inset_-7px_-7px'],
  ]
  for (const [size, box, shade] of sizes) {
    const { container, unmount } = render(<OrbMark size={size} />)
    const mark = markOf(container)
    expect(mark).toHaveAttribute('data-size', size)
    expect(mark.className).toContain(box)
    // One flat fill and a deeper shade at the lower right, never a gradient.
    expect(mark.className).toContain('bg-orb')
    expect(mark.className).toContain(`shadow-[${shade}_0_var(--nt-orb-deep)]`)
    expect(mark.className).not.toMatch(/gradient|bg-linear|bg-radial|from-|to-/)
    // A mark that never moves has nothing to still for reduced motion.
    expect(mark.className).not.toMatch(/animate-|transition/)
    unmount()
  }
  // The colours themselves are flat in both themes.
  const orbDeclarations = [...tokensCss.matchAll(/--nt-orb(?:-deep)?:\s*([^;]+);/g)]
  expect(orbDeclarations.length).toBeGreaterThanOrEqual(4)
  for (const [, value] of orbDeclarations) expect(value).not.toMatch(/gradient/)
})

test('OrbMark is decorative unless it is given a name', () => {
  const { container } = render(<OrbMark />)
  expect(markOf(container)).toHaveAttribute('aria-hidden', 'true')
  expect(markOf(container)).toHaveAttribute('data-size', 'md')
  render(<OrbMark label="Orb" />)
  expect(screen.getByRole('img', { name: 'Orb' })).not.toHaveAttribute('aria-hidden')
})
