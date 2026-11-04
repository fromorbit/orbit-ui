import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ShareBar } from './ShareBar'

const SEGMENTS = [
  { id: 'blocking', label: '2 blokkerend', value: 2, tone: 'danger', icon: 'octagon-alert' },
  { id: 'problem', label: '5 problemen', value: 5, tone: 'attention' },
  { id: 'note', label: '0 opmerkingen', value: 0, tone: 'neutral' },
] as const

test('the legend is the list a screen reader reads; the bar is hidden', () => {
  const { container } = render(<ShareBar label="Bevindingen" segments={SEGMENTS} />)
  const legend = screen.getByRole('list', { name: 'Bevindingen' })
  expect(
    within(legend)
      .getAllByRole('listitem')
      .map((item) => item.textContent),
  ).toEqual(['2 blokkerend', '5 problemen'])
  expect(container.querySelector('[aria-hidden="true"].flex.h-1\\.5')).not.toBeNull()
})

test('each share grows by its value; zero is left out', () => {
  const { container } = render(<ShareBar label="Bevindingen" segments={SEGMENTS} />)
  const shares = [...container.querySelectorAll<HTMLElement>('[data-nt-share]')]
  expect(shares.map((share) => share.dataset.ntShare)).toEqual(['blocking', 'problem'])
  expect(shares.map((share) => share.style.flexGrow)).toEqual(['2', '5'])
})

test('hideLegend leaves only the bar', () => {
  render(<ShareBar label="Bevindingen" segments={SEGMENTS} hideLegend />)
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
})
