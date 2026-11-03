import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Tag } from './Tag'

test('without a tone the tone is neutral: a tint, no frame', () => {
  render(<Tag>Draft</Tag>)
  const className = screen.getByText('Draft').className
  expect(className).toContain('bg-surface-hover')
  expect(className).not.toContain('border')
})

test('tone="success" has only its words in a hairline: no plane, which would cost it AA in light', () => {
  render(<Tag tone="success">Ready</Tag>)
  const className = screen.getByText('Ready').className
  expect(className).toContain('text-success')
  expect(className).toContain('border-border')
  expect(className).not.toContain('bg-')
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
