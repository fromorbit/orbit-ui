import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { nl } from '../testing/labels'
import { SeverityBar } from './SeverityBar'

test('the weights read heavy to light, each with its count in words', () => {
  render(
    <SeverityBar
      label="Bevindingen per gewicht"
      counts={{ note: 4, blocking: 1, problem: 3 }}
      labels={nl.severity}
    />,
  )
  const legend = screen.getByRole('list', { name: 'Bevindingen per gewicht' })
  expect(
    within(legend)
      .getAllByRole('listitem')
      .map((item) => item.textContent),
  ).toEqual(['1 blokkerend', '3 problemen', '4 opmerkingen'])
})

test('a weight of zero or left out is not drawn', () => {
  const { container } = render(
    <SeverityBar label="Bevindingen" counts={{ problem: 2, note: 0 }} labels={nl.severity} />,
  )
  const shares = [...container.querySelectorAll<HTMLElement>('[data-nt-share]')]
  expect(shares.map((share) => share.dataset.ntShare)).toEqual(['problem'])
})

test('nothing found is one calm line, without a bar', () => {
  const { container } = render(<SeverityBar label="Bevindingen" counts={{}} labels={nl.severity} />)
  expect(screen.getByText('Geen bevindingen')).toBeInTheDocument()
  expect(screen.queryByRole('list')).toBeNull()
  expect(container.querySelector('[data-nt-share-bar]')).toBeNull()
})
