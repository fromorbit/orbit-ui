import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { Button } from '../primitives/Button'
import { AnchoredPopover, Popover } from './Popover'
import { PortalContainerProvider } from './portal'
import { TooltipProvider } from './Tooltip'

/** The shape every caller has: a control that opens it and a panel with something in it. */
function Example({
  onOpenChange,
  outside = false,
}: {
  onOpenChange?: (open: boolean) => void
  /** Renders a second control outside the panel, to click or focus away to. */
  outside?: boolean
}) {
  return (
    <>
      <Popover
        trigger={<Button>Kies</Button>}
        label="Projecten"
        {...(onOpenChange ? { onOpenChange } : {})}
      >
        <button type="button">Klant A</button>
      </Popover>
      {outside ? <button type="button">Ernaast</button> : null}
    </>
  )
}

/** Opens the panel the way a reader does and hands back the trigger and the panel. */
async function open(): Promise<{ trigger: HTMLElement; panel: HTMLElement }> {
  const trigger = screen.getByRole('button', { name: 'Kies' })
  await userEvent.click(trigger)
  const panel = await screen.findByRole('dialog', { name: 'Projecten' })
  return { trigger, panel }
}

test('a click on the trigger opens a dialog named by its label', async () => {
  render(<Example />)
  const { trigger, panel } = await open()
  expect(panel).toHaveTextContent('Klant A')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
})

test.each(['{Enter}', ' '])('the trigger opens with %s, as any button does', async (key) => {
  render(<Example />)
  screen.getByRole('button', { name: 'Kies' }).focus()
  await userEvent.keyboard(key)
  expect(await screen.findByRole('dialog', { name: 'Projecten' })).toBeInTheDocument()
})

test('focus moves into the panel and comes back to the trigger when it closes', async () => {
  render(<Example />)
  const { trigger, panel } = await open()
  await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true))
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(trigger).toHaveFocus()
})

test('a click outside closes it', async () => {
  render(<Example outside />)
  await open()
  await userEvent.click(screen.getByRole('button', { name: 'Ernaast' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

test('Escape closes it and leaves the key marked as handled', async () => {
  // The rule the whole overlay layer exists for: the topmost layer answers Escape and says so, so
  // a window listener below it (the composer stopping a turn, App closing the settings) stays put.
  // Only once no layer is open does that listener see an Escape it may act on.
  const handled: boolean[] = []
  const listener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') handled.push(event.defaultPrevented)
  }
  window.addEventListener('keydown', listener)
  try {
    render(<Example />)
    await open()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(handled).toEqual([true])
    await userEvent.keyboard('{Escape}')
    expect(handled).toEqual([true, false])
  } finally {
    window.removeEventListener('keydown', listener)
  }
})

test('opening a second panel closes the first, because the focus moved into it', async () => {
  // "Closes when focus leaves" has a consequence worth writing down: two panels never stand open
  // beside each other. Opening one moves the focus into it, which is outside the other, and the
  // other closes. A gallery story may therefore have at most one state that opens on mount.
  render(
    <>
      <Popover trigger={<Button>Kies</Button>} label="Projecten">
        <button type="button">Klant A</button>
      </Popover>
      <Popover trigger={<Button>Model</Button>} label="Model">
        <button type="button">Sonnet</button>
      </Popover>
    </>,
  )
  await open()
  await userEvent.click(screen.getByRole('button', { name: 'Model' }))
  expect(await screen.findByRole('dialog', { name: 'Model' })).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.queryByRole('dialog', { name: 'Projecten' })).not.toBeInTheDocument(),
  )
})

test('a capture-phase listener on window runs before the layer and sees Escape untouched', async () => {
  // The documented limit of the rule above. The layer marks the key from a handler on the document
  // in the capture phase, and the capture path is window → document → target: a listener on
  // `window` registered with `capture: true` therefore runs first, on an event nothing has claimed
  // yet. Everything that listens for Escape in this app does so in the bubble phase, which is what
  // makes the rule hold — a future one in the capture phase would have to check the layers itself.
  const handled: boolean[] = []
  const listener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') handled.push(event.defaultPrevented)
  }
  window.addEventListener('keydown', listener, true)
  try {
    render(<Example />)
    await open()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(handled).toEqual([false])
  } finally {
    window.removeEventListener('keydown', listener, true)
  }
})

test('the caller hears every change of state', async () => {
  const onOpenChange = vi.fn()
  render(<Example onOpenChange={onOpenChange} />)
  await open()
  expect(onOpenChange).toHaveBeenLastCalledWith(true)
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false))
})

test('a controlled Popover only opens when the caller says so', async () => {
  function Controlled() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Popover
          trigger={<Button>Kies</Button>}
          label="Projecten"
          open={open}
          onOpenChange={() => {}}
        >
          <button type="button">Klant A</button>
        </Popover>
        <button type="button" onClick={() => setOpen(true)}>
          Van buitenaf
        </button>
      </>
    )
  }
  render(<Controlled />)
  await userEvent.click(screen.getByRole('button', { name: 'Kies' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Van buitenaf' }))
  expect(await screen.findByRole('dialog', { name: 'Projecten' })).toBeInTheDocument()
})

test('the panel mounts in the container of the surrounding provider', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  try {
    render(
      <PortalContainerProvider container={host}>
        <Example />
      </PortalContainerProvider>,
    )
    const { panel } = await open()
    expect(host.contains(panel)).toBe(true)
  } finally {
    host.remove()
  }
})

