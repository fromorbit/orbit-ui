import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { OrbitWordmark } from './OrbitWordmark'

// Read from disk: the token's value is the brand colour, whatever the DOM makes of the CSS.
const tokensCss = readFileSync(join(import.meta.dirname, '..', 'tokens.css'), 'utf8')

test('draws the line in the text colour and the dot in brand orange', () => {
  const { container } = render(<OrbitWordmark />)
  const svg = container.querySelector('svg')
  expect(svg).not.toBeNull()
  expect(svg?.querySelector('g')).toHaveAttribute('stroke', 'currentColor')
  const dot = svg?.querySelector('[data-nt-orbit-dot]')
  // A style rather than the fill attribute: a presentation attribute does not resolve var().
  expect(dot?.getAttribute('style')).toContain('var(--nt-brand-orbit)')
  expect(tokensCss).toMatch(/--nt-brand-orbit:\s*#FF7F2A;/i)
})

test('is hidden from assistive technology and carries no text', () => {
  const { container } = render(<OrbitWordmark />)
  const svg = container.querySelector('svg')
  expect(svg).toHaveAttribute('aria-hidden', 'true')
  expect(container.textContent).toBe('')
})

test('passes a class name through for its size', () => {
  const { container } = render(<OrbitWordmark className="h-4" />)
  expect(container.querySelector('svg')).toHaveClass('h-4')
})
