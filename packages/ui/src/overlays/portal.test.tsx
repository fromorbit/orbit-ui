import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { expect, test } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'
import { Dialog } from './Dialog'
import { DropdownMenu } from './DropdownMenu'
import { Popover } from './Popover'
import { PortalContainerProvider, usePortalContainer } from './portal'
import { Toast, ToastProvider } from './Toast'
import { Tooltip, TooltipProvider } from './Tooltip'

/** A layer in miniature: it asks where portals go and mounts itself there. */
function Layer() {
  const container = usePortalContainer()
  return createPortal(<p>Een laag</p>, container ?? document.body)
}

test('without a provider there is no container, so a layer falls back to the body', () => {
  render(<Layer />)
  expect(screen.getByText('Een laag').parentElement).toBe(document.body)
})

test('a layer mounts in the container the provider names', () => {
  const host = document.createElement('div')
  host.dataset.host = 'yes'
  document.body.append(host)
  try {
    render(
      <PortalContainerProvider container={host}>
        <Layer />
      </PortalContainerProvider>,
    )
    expect(screen.getByText('Een laag').parentElement).toBe(host)
  } finally {
    host.remove()
  }
})

test('a container that is not mounted yet reads as null, not as an error', () => {
  // The container is a DOM node the surrounding screen only has after its first paint, so the very
  // first render always passes `null`. A layer must survive that render instead of throwing.
  render(
    <PortalContainerProvider container={null}>
      <Layer />
    </PortalContainerProvider>,
  )
  expect(screen.getByText('Een laag').parentElement).toBe(document.body)
})

/**
 * Every kind of layer the app has, each opened on its own: together, one layer's focus scope would
 * dismiss another before it could be looked at.
 */
const layers: [string, () => ReactNode, () => Promise<Element | null>][] = [
  [
    'Popover',
    () => (
      <Popover label="Kies" open onOpenChange={() => {}} trigger={<button type="button">P</button>}>
        <p>Inhoud</p>
      </Popover>
    ),
    () => screen.findByRole('dialog', { name: 'Kies' }),
  ],
  [
    'DropdownMenu',
    () => (
      <DropdownMenu
        label="Meer"
        defaultOpen
        trigger={<button type="button">M</button>}
        items={[{ id: 'a', label: 'Archiveren', onSelect: () => {} }]}
      />
    ),
    () => screen.findByRole('menu'),
  ],
  [
    'Tooltip',
    () => (
      <Tooltip label="Uitleg" defaultOpen>
        <button type="button">T</button>
      </Tooltip>
    ),
    async () => (await screen.findByRole('tooltip')).closest('[data-nt-layer]'),
  ],
  [
    'ConfirmDialog',
    () => (
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Zeker?"
        body="Dit kan niet terug."
        confirmLabel="Ja"
        cancelLabel="Nee"
        onConfirm={() => {}}
      />
    ),
    () => screen.findByRole('alertdialog'),
  ],
  [
    'Dialog',
    () => (
      <Dialog open onOpenChange={() => {}} title="De agent vraagt iets" closeLabel="Later">
        <p>Inhoud</p>
      </Dialog>
    ),
    () => screen.findByRole('dialog'),
  ],
  [
    'Toast',
    () => (
      <Toast title="Verzoek verlopen" duration={Number.POSITIVE_INFINITY} onOpenChange={() => {}} />
    ),
    async () => (await screen.findByRole('region')).querySelector('ol'),
  ],
]

test.each(layers)('every layer lands in the portal container: %s', async (_name, layer, find) => {
  // Hosted views freeze on what lies in this container and nowhere else: a
  // layer that portals elsewhere would open over a live view and be drawn *under* it.
  const host = document.createElement('div')
  document.body.append(host)
  try {
    render(
      <PortalContainerProvider container={host}>
        <TooltipProvider>
          <ToastProvider>{layer()}</ToastProvider>
        </TooltipProvider>
      </PortalContainerProvider>,
    )
    const found = await find()
    expect(found).not.toBeNull()
    expect(host.contains(found)).toBe(true)
  } finally {
    host.remove()
  }
})
