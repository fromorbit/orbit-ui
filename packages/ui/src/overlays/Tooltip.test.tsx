import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { IconButton } from '../primitives/IconButton'
import { uiWrapper } from '../testing/ui-wrapper'
import { PortalContainerProvider } from './portal'
import { Tooltip, TooltipProvider } from './Tooltip'

/** Every test wraps in the provider, exactly as a caller in the app would. */
function withProvider(children: React.ReactNode) {
  return <TooltipProvider>{children}</TooltipProvider>
}

test('a tooltip appears on keyboard focus, not only on hover', async () => {
  render(
    withProvider(
      <Tooltip label="Verwijder dit bericht">
        <IconButton icon="x" label="Verwijder" />
      </Tooltip>,
    ),
  )
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  screen.getByRole('button', { name: 'Verwijder' }).focus()
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Verwijder dit bericht')
})

test('the trigger keeps its own name and gains a description', async () => {
  render(
    withProvider(
      <Tooltip label="Verwijder dit bericht">
        <IconButton icon="x" label="Verwijder" />
      </Tooltip>,
    ),
  )
  const trigger = screen.getByRole('button', { name: 'Verwijder' })
  trigger.focus()
  const tooltip = await screen.findByRole('tooltip')
  expect(trigger).toHaveAccessibleName('Verwijder')
  expect(trigger).toHaveAttribute('aria-describedby', tooltip.id)
})

test('a tooltip never takes the focus', async () => {
  render(
    withProvider(
      <Tooltip label="Verwijder dit bericht">
        <IconButton icon="x" label="Verwijder" />
      </Tooltip>,
    ),
  )
  const trigger = screen.getByRole('button', { name: 'Verwijder' })
  trigger.focus()
  await screen.findByRole('tooltip')
  expect(document.activeElement).toBe(trigger)
})

test('a tooltip lands in the portal container, not in the body', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  try {
    render(
      <PortalContainerProvider container={host}>
        {withProvider(
          <Tooltip label="Verwijder dit bericht">
            <IconButton icon="x" label="Verwijder" />
          </Tooltip>,
        )}
      </PortalContainerProvider>,
    )
    screen.getByRole('button', { name: 'Verwijder' }).focus()
    const tooltip = await screen.findByRole('tooltip')
    expect(host.contains(tooltip)).toBe(true)
  } finally {
    host.remove()
  }
})

test('a shortcut is shown beside the label', async () => {
  render(
    withProvider(
      <Tooltip label="Rechterpaneel" shortcut="⌘⌥B">
        <IconButton icon="x" label="Rechterpaneel" />
      </Tooltip>,
    ),
    { wrapper: uiWrapper({ platform: 'linux' }) },
  )
  screen.getByRole('button', { name: 'Rechterpaneel' }).focus()
  const tooltip = await screen.findByRole('tooltip')
  expect(tooltip).toHaveTextContent('Rechterpaneel')
  // Off macOS: Command stays a glyph, Option becomes the Alt it is there.
  const keys = [...tooltip.querySelectorAll('kbd')]
  expect(keys).toHaveLength(3)
  expect(keys[0]?.querySelector('svg')).not.toBeNull()
  expect(keys[1]).toHaveTextContent('Alt')
  expect(keys[2]).toHaveTextContent('B')
})

test('shows the keys of its shortcut id', async () => {
  render(
    withProvider(
      <Tooltip label="Paneel" shortcut="demo.panel">
        <IconButton icon="x" label="Paneel" />
      </Tooltip>,
    ),
    { wrapper: uiWrapper({ platform: 'mac' }) },
  )
  screen.getByRole('button', { name: 'Paneel' }).focus()
  const tooltip = await screen.findByRole('tooltip')
  // ⌥⌘B on macOS: two glyphs and the letter, spelled out for a screen reader.
  const keys = [...tooltip.querySelectorAll('kbd')]
  expect(keys).toHaveLength(3)
  expect(keys.filter((key) => key.querySelector('svg') !== null)).toHaveLength(2)
  expect(keys[2]).toHaveTextContent('B')
  expect(tooltip).toHaveTextContent('Option Command B')
})

test('a story can force a tooltip open, for a still screenshot', async () => {
  render(
    withProvider(
      <Tooltip label="Verwijder dit bericht" defaultOpen>
        <IconButton icon="x" label="Verwijder" />
      </Tooltip>,
    ),
  )
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Verwijder dit bericht')
})

test('a tooltip is a passive layer, so it never freezes a hosted view', async () => {
  // The layer count in `layers.ts` skips anything marked passive.
  render(
    withProvider(
      <Tooltip label="Verwijder dit bericht" defaultOpen>
        <IconButton icon="x" label="Verwijder" />
      </Tooltip>,
    ),
  )
  const tooltip = await screen.findByRole('tooltip')
  expect(tooltip.closest('[data-nt-layer="passive"]')).not.toBeNull()
})

test('a tooltip keeps inside the boundary it is given', async () => {
  // Radix reads the boundary for its collision handling only; the proof here is that passing one
  // leaves the tooltip working. That it flips instead of falling over a view is Playwright's.
  const column = document.createElement('div')
  document.body.append(column)
  try {
    render(
      withProvider(
        <Tooltip label="Verwijder dit bericht" defaultOpen collisionBoundary={column}>
          <IconButton icon="x" label="Verwijder" />
        </Tooltip>,
      ),
    )
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Verwijder dit bericht')
  } finally {
    column.remove()
  }
})

test('a tooltip without a provider above it still works, as its own provider', async () => {
  // A building block that carries a tooltip (a copy button, the cross of a chip) is placed in many
  // screens and tests; it must not throw where nobody put a provider above it.
  render(
    <Tooltip label="Kopiëren">
      <IconButton icon="copy" label="Kopiëren" />
    </Tooltip>,
  )
  screen.getByRole('button', { name: 'Kopiëren' }).focus()
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Kopiëren')
})
