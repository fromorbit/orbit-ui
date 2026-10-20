import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { TooltipProvider } from '../overlays/Tooltip'
import { uiWrapper } from '../testing/ui-wrapper'
import { SelectionBar } from './SelectionBar'

function draw(disabled: { comment?: string | null; send?: string | null } = {}) {
  const onComment = vi.fn()
  const onSendAlong = vi.fn()
  render(
    <TooltipProvider>
      <SelectionBar
        label="Selectie"
        commentLabel="Opmerking"
        sendLabel="Meesturen"
        commentShortcut="demo.comment"
        sendShortcut="demo.send"
        at={{ top: 12, left: 40 }}
        commentDisabled={disabled.comment ?? null}
        sendDisabled={disabled.send ?? null}
        onComment={onComment}
        onSendAlong={onSendAlong}
      />
    </TooltipProvider>,
    { wrapper: uiWrapper() },
  )
  const bar = screen.getByRole('group', { name: 'Selectie' })
  return { onComment, onSendAlong, bar }
}

test('offers Opmerking and Meesturen with their keys, and no Naar chat', async () => {
  const { onComment, onSendAlong, bar } = draw()
  const buttons = within(bar).getAllByRole('button')
  expect(buttons.map((button) => button.querySelector('[data-nt-kbd]') !== null)).toEqual([
    true,
    true,
  ])
  expect(buttons[0]).toHaveTextContent(/^Opmerking/)
  expect(buttons[1]).toHaveTextContent(/^Meesturen/)
  expect(within(bar).queryByText(/Naar chat/)).toBeNull()
  await userEvent.click(buttons[0] as HTMLElement)
  expect(onComment).toHaveBeenCalledOnce()
  await userEvent.click(buttons[1] as HTMLElement)
  expect(onSendAlong).toHaveBeenCalledOnce()
  expect(bar).toHaveStyle({ top: '12px', left: '40px' })
})

test('keeps the selection when pressed', () => {
  const { bar } = draw()
  // A press that took the focus or collapsed the selection would take away what it acts on.
  expect(fireEvent.mouseDown(bar)).toBe(false)
})

test('a button that cannot act stays, off, with its reason, and does nothing', async () => {
  const { onSendAlong, onComment, bar } = draw({ send: 'Hoogstens vijf bijlagen per bericht' })
  const [comment, send] = within(bar).getAllByRole('button')
  await userEvent.hover(send as HTMLElement)
  expect(await screen.findByRole('tooltip')).toHaveTextContent(
    'Hoogstens vijf bijlagen per bericht',
  )
  expect(send).toHaveAttribute('aria-disabled', 'true')
  await userEvent.click(send as HTMLElement)
  expect(onSendAlong).not.toHaveBeenCalled()
  // The other one still acts.
  await userEvent.click(comment as HTMLElement)
  expect(onComment).toHaveBeenCalledOnce()
})

test('names no command of its own: without the shortcut props it draws no keys', () => {
  render(
    <TooltipProvider>
      <SelectionBar
        label="Selectie"
        commentLabel="Opmerking"
        sendLabel="Meesturen"
        at={{ top: 0, left: 0 }}
        onComment={() => {}}
        onSendAlong={() => {}}
      />
    </TooltipProvider>,
    { wrapper: uiWrapper() },
  )
  const bar = screen.getByRole('group', { name: 'Selectie' })
  expect(bar.querySelector('[data-nt-kbd]')).toBeNull()
  expect(within(bar).getAllByRole('button')).toHaveLength(2)
})
