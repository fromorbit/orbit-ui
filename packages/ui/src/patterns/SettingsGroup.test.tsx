import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Button } from '../primitives/Button'
import { SectionHeading } from '../primitives/SectionHeading'
import { SettingsGroup } from './SettingsGroup'

test('a group is named by its title', () => {
  render(
    <SettingsGroup title="Nieuwe chats">
      <p>rij</p>
    </SettingsGroup>,
  )
  const group = screen.getByRole('group', { name: 'Nieuwe chats' })
  expect(within(group).getByText('rij')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Nieuwe chats' })).toBeInTheDocument()
})

test('the rows stand in one card, with a line between them', () => {
  const { container } = render(
    <SettingsGroup title="Nieuwe chats">
      <p>een</p>
      <p>twee</p>
    </SettingsGroup>,
  )
  const card = container.querySelector('[data-nt-settings-card]')
  expect(card?.children).toHaveLength(2)
  // The line goes between two rows that draw something, so a row that draws nothing (a `custom`
  // control with nothing to show) leaves no stray line behind.
  expect(card?.className).toContain('[&>:not(:empty)~:not(:empty)]:border-t')
  expect(card?.className).not.toContain('divide-y')
  expect(card?.className).toContain('rounded-lg')
})

test('a card whose rows all draw nothing is not drawn, nor is its heading', () => {
  // `:has()` is layout's business, so Orbit's end-to-end tests measure it; here the rule
  // that carries it is pinned to the card and the group.
  const Nothing = () => null
  const { container } = render(
    <SettingsGroup title="Backend">
      <div>
        <Nothing />
      </div>
    </SettingsGroup>,
  )
  const group = container.querySelector('[data-nt-settings-group]')
  expect(group?.className).toContain('[&:not(:has(>[data-nt-settings-card]>:not(:empty)))]:hidden')
  expect(container.querySelector('[data-nt-settings-card]')?.className).toContain(
    '[&:not(:has(>:not(:empty)))]:hidden',
  )
})

test('with an action the heading stays when the rows draw nothing', () => {
  const { container } = render(
    <SettingsGroup title="Extensies" action={<Button size="sm">Toevoegen…</Button>}>
      <div />
    </SettingsGroup>,
  )
  const group = container.querySelector('[data-nt-settings-group]')
  expect(group?.className).not.toContain(':hidden')
})

test('an action stands in the heading, beside the title', () => {
  render(
    <SettingsGroup title="Extensies" action={<Button size="sm">Toevoegen…</Button>}>
      <p>rij</p>
    </SettingsGroup>,
  )
  const heading = screen.getByRole('heading', { name: 'Extensies' })
  const action = screen.getByRole('button', { name: 'Toevoegen…' })
  expect(heading.parentElement?.contains(action)).toBe(true)
})

test('without a title the group has no heading and no name', () => {
  render(
    <SettingsGroup>
      <p>rij</p>
    </SettingsGroup>,
  )
  expect(screen.queryByRole('heading')).toBeNull()
  expect(screen.getByText('rij')).toBeInTheDocument()
})

test('a group without rows draws no empty card', () => {
  const { container } = render(
    <SettingsGroup title="Extensies" action={<Button size="sm">Toevoegen…</Button>}>
      {null}
    </SettingsGroup>,
  )
  expect(container.querySelector('[data-nt-settings-card]')).toBeNull()
  expect(screen.getByRole('button', { name: 'Toevoegen…' })).toBeInTheDocument()
})

test('the heading is the SectionHeading of every other list, at level 2', () => {
  // One heading for a group of rows across the app, not a copy of its classes here.
  render(
    <>
      <SettingsGroup title="Wachtrij">
        <p>rij</p>
      </SettingsGroup>
      <SectionHeading level={2}>Referentie</SectionHeading>
    </>,
  )
  const heading = screen.getByRole('heading', { level: 2, name: 'Wachtrij' })
  const reference = screen.getByRole('heading', { level: 2, name: 'Referentie' })
  expect(heading.className).toBe(reference.className)
})
