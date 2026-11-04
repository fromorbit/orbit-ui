import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { nl } from '../testing/labels'
import { SeverityBar } from './SeverityBar'

test('the weights read heavy to light, each with its count in words', () => {
  render(
    <SeverityBar
      label="Bevindingen naar ernst"
      counts={{ note: 4, blocking: 1, problem: 3 }}
      labels={nl.severity}
    />,
  )
  const legend = screen.getByRole('list', { name: 'Bevindingen naar ernst' })
  expect(
    within(legend)
      .getAllByRole('listitem')
      .map((item) => item.textContent),
  ).toEqual(['1 blokkade', '3 problemen', '4 opmerkingen'])
})

test('large counts take Dutch figures', () => {
  render(
    <SeverityBar
      label="Bevindingen"
      counts={{ blocking: 128, problem: 1204, note: 37 }}
      labels={nl.severity}
    />,
  )
  expect(
    within(screen.getByRole('list'))
      .getAllByRole('listitem')
      .map((item) => item.textContent),
  ).toEqual(['128 blokkades', '1.204 problemen', '37 opmerkingen'])
})

test('the bar weighs a blocker four times and a problem twice, so it is never the thinnest', () => {
  const { container } = render(
    <SeverityBar
      label="Bevindingen"
      counts={{ blocking: 1, problem: 2, note: 1 }}
      labels={nl.severity}
    />,
  )
  const shares = [...container.querySelectorAll<HTMLElement>('[data-nt-share]')]
  expect(shares.map((share) => share.style.flexGrow)).toEqual(['4', '4', '1'])
})

test('a weight of zero or left out is not drawn', () => {
  const { container } = render(
    <SeverityBar label="Bevindingen" counts={{ problem: 2, note: 0 }} labels={nl.severity} />,
  )
  const shares = [...container.querySelectorAll<HTMLElement>('[data-nt-share]')]
  expect(shares.map((share) => share.dataset.ntShare)).toEqual(['problem'])
})

test('only remarks: the words without a bar, which would read as an empty meter', () => {
  const { container } = render(
    <SeverityBar label="Bevindingen" counts={{ note: 3 }} labels={nl.severity} />,
  )
  expect(screen.getByRole('list', { name: 'Bevindingen' })).toHaveTextContent('3 opmerkingen')
  expect(container.querySelector('[data-nt-share]')).toBeNull()
})

test('nothing found is one calm line in a status region, without a bar', () => {
  const { container } = render(<SeverityBar label="Bevindingen" counts={{}} labels={nl.severity} />)
  expect(screen.getByRole('status')).toHaveTextContent(
    'Geen bevindingen; niets houdt de merge tegen',
  )
  expect(screen.queryByRole('list')).toBeNull()
  expect(container.querySelector('[data-nt-share-bar]')).toBeNull()
})
