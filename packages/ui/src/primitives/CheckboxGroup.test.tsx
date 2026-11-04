import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { CheckboxGroup } from './CheckboxGroup'

const OPTIONS = [
  { value: 'build', label: 'Een build faalt' },
  { value: 'deploy', label: 'Een deploy is klaar' },
  { value: 'invite', label: 'Iemand nodigt me uit', disabled: true },
]

test('the legend names the group', () => {
  render(<CheckboxGroup label="Meldingen" options={OPTIONS} value={[]} onValueChange={vi.fn()} />)
  const group = screen.getByRole('group', { name: 'Meldingen' })
  expect(group).toBeInTheDocument()
  expect(screen.getAllByRole('checkbox')).toHaveLength(3)
})

test('a new choice comes back in the order of the options', async () => {
  const onValueChange = vi.fn()
  render(
    <CheckboxGroup
      label="Meldingen"
      options={OPTIONS}
      value={['deploy']}
      onValueChange={onValueChange}
    />,
  )
  await userEvent.click(screen.getByRole('checkbox', { name: 'Een build faalt' }))
  expect(onValueChange).toHaveBeenCalledWith(['build', 'deploy'])
})

test('unchecking takes the value out', async () => {
  const onValueChange = vi.fn()
  render(
    <CheckboxGroup
      label="Meldingen"
      options={OPTIONS}
      value={['build', 'deploy']}
      onValueChange={onValueChange}
    />,
  )
  await userEvent.click(screen.getByRole('checkbox', { name: 'Een build faalt' }))
  expect(onValueChange).toHaveBeenCalledWith(['deploy'])
})

test('every box is its own tab stop, a disabled one is skipped', async () => {
  render(<CheckboxGroup label="Meldingen" options={OPTIONS} value={[]} onValueChange={vi.fn()} />)
  await userEvent.tab()
  expect(screen.getByRole('checkbox', { name: 'Een build faalt' })).toHaveFocus()
  await userEvent.tab()
  expect(screen.getByRole('checkbox', { name: 'Een deploy is klaar' })).toHaveFocus()
  await userEvent.tab()
  expect(document.body).toHaveFocus()
})

test('an error describes the group and is announced', () => {
  render(
    <CheckboxGroup
      label="Meldingen"
      error="Kies er minstens één."
      options={OPTIONS}
      value={[]}
      onValueChange={vi.fn()}
    />,
  )
  const group = screen.getByRole('group', { name: 'Meldingen' })
  expect(group).toHaveAccessibleDescription('Kies er minstens één.')
  expect(group).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByRole('alert')).toHaveTextContent('Kies er minstens één.')
})
