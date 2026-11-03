import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { Button } from '../primitives/Button'
import { Sheet } from './Sheet'

function Example({
  onOpenChange = vi.fn(),
  side,
}: {
  onOpenChange?(open: boolean): void
  side?: 'start' | 'end'
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Details</Button>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          onOpenChange(next)
        }}
        title="api-gateway"
        description="feat/rate-limit, sinds 2 uur"
        closeLabel="Sluiten"
        {...(side ? { side } : {})}
        footer={<Button>Opnieuw starten</Button>}
      >
        <p>Logboek</p>
      </Sheet>
    </>
  )
}

test('a dialog named and described by its header, focus inside', async () => {
  render(<Example />)
  await userEvent.click(screen.getByRole('button', { name: 'Details' }))
  const sheet = screen.getByRole('dialog', { name: 'api-gateway' })
  expect(sheet).toHaveAccessibleDescription('feat/rate-limit, sinds 2 uur')
  expect(sheet.contains(document.activeElement)).toBe(true)
  expect(sheet).toHaveAttribute('data-side', 'end')
})

test('Escape closes it and hands the focus back', async () => {
  const onOpenChange = vi.fn()
  render(<Example onOpenChange={onOpenChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Details' }))
  await userEvent.keyboard('{Escape}')
  expect(onOpenChange).toHaveBeenLastCalledWith(false)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Details' })).toHaveFocus()
})

test('the close button closes it', async () => {
  render(<Example />)
  await userEvent.click(screen.getByRole('button', { name: 'Details' }))
  await userEvent.click(screen.getByRole('button', { name: 'Sluiten' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('a click beside it closes it, unlike a Dialog', async () => {
  const onOpenChange = vi.fn()
  render(<Example onOpenChange={onOpenChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Details' }))
  const overlay = document.querySelector('[data-nt-sheet-overlay]') as Element
  fireEvent.pointerDown(overlay)
  fireEvent.click(overlay)
  await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false))
})

test('Tab stays inside while it is open', async () => {
  render(<Example />)
  await userEvent.click(screen.getByRole('button', { name: 'Details' }))
  const sheet = screen.getByRole('dialog')
  for (let i = 0; i < 4; i++) {
    await userEvent.tab()
    expect(sheet.contains(document.activeElement)).toBe(true)
  }
})

test('side start stands against the left edge', async () => {
  render(<Example side="start" />)
  await userEvent.click(screen.getByRole('button', { name: 'Details' }))
  expect(screen.getByRole('dialog').className).toContain('left-0')
})
