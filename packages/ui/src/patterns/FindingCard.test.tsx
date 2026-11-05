import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Button } from '../primitives/Button'
import { FindingCard } from './FindingCard'

test('a finding is an article named by its weight and title, described by its place', () => {
  render(
    <FindingCard
      severity="blocking"
      severityLabel="Blokkade"
      title="Betalen met iDEAL loopt vast"
      location="/kassa"
      locationLabel="pagina"
    >
      De server antwoordt met 500.
    </FindingCard>,
  )
  const card = screen.getByRole('article', { name: 'Blokkade: Betalen met iDEAL loopt vast' })
  expect(card).toHaveAttribute('data-severity', 'blocking')
  expect(card).toHaveAccessibleDescription('pagina /kassa')
  expect(card).toHaveTextContent('De server antwoordt met 500.')
})

test('a long place is cut in the middle on a wide card, keeps its file and line, carries the whole as its title', () => {
  const place = 'packages/server/src/authentication/providers/oidc.ts:123'
  render(<FindingCard severity="problem" severityLabel="Probleem" title="Token" location={place} />)
  const line = screen.getByTitle(place)
  expect(within(line).getByText('oidc.ts:123')).toBeInTheDocument()
  expect(within(line).getByText('packages/server/src/authentication/providers/')).toHaveClass(
    '@lg:truncate',
  )
})

test('the title is a heading of the given level', () => {
  render(
    <FindingCard severity="note" severityLabel="Opmerking" title="Spelling" headingLevel={4} />,
  )
  expect(screen.getByRole('heading', { level: 4, name: 'Spelling' })).toBeInTheDocument()
})

test('media and actions go inside the card', () => {
  render(
    <FindingCard
      severity="problem"
      severityLabel="Probleem"
      title="Klein totaal"
      media={<div role="img" aria-label="Schermafbeelding" />}
      actions={<Button variant="ghost">Negeren</Button>}
    />,
  )
  const card = screen.getByRole('article', { name: 'Probleem: Klein totaal' })
  expect(within(card).getByRole('img', { name: 'Schermafbeelding' })).toBeInTheDocument()
  expect(within(card).getByRole('button', { name: 'Negeren' })).toBeInTheDocument()
})

test('without a place there is no separator and no description', () => {
  render(<FindingCard severity="note" severityLabel="Opmerking" title="Spelling" />)
  const card = screen.getByRole('article', { name: 'Opmerking: Spelling' })
  expect(card).not.toHaveTextContent('·')
  expect(card).not.toHaveAttribute('aria-describedby')
})
