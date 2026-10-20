import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { Toggle } from './Toggle'

test('reports the press to its caller', async () => {
  const onPressedChange = vi.fn()
  render(
    <Toggle
      icon="check"
      label="Regels afbreken"
      pressed={false}
      onPressedChange={onPressedChange}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Regels afbreken' }))
  expect(onPressedChange).toHaveBeenCalledWith(true)
})

test('says out loud whether it is on', () => {
  render(<Toggle icon="check" label="Regels afbreken" pressed onPressedChange={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Regels afbreken', pressed: true })).toHaveAttribute(
    'data-state',
    'on',
  )
})

test('its name does not change when it is pressed', () => {
  // A name that changes under the focus is announced twice:
  // the pressed state is carried by `data-state`, never by the accessible name itself.
  const { rerender } = render(
    <Toggle icon="check" label="Regels afbreken" pressed={false} onPressedChange={vi.fn()} />,
  )
  expect(screen.getByRole('button', { name: 'Regels afbreken' })).toBeInTheDocument()
  rerender(<Toggle icon="check" label="Regels afbreken" pressed onPressedChange={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Regels afbreken' })).toBeInTheDocument()
})

test('without size the size is md', () => {
  render(<Toggle icon="check" label="Regels afbreken" pressed={false} onPressedChange={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Regels afbreken' }).className).toContain(
    'h-(--nt-control-md)',
  )
})

test.each([
  ['sm', 'h-(--nt-control-sm)'],
  ['md', 'h-(--nt-control-md)'],
  ['lg', 'h-(--nt-control-lg)'],
] as const)('size="%s" gives %s', (size, expected) => {
  render(
    <Toggle
      icon="check"
      label="Regels afbreken"
      pressed={false}
      size={size}
      onPressedChange={vi.fn()}
    />,
  )
  expect(screen.getByRole('button', { name: 'Regels afbreken' }).className).toContain(expected)
})

test('disabled cannot be pressed', async () => {
  const onPressedChange = vi.fn()
  render(
    <Toggle
      icon="check"
      label="Regels afbreken"
      pressed={false}
      disabled
      onPressedChange={onPressedChange}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Regels afbreken' }))
  expect(onPressedChange).not.toHaveBeenCalled()
})
