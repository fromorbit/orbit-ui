import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'
import { PortalContainerProvider } from './portal'

/** The shape every caller has: a controlled dialog with a confirm and a cancel action. */
function Example({
  onConfirm = () => {},
  tone,
}: {
  onConfirm?: () => void
  tone?: 'default' | 'danger'
}) {
  const [open, setOpen] = useState(true)
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="Chat verwijderen"
      body="Dit kan niet ongedaan worden gemaakt."
      confirmLabel="Verwijderen"
      cancelLabel="Annuleren"
      onConfirm={onConfirm}
      {...(tone ? { tone } : {})}
    />
  )
}

test('the cancel button has the focus when it opens', async () => {
  render(<Example />)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Annuleren' })).toHaveFocus())
})

test('Escape cancels and reports nothing', async () => {
  const onConfirm = vi.fn()
  render(<Example onConfirm={onConfirm} />)
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  expect(onConfirm).not.toHaveBeenCalled()
})

test('confirming reports once and closes', async () => {
  const onConfirm = vi.fn()
  render(<Example onConfirm={onConfirm} />)
  await userEvent.click(screen.getByRole('button', { name: 'Verwijderen' }))
  expect(onConfirm).toHaveBeenCalledOnce()
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
})

test('a click beside it does not dismiss a confirmation', () => {
  render(
    <>
      <Example />
      <button type="button">Ernaast</button>
    </>,
  )
  // A modal `AlertDialog` locks the body's `pointer-events`, so `userEvent` rightly refuses to
  // click a background button — that lock is already proof a reader cannot reach it. What this
  // test pins is Radix's own `onPointerDownOutside`/`onInteractOutside`, so it dispatches the raw
  // events `fireEvent` sends rather than going through that pointer-events guard.
  const outside = screen.getByRole('button', { name: 'Ernaast', hidden: true })
  fireEvent.pointerDown(outside)
  fireEvent.click(outside)
  expect(screen.getByRole('alertdialog')).toBeInTheDocument()
})

test('the title and the body are the accessible name and description', async () => {
  render(<Example />)
  const dialog = screen.getByRole('alertdialog')
  expect(dialog).toHaveAccessibleName('Chat verwijderen')
  expect(dialog).toHaveAccessibleDescription('Dit kan niet ongedaan worden gemaakt.')
})

test('the panel lands in the portal container, never in the body', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  try {
    render(
      <PortalContainerProvider container={host}>
        <Example />
      </PortalContainerProvider>,
    )
    const dialog = await screen.findByRole('alertdialog')
    expect(host.contains(dialog)).toBe(true)
  } finally {
    host.remove()
  }
})

test('the dangerous tone colours only the confirming action', () => {
  const { unmount } = render(<Example tone="danger" />)
  const danger = screen.getByRole('button', { name: 'Verwijderen' }).className
  expect(danger).toContain('text-danger')
  expect(screen.getByRole('button', { name: 'Annuleren' }).className).not.toContain('danger')
  unmount()
  // The default tone next to it, because the point is the difference: the gallery shows this tone
  // only when a reader opens it (a story holds one open layer), so the colours are pinned here.
  render(<Example />)
  expect(screen.getByRole('button', { name: 'Verwijderen' }).className).not.toContain('danger')
})

test('closed reports no dialog at all', () => {
  render(
    <ConfirmDialog
      open={false}
      onOpenChange={() => {}}
      title="Chat verwijderen"
      body="Dit kan niet ongedaan worden gemaakt."
      confirmLabel="Verwijderen"
      cancelLabel="Annuleren"
      onConfirm={() => {}}
    />,
  )
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
})

test('without a body it is one line: a title and no description', async () => {
  render(
    <ConfirmDialog
      open
      onOpenChange={() => {}}
      title="winkel.test openen buiten het lokale netwerk?"
      confirmLabel="Openen"
      cancelLabel="Annuleren"
      onConfirm={() => {}}
    />,
  )
  const dialog = await screen.findByRole('alertdialog', {
    name: 'winkel.test openen buiten het lokale netwerk?',
  })
  expect(dialog).not.toHaveAttribute('aria-describedby')
})

test('shows the confirmLabel it is given', () => {
  render(
    <ConfirmDialog
      open
      onOpenChange={() => {}}
      title="Spec weggooien"
      confirmLabel="Verwijder"
      cancelLabel="Laat staan"
      onConfirm={() => {}}
    />,
  )
  expect(screen.getByRole('button', { name: 'Verwijder' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Laat staan' })).toBeInTheDocument()
})

test('names no button of its own: without its labels it does not compile', () => {
  const dialog = (
    // @ts-expect-error confirmLabel and cancelLabel are required; the library has no words of its own
    <ConfirmDialog open onOpenChange={() => {}} title="Spec weggooien" onConfirm={() => {}} />
  )
  expect(dialog).toBeDefined()
})
