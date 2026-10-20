import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { Checkbox } from './Checkbox'
import { Field } from './Field'

test('space toggles the box', async () => {
  const onCheckedChange = vi.fn()
  render(<Checkbox label="Netwerktoegang" checked={false} onCheckedChange={onCheckedChange} />)
  const control = screen.getByRole('checkbox', { name: 'Netwerktoegang' })
  control.focus()
  await userEvent.keyboard(' ')
  expect(onCheckedChange).toHaveBeenCalledWith(true)
})

test('a disabled box does not toggle', async () => {
  const onCheckedChange = vi.fn()
  render(
    <Checkbox label="Netwerktoegang" checked={false} disabled onCheckedChange={onCheckedChange} />,
  )
  const control = screen.getByRole('checkbox', { name: 'Netwerktoegang' })
  await userEvent.click(control)
  expect(onCheckedChange).not.toHaveBeenCalled()
})

test('Field names the box through its own label', () => {
  render(
    <Field label="Netwerktoegang">
      {({ labelId, describedById }) => (
        <Checkbox
          label="decoy"
          aria-labelledby={labelId}
          aria-describedby={describedById}
          checked={false}
          onCheckedChange={vi.fn()}
        />
      )}
    </Field>,
  )
  expect(screen.getByRole('checkbox', { name: 'Netwerktoegang' })).toBeInTheDocument()
  expect(screen.queryByRole('checkbox', { name: 'decoy' })).not.toBeInTheDocument()
})

test('checked sets the aria state', () => {
  render(<Checkbox label="Netwerktoegang" checked={true} onCheckedChange={vi.fn()} />)
  expect(screen.getByRole('checkbox', { name: 'Netwerktoegang' })).toBeChecked()
})
