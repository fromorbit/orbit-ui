import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { TrendBadge } from './TrendBadge'

test('a screen reader hears the description, not the bare figure', () => {
  render(<TrendBadge value="12%" direction="up" tone="good" description="12% gestegen" />)
  expect(screen.getByText('12% gestegen')).toHaveClass('sr-only')
  expect(screen.getByText('12%')).toHaveAttribute('aria-hidden', 'true')
})

test.each([
  ['good', 'text-success'],
  ['bad', 'text-danger'],
  ['neutral', 'text-secondary'],
] as const)('tone %s colours it %s, apart from the direction', (tone, colour) => {
  const { container } = render(
    <TrendBadge value="3" direction="down" tone={tone} description="3 minder" />,
  )
  expect(container.firstElementChild?.className).toContain(colour)
})
