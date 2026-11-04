import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Button } from '../primitives/Button'
import { FindingCard } from './FindingCard'

test('a finding is an article named by its title, with its weight and place in words', () => {
  render(
    <FindingCard
      severity="blocking"
      severityLabel="Blokkerend"
      title="Betalen met iDEAL loopt vast"
      location="/kassa"
    >
      De server antwoordt met 500.
    </FindingCard>,
  )
  const card = screen.getByRole('article', { name: 'Betalen met iDEAL loopt vast' })
  expect(card).toHaveAttribute('data-severity', 'blocking')
  expect(card).toHaveTextContent('Blokkerend')
  expect(card).toHaveTextContent('/kassa')
  expect(card).toHaveTextContent('De server antwoordt met 500.')
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
      actions={<Button variant="ghost">Negeer</Button>}
    />,
  )
  const card = screen.getByRole('article', { name: 'Klein totaal' })
  expect(within(card).getByRole('img', { name: 'Schermafbeelding' })).toBeInTheDocument()
  expect(within(card).getByRole('button', { name: 'Negeer' })).toBeInTheDocument()
})

test('without a place there is no separator', () => {
  render(<FindingCard severity="note" severityLabel="Opmerking" title="Spelling" />)
  expect(screen.getByRole('article', { name: 'Spelling' })).not.toHaveTextContent('·')
})
