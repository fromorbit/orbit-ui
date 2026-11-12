import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { QuickAction, QuickActions } from './QuickActions'

test('a named group of buttons that do what they say', async () => {
  const open = vi.fn()
  render(
    <QuickActions label="Voorstellen van Orb">
      <QuickAction onClick={open}>Open run 1284</QuickAction>
      <QuickAction>Start een chat</QuickAction>
    </QuickActions>,
  )
  const group = screen.getByRole('group', { name: 'Voorstellen van Orb' })
  expect(within(group).getAllByRole('button')).toHaveLength(2)
  const button = within(group).getByRole('button', { name: 'Open run 1284' })
  expect(button).toHaveAttribute('type', 'button')
  await userEvent.click(button)
  expect(open).toHaveBeenCalledOnce()
})
