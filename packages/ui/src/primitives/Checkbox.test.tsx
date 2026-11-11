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

test('indeterminate reads as mixed, and a press turns it on', async () => {
  const onCheckedChange = vi.fn()
  render(<Checkbox label="Alle rijen" checked="indeterminate" onCheckedChange={onCheckedChange} />)
  const control = screen.getByRole('checkbox', { name: 'Alle rijen' })
  expect(control).toHaveAttribute('aria-checked', 'mixed')
  await userEvent.click(control)
  expect(onCheckedChange).toHaveBeenCalledWith(true)
})

test('a pseudo-element widens the hit area to 24px without growing the 16px box', () => {
  // The box is 16px with a 1px edge, so its padding box, which an absolute child measures from,
  // is 14px: 5px out on every side makes 24 by 24. Neither size depends on the density.
  render(<Checkbox label="Netwerktoegang" checked={false} onCheckedChange={() => {}} />)
  const classes = screen.getByRole('checkbox', { name: 'Netwerktoegang' }).className.split(' ')
  expect(classes).toEqual(
    expect.arrayContaining([
      'relative',
      'size-4',
      'border',
      'before:absolute',
      'before:-inset-[5px]',
      "before:content-['']",
    ]),
  )
})

test('an invalid box keeps the same hit area', () => {
  render(
    <Checkbox label="Netwerktoegang" checked={false} aria-invalid onCheckedChange={() => {}} />,
  )
  const classes = screen.getByRole('checkbox', { name: 'Netwerktoegang' }).className.split(' ')
  expect(classes).toEqual(expect.arrayContaining(['relative', 'border', 'before:-inset-[5px]']))
})
