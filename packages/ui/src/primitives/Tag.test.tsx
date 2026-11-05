import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Tag } from './Tag'

test('without a tone the tone is neutral: a tint, no frame', () => {
  render(<Tag>Concept</Tag>)
  const className = screen.getByText('Concept').className
  expect(className).toContain('bg-surface')
  expect(className).not.toContain('border')
})

test('tone="success" is a soft green tint like the other tones, without a frame', () => {
  render(<Tag tone="success">Klaar</Tag>)
  const className = screen.getByText('Klaar').className
  expect(className).toContain('bg-success-subtle')
  expect(className).not.toContain('border')
})

test('tone="attention" uses the subtle background, without a frame', () => {
  render(<Tag tone="attention">Pending</Tag>)
  const className = screen.getByText('Pending').className
  expect(className).toContain('bg-attention-subtle')
  expect(className).not.toContain('border')
})

test('tone="danger" uses the subtle background, without a frame', () => {
  render(<Tag tone="danger">Failed</Tag>)
  const className = screen.getByText('Failed').className
  expect(className).toContain('bg-danger-subtle')
  expect(className).not.toContain('border')
})

test('mono sets the text in mono', () => {
  render(<Tag mono>abc123</Tag>)
  expect(screen.getByText('abc123').className).toContain('font-mono')
})

test('an icon stands decoratively before the text', () => {
  const { container } = render(<Tag icon="check">Ready</Tag>)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})
