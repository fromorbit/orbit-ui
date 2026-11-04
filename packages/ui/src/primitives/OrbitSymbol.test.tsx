import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { OrbitSymbol } from './OrbitSymbol'
import { OrbitWordmark } from './OrbitWordmark'

test('draws the orbit in the text colour and the satellite in brand orange', () => {
  const { container } = render(<OrbitSymbol />)
  const svg = container.querySelector('svg')
  expect(svg?.querySelector('path')).toHaveAttribute('stroke', 'currentColor')
  expect(svg?.querySelector('[data-nt-orbit-dot]')?.getAttribute('style')).toContain(
    'var(--nt-brand-orbit)',
  )
})

test('is the "o" of the wordmark: the same arc and the same satellite', () => {
  const symbol = render(<OrbitSymbol />).container
  const wordmark = render(<OrbitWordmark />).container
  const arc = (root: Element) => root.querySelector('path')?.getAttribute('d')
  const dot = (root: Element) => {
    const circle = root.querySelector('[data-nt-orbit-dot]')
    return ['cx', 'cy', 'r'].map((name) => circle?.getAttribute(name))
  }
  expect(arc(symbol)).toBe(arc(wordmark))
  expect(dot(symbol)).toEqual(dot(wordmark))
})

test('is square, hidden from assistive technology and takes a class for its size', () => {
  const { container } = render(<OrbitSymbol className="size-4" />)
  const svg = container.querySelector('svg')
  const [, , width, height] = (svg?.getAttribute('viewBox') ?? '').split(' ')
  expect(width).toBe(height)
  expect(svg).toHaveAttribute('aria-hidden', 'true')
  expect(svg).toHaveClass('size-4')
  expect(container.textContent).toBe('')
})
