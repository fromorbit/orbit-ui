import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { RadioGroup } from './RadioGroup'

const options = [
  { id: 'klein', label: 'Klein' },
  { id: 'groot', label: 'Groot' },
] as const

test('arrow keys move the selection through the options', async () => {
  const onValueChange = vi.fn()
  render(
    <RadioGroup
      label="Tekstgrootte"
      value="klein"
      options={options}
      onValueChange={onValueChange}
    />,
  )
  screen.getByRole('radio', { name: 'Klein' }).focus()
  // Radix moves focus asynchronously (a `setTimeout`, so the group's own key handling never fights
  // a synchronous roving-focus move) and only checks the selection once it lands, from a per-item
  // flag that a `keyup` clears again. `userEvent.keyboard('{ArrowDown}')` fires that `keyup` right
  // after the `keydown`, before the pending timeout has run, so the flag is already gone by the
  // time focus arrives — holding the key down for a tick is what a real press does too.
  await userEvent.keyboard('{ArrowDown>}')
  await new Promise((resolve) => setTimeout(resolve, 20))
  await userEvent.keyboard('{/ArrowDown}')
  expect(onValueChange).toHaveBeenCalledWith('groot')
})

test('a description belongs to its own option for a screen reader', () => {
  render(
    <RadioGroup
      label="Toegang"
      value="lezen"
      options={[
        { id: 'lezen', label: 'Lezen', description: 'Alleen bestanden inzien.' },
        { id: 'schrijven', label: 'Schrijven' },
      ]}
      onValueChange={vi.fn()}
    />,
  )
  expect(screen.getByRole('radio', { name: 'Lezen' })).toHaveAccessibleDescription(
    'Alleen bestanden inzien.',
  )
  expect(screen.getByRole('radio', { name: 'Schrijven' })).not.toHaveAttribute('aria-describedby')
})

test('a disabled group takes no selection', async () => {
  const onValueChange = vi.fn()
  render(
    <RadioGroup
      label="Tekstgrootte"
      value="klein"
      options={options}
      disabled
      onValueChange={onValueChange}
    />,
  )
  await userEvent.click(screen.getByRole('radio', { name: 'Groot' }))
  expect(onValueChange).not.toHaveBeenCalled()
})

test('the focus ring is the one of the app', () => {
  render(
    <RadioGroup label="Tekstgrootte" value="klein" options={options} onValueChange={vi.fn()} />,
  )
  const className = screen.getByRole('radio', { name: 'Klein' }).className
  expect(className).toContain('outline-focus')
  expect(className).toContain('focus-visible:outline-2')
})

test('the checked option is the one the value names, as a radio in the group', () => {
  render(
    <RadioGroup label="Tekstgrootte" value="klein" options={options} onValueChange={vi.fn()} />,
  )
  const group = screen.getByRole('radiogroup', { name: 'Tekstgrootte' })
  expect(within(group).getByRole('radio', { name: 'Klein' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  expect(within(group).getByRole('radio', { name: 'Groot' })).toHaveAttribute(
    'aria-checked',
    'false',
  )
})
