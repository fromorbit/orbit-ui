import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Button } from '../primitives/Button'
import { PlanCard, PlanCards } from './PlanCard'

test('a plan is an article named by the plan, with its price, period and features', () => {
  render(
    <PlanCard
      name="Team"
      price="€ 24"
      period="per lid per maand, excl. btw"
      features={[
        'Onbeperkt gesprekken',
        { label: '250 agent-uren per maand', detail: '182 u gebruikt' },
      ]}
    />,
  )
  const card = screen.getByRole('article', { name: 'Team' })
  expect(card).toHaveTextContent('€ 24per lid per maand, excl. btw')
  const lines = within(card).getAllByRole('listitem')
  // The figure is read after a comma, not run into the label.
  expect(lines.map((line) => line.textContent)).toEqual([
    'Onbeperkt gesprekken',
    '250 agent-uren per maand, 182 u gebruikt',
  ])
  expect(card).not.toHaveAttribute('data-current')
})

test('the current plan says so in its heading, and carries the data attribute', () => {
  render(<PlanCard name="Team" price="€ 24" current currentLabel="Huidig plan" />)
  const card = screen.getByRole('article', { name: /^Team\W+Huidig plan$/ })
  expect(card).toHaveAttribute('data-current')
  expect(screen.getByRole('heading', { name: /^Team\W+Huidig plan$/ })).toBeInTheDocument()
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

test('the action is described by its plan, so two actions in a row are told apart', () => {
  render(
    <PlanCards label="Plannen">
      <PlanCard name="Solo" price="€ 0" action={<Button variant="secondary">Overstappen</Button>} />
      <PlanCard
        name="Bedrijf"
        price="€ 39"
        action={<Button variant="secondary">Overstappen</Button>}
      />
    </PlanCards>,
  )
  const list = screen.getByRole('list', { name: 'Plannen' })
  expect(within(list).getAllByRole('listitem')).toHaveLength(2)
  const [solo, bedrijf] = screen.getAllByRole('button', { name: 'Overstappen' })
  expect(solo).toHaveAccessibleDescription('Solo')
  expect(bedrijf).toHaveAccessibleDescription('Bedrijf')
})

test('an action that brings its own description keeps it', () => {
  render(
    <>
      <span id="eigen">Eigen uitleg</span>
      <PlanCard
        name="Team"
        price="€ 24"
        action={
          <Button variant="secondary" aria-describedby="eigen">
            Plan wijzigen
          </Button>
        }
      />
    </>,
  )
  expect(screen.getByRole('button', { name: 'Plan wijzigen' })).toHaveAccessibleDescription(
    'Eigen uitleg',
  )
})

test('the current plan is tinted a step stronger on either plane', () => {
  render(
    <>
      <PlanCard name="Team" price="€ 24" current currentLabel="Huidig plan" plane="surface" />
      <PlanCard name="Bedrijf" price="€ 39" plane="surface" />
    </>,
  )
  expect(screen.getByRole('article', { name: /^Team\W+Huidig plan$/ }).className).toContain(
    'bg-surface-active',
  )
  expect(screen.getByRole('article', { name: 'Bedrijf' }).className).toMatch(/\bbg-surface\b/)
})