// What the panel looks like — its colour, its layer, its shadow and whether it is still clickable
// inside a drag region — is asserted in a real browser by `a Popover panel is opaque and covers
// what lies behind it`, and its fade by `a Popover panel fades in, and simply stands there when
// motion is reduced`, both in Orbit's end-to-end gallery test. happy-dom lays nothing out, so a
// class-string assertion here would only repeat the source of `panel.ts` back at itself.

test('a controlled Popover must be able to close again, or it does not type-check', () => {
  render(
    // @ts-expect-error `open` without `onOpenChange` leaves a panel nothing can shut
    <Popover trigger={<Button>Kies</Button>} label="Projecten" open>
      <button type="button">Klant A</button>
    </Popover>,
  )
  expect(screen.getByRole('dialog', { name: 'Projecten' })).toBeInTheDocument()
})

test('a given className does not reach the DOM', async () => {
  render(
    // @ts-expect-error className is not allowed; every panel looks the same
    <Popover trigger={<Button>Kies</Button>} label="Projecten" className="rogue">
      <button type="button">Klant A</button>
    </Popover>,
  )
  await open()
  expect(document.querySelector('.rogue')).toBeNull()
})

test('a tooltip on the trigger describes it and the trigger still opens the panel', async () => {
  render(
    <TooltipProvider delayDuration={0}>
      <Popover trigger={<Button>Kies</Button>} label="Projecten" tooltip="Drie projecten">
        <button type="button">Klant A</button>
      </Popover>
    </TooltipProvider>,
  )
  const trigger = screen.getByRole('button', { name: 'Kies' })
  act(() => trigger.focus())
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Drie projecten')
  expect(trigger).toHaveAccessibleDescription('Drie projecten')
  await userEvent.click(trigger)
  expect(await screen.findByRole('dialog', { name: 'Projecten' })).toBeInTheDocument()
})

/** Lets every timer that is due run: Radix hands the focus back one task after the panel closed. */
function nextTasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 20))
}

/** A controlled panel whose one control closes it and then does `after` a task later. */
function ClosingFromInside({ after }: { after: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <input aria-label="Adres" />
      <Popover trigger={<Button>Kies</Button>} label="Projecten" open={open} onOpenChange={setOpen}>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            // After the panel is gone but ahead of the hand-back: a timer set before its own.
            setTimeout(after, 0)
          }}
        >
          Klant A
        </button>
      </Popover>
    </>
  )
}

test('the hand-back never takes the focus from what holds it by then', async () => {
  // A row in the panel that opens something whose field takes the focus once core has answered:
  // when that lands before Radix's deferred hand-back to the trigger, the hand-back must not win.
  render(<ClosingFromInside after={() => screen.getByRole('textbox', { name: 'Adres' }).focus()} />)
  await userEvent.click(screen.getByRole('button', { name: 'Kies' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Klant A' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  await nextTasks()
  expect(screen.getByRole('textbox', { name: 'Adres' })).toHaveFocus()
})

test('a late hand-back leaves the focus in the panel opened again in the meantime', async () => {
  // Delayed long enough under load, the hand-back of one close fired after the reader had opened
  // the panel again, and pulled the focus out of it onto the trigger.
  render(
    <ClosingFromInside
      after={() => {
        const trigger = screen.getByRole('button', { name: 'Kies' })
        trigger.focus()
        fireEvent.click(trigger)
      }}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Kies' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Klant A' }))
  await nextTasks()
  const panel = screen.getByRole('dialog', { name: 'Projecten' })
  expect(panel.contains(document.activeElement)).toBe(true)
})

/** A preview beside a link, open until it asks to close, with a field outside it. */
function Anchored() {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(true)
  return (
    <>
      <input aria-label="Bericht" />
      <button type="button" ref={setAnchor}>
        src/totaal.ts
      </button>
      {open && anchor !== null ? (
        <AnchoredPopover anchor={anchor} onClose={() => setOpen(false)} label="Voorbeeld">
          <button type="button">Openen</button>
        </AnchoredPopover>
      ) : null}
    </>
  )
}

test('an anchored panel hands the focus back to its anchor on Escape', async () => {
  render(<Anchored />)
  const panel = await screen.findByRole('dialog', { name: 'Voorbeeld' })
  await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true))
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  await waitFor(() => expect(screen.getByRole('button', { name: 'src/totaal.ts' })).toHaveFocus())
})

test('an anchored panel closed by a click in a field leaves the focus in that field', async () => {
  // The hand-back to the anchor comes a task after the close, so after the field took the focus.
  render(<Anchored />)
  await screen.findByRole('dialog', { name: 'Voorbeeld' })
  await userEvent.click(screen.getByRole('textbox', { name: 'Bericht' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  await nextTasks()
  expect(screen.getByRole('textbox', { name: 'Bericht' })).toHaveFocus()
})
