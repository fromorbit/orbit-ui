import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Spinner } from './Spinner'

test('the label it is given becomes the name', () => {
  render(<Spinner label="Chats laden" />)
  expect(screen.getByRole('status', { name: 'Chats laden' })).toBeInTheDocument()
})

test('without size the size is md, from the icon token', () => {
  const { container } = render(<Spinner label="Laden…" />)
  expect(container.querySelector('svg')?.getAttribute('class')).toContain('size-(--nt-icon-md)')
})

test('size="sm" uses the small icon token', () => {
  const { container } = render(<Spinner size="sm" label="Laden…" />)
  expect(container.querySelector('svg')?.getAttribute('class')).toContain('size-(--nt-icon-sm)')
})

test('carries the spin animation class', () => {
  const { container } = render(<Spinner label="Laden…" />)
  expect(container.querySelector('svg')?.getAttribute('class')).toContain('nt-spin')
})

test('draws the loader-circle of Lucide, like every other icon in the app', () => {
  // Lucide everywhere except the status shapes.
  const { container } = render(<Spinner label="Laden…" />)
  expect(container.querySelector('svg')?.getAttribute('class')).toContain('lucide-loader-circle')
  expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '1.75')
})

test('a decorative spinner is silent and has no name', () => {
  const { container } = render(<Spinner decorative />)
  expect(screen.queryByRole('status')).toBeNull()
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})
