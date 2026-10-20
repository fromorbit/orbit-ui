import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { expect, test, vi } from 'vitest'
import { Dialog } from './Dialog'

/** The shape every caller has: a controlled dialog with a field and a footer. */
function Example({
  onOpenChange = () => {},
  startOpen = true,
  focusSecond = false,
}: {
  onOpenChange?: (open: boolean) => void
  startOpen?: boolean
  focusSecond?: boolean
}) {
  const [open, setOpen] = useState(startOpen)
  const second = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Openen
      </button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          onOpenChange(next)
        }}
        title="De agent vraagt iets"
        description="In welke map zal ik werken?"
        closeLabel="Later"
        {...(focusSecond ? { initialFocus: second } : {})}
        footer={
          <>
            <button type="button">Eerste</button>
            <button type="button" ref={second}>
              Tweede
            </button>
          </>
        }
      >
        <p>Inhoud</p>
        <button type="button">Binnen</button>
      </Dialog>
    </>
  )
}

test('names the dialog after its title', () => {
  render(<Example />)
  const dialog = screen.getByRole('dialog')
  expect(dialog).toHaveAccessibleName('De agent vraagt iets')
  expect(dialog).toHaveAccessibleDescription('In welke map zal ik werken?')
})

test('escape closes it and says so', async () => {
  const onOpenChange = vi.fn()
  render(<Example onOpenChange={onOpenChange} />)
  await userEvent.keyboard('{Escape}')
  expect(onOpenChange).toHaveBeenCalledWith(false)
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

test('the close button closes it and says so', async () => {
  const onOpenChange = vi.fn()
  render(<Example onOpenChange={onOpenChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Later' }))
  expect(onOpenChange).toHaveBeenCalledWith(false)
})

test('a click on the overlay does not close it', () => {
  const onOpenChange = vi.fn()
  render(<Example onOpenChange={onOpenChange} />)
  // A modal dialog locks the body's `pointer-events`, so the raw events are sent: what is pinned
  // here is that the dialog itself refuses to be dismissed from outside.
  const outside = screen.getByRole('button', { name: 'Openen', hidden: true })
  fireEvent.pointerDown(outside)
  fireEvent.click(outside)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(onOpenChange).not.toHaveBeenCalled()
})

test('focus goes to the first control of the content, or where the caller asks', async () => {
  const { unmount } = render(<Example />)
  // The content, not the close button in the header: the first thing to answer is what has focus.
  await waitFor(() => expect(screen.getByRole('button', { name: 'Binnen' })).toHaveFocus())
  unmount()
  render(<Example focusSecond />)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Tweede' })).toHaveFocus())
})

test('a popup that opens by itself holds the focus on its panel, and Tab goes to the content', async () => {
  // Opened by a request while someone types: a key meant for the field may not press a control.
  render(
    <Dialog
      open
      onOpenChange={() => {}}
      title="De agent vraagt iets"
      closeLabel="Later"
      initialFocus="panel"
    >
      <button type="button">Kies</button>
    </Dialog>,
  )
  await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus())
  await userEvent.tab()
  // The content first; the close button is last in the order, though it stands top right.
  expect(screen.getByRole('button', { name: 'Kies' })).toHaveFocus()
})

test('focus returns to where it came from', async () => {
  /** Opened from outside, the way a question arrives while someone types in the composer. */
  function Arriving({ open }: { open: boolean }) {
    const [dismissed, setDismissed] = useState(false)
    return (
      <>
        <input aria-label="Bericht" />
        <Dialog
          open={open && !dismissed}
          onOpenChange={(next) => setDismissed(!next)}
          title="De agent vraagt iets"
          closeLabel="Later"
        >
          <button type="button">Kies</button>
        </Dialog>
      </>
    )
  }
  const { rerender } = render(<Arriving open={false} />)
  const field = screen.getByRole('textbox', { name: 'Bericht' })
  field.focus()
  rerender(<Arriving open />)
  await waitFor(() => expect(field).not.toHaveFocus())
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(field).toHaveFocus())
})

test('the hand-back never takes the focus from what holds it by then', async () => {
  // An answer in the footer that opens something whose field takes the focus once core has
  // answered: the modal's trap is gone with the panel, and Radix's hand-back comes a task later.
  // When the field got there first, the hand-back must not pull the focus back to the opener.
  function Answering() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Openen
        </button>
        <input aria-label="Adres" />
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="De agent vraagt iets"
          closeLabel="Later"
          footer={
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                // After the panel is gone but ahead of the hand-back: a timer set before its own.
                setTimeout(() => screen.getByRole('textbox', { name: 'Adres' }).focus(), 0)
              }}
            >
              Toestaan
            </button>
          }
        >
          <p>Inhoud</p>
        </Dialog>
      </>
    )
  }
  render(<Answering />)
  await userEvent.click(screen.getByRole('button', { name: 'Openen' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Toestaan' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(screen.getByRole('textbox', { name: 'Adres' })).toHaveFocus()
})

test('closed by its own button, it hands the focus back to the opener', async () => {
  // The keyboard reader's case: nothing else took the focus, so it returns to where it was.
  render(<Example startOpen={false} />)
  const opener = screen.getByRole('button', { name: 'Openen' })
  await userEvent.click(opener)
  await userEvent.click(await screen.findByRole('button', { name: 'Eerste' }))
  await userEvent.click(screen.getByRole('button', { name: 'Later' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  await waitFor(() => expect(opener).toHaveFocus())
})

test('an escape it handled does not reach the composer', async () => {
  const seen: boolean[] = []
  const listener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') seen.push(event.defaultPrevented)
  }
  window.addEventListener('keydown', listener)
  try {
    render(<Example />)
    await userEvent.keyboard('{Escape}')
    // The composer and the register read `defaultPrevented`: true means "a layer had it".
    expect(seen).toEqual([true])
  } finally {
    window.removeEventListener('keydown', listener)
  }
})

test('the close button shows its name as a tooltip on focus', async () => {
  render(<Example />)
  screen.getByRole('button', { name: 'Later' }).focus()
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Later')
})

test('wide panel caps at 60rem and the window, and has a height of its own', () => {
  render(
    <Dialog open onOpenChange={() => {}} title="Breed" closeLabel="Sluit" size="wide">
      <p>Twee kolommen</p>
    </Dialog>,
  )
  const dialog = screen.getByRole('dialog')
  expect(dialog.className).toContain('w-[60rem]')
  expect(dialog.className).toContain('max-w-[calc(100vw-4rem)]')
  expect(dialog.className).toContain('h-[min(44rem,85vh)]')
})

test('the default panel stays 32rem wide', () => {
  render(<Example />)
  expect(screen.getByRole('dialog').className).toContain('w-[32rem]')
})
