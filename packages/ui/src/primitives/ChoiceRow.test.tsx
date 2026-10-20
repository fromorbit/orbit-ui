import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { ChoiceRow } from './ChoiceRow'

test('is a radio or a checkbox with its checked state, named by its label and tag', () => {
  render(
    <div>
      <ChoiceRow
        kind="radio"
        label="Som per tarief"
        tag="Aanbevolen"
        checked
        tabbable
        onChoose={() => {}}
      />
      <ChoiceRow
        kind="checkbox"
        label="Koppen"
        checked={false}
        tabbable={false}
        onChoose={() => {}}
      />
    </div>,
  )
  const radio = screen.getByRole('radio', { name: 'Som per tarief Aanbevolen' })
  expect(radio).toHaveAttribute('aria-checked', 'true')
  expect(within(radio).getByText('Aanbevolen')).toHaveAttribute('data-nt-choice-tag')
  expect(screen.getByRole('checkbox', { name: 'Koppen' })).toHaveAttribute('aria-checked', 'false')
})

test('the description describes it, and the number stays out of its name', () => {
  render(
    <ChoiceRow
      kind="radio"
      number={2}
      label="/work/archief"
      description="Bij de oude stukken."
      checked={false}
      tabbable
      onChoose={() => {}}
    />,
  )
  const row = screen.getByRole('radio', { name: '/work/archief' })
  expect(row).toHaveAccessibleDescription('Bij de oude stukken.')
  expect(row).toHaveTextContent('2')
})

// The number already carries the key, so a radio row has no round mark beside it; a
// checkbox keeps its box, which is what says "any number of these".
test('a radio row has its number and no round mark; a checked one shows a check at its end', () => {
  render(
    <div>
      <ChoiceRow kind="radio" number={1} label="Een" checked tabbable onChoose={() => {}} />
      <ChoiceRow
        kind="checkbox"
        number={2}
        label="Twee"
        checked={false}
        tabbable={false}
        onChoose={() => {}}
      />
    </div>,
  )
  const radio = screen.getByRole('radio', { name: 'Een' })
  expect(radio.querySelector('.rounded-full')).toBeNull()
  expect(radio.querySelector('svg.lucide-check')).not.toBeNull()
  expect(screen.getByRole('checkbox', { name: 'Twee' }).querySelector('.rounded-sm')).not.toBeNull()
})

test('only the tab stop of its list is reachable with Tab', () => {
  render(
    <div>
      <ChoiceRow kind="radio" label="Een" checked={false} tabbable onChoose={() => {}} />
      <ChoiceRow kind="radio" label="Twee" checked={false} tabbable={false} onChoose={() => {}} />
    </div>,
  )
  expect(screen.getByRole('radio', { name: 'Een' })).toHaveAttribute('tabindex', '0')
  expect(screen.getByRole('radio', { name: 'Twee' })).toHaveAttribute('tabindex', '-1')
})

test('a click or Space chooses it, and focus or the pointer makes it active', async () => {
  const onChoose = vi.fn()
  const onActive = vi.fn()
  render(
    <ChoiceRow
      kind="checkbox"
      label="Koppen"
      checked={false}
      tabbable
      onChoose={onChoose}
      onActive={onActive}
    />,
  )
  const row = screen.getByRole('checkbox', { name: 'Koppen' })
  await userEvent.click(row)
  expect(onChoose).toHaveBeenCalledTimes(1)
  expect(onActive).toHaveBeenCalled()
  row.focus()
  await userEvent.keyboard(' ')
  expect(onChoose).toHaveBeenCalledTimes(2)
})
