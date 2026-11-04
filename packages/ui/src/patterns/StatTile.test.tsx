import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { TrendBadge } from '../primitives/TrendBadge'
import { StatTile } from './StatTile'

test('a group named by its label, with the figure, the trend and the comparison', () => {
  render(
    <StatTile
      label="Actieve spaces"
      value="1.284"
      trend={<TrendBadge value="12%" direction="up" tone="good" description="12% gestegen" />}
      comparison="t.o.v. vorige week"
    />,
  )
  const tile = screen.getByRole('group', { name: 'Actieve spaces' })
  expect(tile).toHaveTextContent('1.284')
  expect(tile).toHaveTextContent('12% gestegen')
  expect(tile).toHaveTextContent('t.o.v. vorige week')
})

test('without a trend or comparison there is no empty line', () => {
  const { container } = render(<StatTile label="Builds" value="42" />)
  expect(container.querySelectorAll('p')).toHaveLength(2)
})

test('the figure is 26px, the one size off the scale, on a 32px line', () => {
  render(<StatTile label="Builds" value="159" />)
  const figure = screen.getByText('159')
  expect(figure).toHaveClass('text-[26px]', 'leading-8', 'font-heading', 'tabular-nums')
})
