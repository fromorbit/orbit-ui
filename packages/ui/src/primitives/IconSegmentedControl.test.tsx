import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { IconSegmentedControl } from './IconSegmentedControl'

// Existing registry icons, so this test does not lean on glyphs added later.
const options = [
  { value: 'stacked', icon: 'square', label: 'Gestapeld' },
  { value: 'split', icon: 'check', label: 'Naast elkaar' },
] as const

test('picks the option that was clicked', async () => {
  const onValueChange = vi.fn()
  render(
    <IconSegmentedControl
      label="Weergave van de diff"
      value="stacked"
      options={options}
      onValueChange={onValueChange}
    />,
  )
  await userEvent.click(screen.getByRole('radio', { name: 'Naast elkaar' }))
  expect(onValueChange).toHaveBeenCalledWith('split')
})

test('clicking the active option keeps it active', async () => {
  const onValueChange = vi.fn()
  render(
    <IconSegmentedControl
      label="Weergave van de diff"
      value="stacked"
      options={options}
      onValueChange={onValueChange}
    />,
  )
  await userEvent.click(screen.getByRole('radio', { name: 'Gestapeld' }))
  expect(onValueChange).not.toHaveBeenCalled()
  expect(screen.getByRole('radio', { name: 'Gestapeld' })).toHaveAttribute('aria-checked', 'true')
})

test('arrow keys walk the options', async () => {
  render(
    <IconSegmentedControl
      label="Weergave van de diff"
      value="stacked"
      options={options}
      onValueChange={vi.fn()}
    />,
  )
  screen.getByRole('radio', { name: 'Gestapeld' }).focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Naast elkaar' }))
})

test('names the group and each option of its own', () => {
  render(
    <IconSegmentedControl
      label="Weergave van de diff"
      value="stacked"
      options={options}
      onValueChange={vi.fn()}
    />,
  )
  expect(screen.getByRole('radiogroup', { name: 'Weergave van de diff' })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'Gestapeld' })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'Naast elkaar' })).toBeInTheDocument()
})
