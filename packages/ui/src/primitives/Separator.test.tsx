import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Separator } from './Separator'

test('without orientation the role is separator, horizontal', () => {
  render(<Separator />)
  const separator = screen.getByRole('separator')
  expect(separator).toHaveAttribute('aria-orientation', 'horizontal')
  expect(separator.className).toContain('w-full')
})

test('orientation="vertical" stands upright', () => {
  render(<Separator orientation="vertical" />)
  const separator = screen.getByRole('separator')
  expect(separator).toHaveAttribute('aria-orientation', 'vertical')
  expect(separator.className).toContain('h-full')
})
