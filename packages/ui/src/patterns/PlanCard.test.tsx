import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Button } from '../primitives/Button'
import { PlanCard } from './PlanCard'

test('a plan is an article named by the plan, with its price, period and features', () => {
  render(
    <PlanCard
      name="Team"
      price="€ 24"
      period="per lid per maand, excl. btw"
      features={[
        'Onbeperkt gesprekken',
        { label: '250 agent-uren per maand', detail: '182 gebruikt' },
      ]}
    />,
  )
  const card = screen.getByRole('article', { name: 'Team' })
  expect(card).toHaveTextContent('€ 24per lid per maand, excl. btw')
  const lines = within(card).getAllByRole('listitem')
  expect(lines.map((line) => line.textContent)).toEqual([
    'Onbeperkt gesprekken',
    '250 agent-uren per maand182 gebruikt',
  ])
  expect(card).not.toHaveAttribute('data-current')
})

test('the current plan carries its tag and the data attribute', () => {
  render(<PlanCard name="Team" price="€ 24" current currentLabel="Huidig plan" />)
  const card = screen.getByRole('article', { name: 'Team' })
  expect(card).toHaveAttribute('data-current')
  expect(within(card).getByText('Huidig plan')).toBeInTheDocument()
})

test('the name is a heading of the given level', () => {
  render(<PlanCard name="Bedrijf" price="€ 39" headingLevel={2} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Bedrijf' })).toBeInTheDocument()
})

test('summary and action stand in the foot; without either there is no foot', () => {
  const { rerender } = render(
    <PlanCard
      name="Team"
      price="€ 24"
      summary="6 leden"
      action={<Button variant="secondary">Plan wijzigen</Button>}
    />,
  )
  const card = screen.getByRole('article', { name: 'Team' })
  expect(within(card).getByRole('button', { name: 'Plan wijzigen' })).toBeInTheDocument()
  expect(card).toHaveTextContent('6 leden')
  rerender(<PlanCard name="Team" price="€ 24" />)
  const bare = screen.getByRole('article', { name: 'Team' })
  expect(within(bare).queryByRole('button')).toBeNull()
  expect(bare).toHaveTextContent(/^Team€ 24$/)
})
