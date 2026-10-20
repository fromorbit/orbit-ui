import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { Spotlight } from './Spotlight'

/** A controlled spotlight with one field, opened by a button that should get the focus back. */
function Example({ onOpenChange = () => {} }: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Openen
      </button>
      <Spotlight
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          onOpenChange(next)
        }}
        label="Zoeken"
      >
        <input aria-label="Veld" />
      </Spotlight>
    </>
  )
}

test('is a modal dialog named by its label, with the focus in its first field', async () => {
  render(<Example />)
  await userEvent.click(screen.getByRole('button', { name: 'Openen' }))
  const dialog = screen.getByRole('dialog', { name: 'Zoeken' })
  expect(dialog).toHaveAttribute('data-nt-layer', 'modal')
  await waitFor(() => expect(screen.getByRole('textbox', { name: 'Veld' })).toHaveFocus())
})

test('Escape closes it and the focus goes back to where it came from', async () => {
  const onOpenChange = vi.fn()
  render(<Example onOpenChange={onOpenChange} />)
  const opener = screen.getByRole('button', { name: 'Openen' })
  await userEvent.click(opener)
  await userEvent.keyboard('{Escape}')
  expect(onOpenChange).toHaveBeenLastCalledWith(false)
  expect(screen.queryByRole('dialog')).toBeNull()
  await waitFor(() => expect(opener).toHaveFocus())
})

test('a click beside it closes it: nothing is half answered here', async () => {
  const onOpenChange = vi.fn()
  render(<Example onOpenChange={onOpenChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Openen' }))
  const overlay = document.querySelector('[data-nt-spotlight-overlay]')
  expect(overlay).not.toBeNull()
  fireEvent.pointerDown(overlay as Element)
  fireEvent.click(overlay as Element)
  await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false))
})

test('says it has closed only once the focus is back where it came from', async () => {
  const focusedWhenClosed: (Element | null)[] = []
  function Closing() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Openen
        </button>
        <Spotlight
          open={open}
          onOpenChange={setOpen}
          onClosed={() => focusedWhenClosed.push(document.activeElement)}
          label="Zoeken"
        >
          <input aria-label="Veld" />
        </Spotlight>
      </>
    )
  }
  render(<Closing />)
  const opener = screen.getByRole('button', { name: 'Openen' })
  await userEvent.click(opener)
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(focusedWhenClosed).toEqual([opener]))
})
