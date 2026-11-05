import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { Dialog } from '../overlays/Dialog'
import { Button } from '../primitives/Button'
import { LayerStage } from './layer-stage'

/** A staged dialog between two buttons of the page, as a story stands in the gallery. */
function Page() {
  return (
    <>
      <Button>Ervoor</Button>
      <LayerStage reopenLabel="Plan bekijken">
        {(open, setOpen) => (
          <Dialog
            open={open}
            onOpenChange={setOpen}
            title="Plan ter goedkeuring"
            closeLabel="Later"
            footer={<Button variant="primary">Voer uit</Button>}
          >
            <p>Stap 1</p>
          </Dialog>
        )}
      </LayerStage>
      <Button>Erna</Button>
    </>
  )
}

/** Lets the stage's first frame pass, in which it gives the focus back. */
async function nextFrame(): Promise<void> {
  await act(() => new Promise<void>((done) => requestAnimationFrame(() => done())))
}

test('the layer stands open but takes no focus on load', async () => {
  const before = (() => {
    const button = document.createElement('button')
    document.body.append(button)
    button.focus()
    return button
  })()
  render(<Page />)
  const dialog = await screen.findByRole('dialog', { name: 'Plan ter goedkeuring' })
  await nextFrame()
  expect(dialog.contains(document.activeElement)).toBe(false)
  expect(before).toHaveFocus()
  before.remove()
})

test('Tab past the last control of the layer leaves it, rather than looping back', async () => {
  render(<Page />)
  await screen.findByRole('dialog')
  await nextFrame()
  screen.getByRole('button', { name: 'Later' }).focus()
  await userEvent.tab()
  expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(false)
})

test('closing the layer hands the focus to the button that opens it again', async () => {
  render(<Page />)
  await screen.findByRole('dialog')
  await nextFrame()
  screen.getByRole('button', { name: 'Voer uit' }).focus()
  await userEvent.keyboard('{Escape}')
  const reopen = await screen.findByRole('button', { name: 'Plan bekijken' })
  await vi.waitFor(() => expect(reopen).toHaveFocus())
  await userEvent.click(reopen)
  expect(await screen.findByRole('dialog', { name: 'Plan ter goedkeuring' })).toBeInTheDocument()
})
