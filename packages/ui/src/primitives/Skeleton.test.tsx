import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Skeleton } from './Skeleton'

test('is hidden from assistive technology: purely visual', () => {
  const { container } = render(<Skeleton />)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
})

test('without width the size is full', () => {
  const { container } = render(<Skeleton />)
  expect(container.firstElementChild?.className).toContain('w-full')
})

test.each([
  ['full', 'w-full'],
  ['lg', 'w-48'],
  ['md', 'w-32'],
  ['sm', 'w-16'],
] as const)('width="%s" gives %s', (width, expected) => {
  const { container } = render(<Skeleton width={width} />)
  expect(container.firstElementChild?.className).toContain(expected)
})

test('without shape the shape is a line', () => {
  const { container } = render(<Skeleton />)
  expect(container.firstElementChild?.className).toContain('rounded-sm')
})

test('shape="circle" is round', () => {
  const { container } = render(<Skeleton shape="circle" />)
  expect(container.firstElementChild?.className).toContain('rounded-full')
})

test('carries the shimmer animation class', () => {
  const { container } = render(<Skeleton />)
  expect(container.firstElementChild?.className).toContain('nt-shimmer')
})
