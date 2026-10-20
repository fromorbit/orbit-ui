import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { PortalContainerProvider } from './portal'
import { TOAST_DURATION_MS, TOAST_LONG_DURATION_MS, Toast, ToastProvider } from './Toast'

/** The li Radix mounts for every open toast, in the order they sit in the viewport. */
function toastTitles(): string[] {
  return Array.from(document.querySelectorAll('li')).map((item) => item.textContent ?? '')
}

test('a toast announces itself without taking the focus', async () => {
  render(
    <ToastProvider>
      <Toast title="Verzoek verlopen" duration={Number.POSITIVE_INFINITY} onOpenChange={vi.fn()} />
    </ToastProvider>,
  )
  expect(document.activeElement).toBe(document.body)
  // The live region exists right away but stays empty for a frame, so Radix never fires a
  // screen reader's "content changed" event for text that was there from the start.
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent('Verzoek verlopen')
  })
})

/** Four toasts that each remove themselves from the caller's own list once told to close. */
function FourToasts() {
  const [labels, setLabels] = useState(['A', 'B', 'C', 'D'])
  return (
    <ToastProvider>
      {labels.map((label) => (
        <Toast
          key={label}
          title={label}
          duration={Number.POSITIVE_INFINITY}
          onOpenChange={() => setLabels((current) => current.filter((item) => item !== label))}
        />
      ))}
    </ToastProvider>
  )
}

test('a fourth toast pushes the oldest one out', () => {
  render(<FourToasts />)
  expect(toastTitles()).toEqual(['B', 'C', 'D'])
})

test('an action fires and closes the toast', async () => {
  const onClick = vi.fn()
  const onOpenChange = vi.fn()
  render(
    <ToastProvider>
      <Toast
        title="Verzoek verlopen"
        duration={Number.POSITIVE_INFINITY}
        action={{ label: 'Ongedaan maken', onClick }}
        onOpenChange={onOpenChange}
      />
    </ToastProvider>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Ongedaan maken' }))
  expect(onClick).toHaveBeenCalled()
  expect(onOpenChange).toHaveBeenCalledWith(false)
})

test('a stand of the layer can carry a name of its own', () => {
  render(
    <ToastProvider label="Meldingen van chat A">
      <Toast title="Chat A wacht" duration={Number.POSITIVE_INFINITY} onOpenChange={vi.fn()} />
    </ToastProvider>,
  )
  expect(screen.getByRole('region', { name: 'Meldingen van chat A' })).toBeInTheDocument()
})

test('a toast lands in the portal container, not in the body', () => {
  const host = document.createElement('div')
  document.body.append(host)
  try {
    render(
      <PortalContainerProvider container={host}>
        <ToastProvider>
          <Toast
            title="Verzoek verlopen"
            duration={Number.POSITIVE_INFINITY}
            onOpenChange={vi.fn()}
          />
        </ToastProvider>
      </PortalContainerProvider>,
    )
    const [item] = document.querySelectorAll('li')
    expect(host.contains(item ?? null)).toBe(true)
  } finally {
    host.remove()
  }
})

test('closes itself after five seconds when the caller names no duration', async () => {
  // One default for every toast, the undo after archiving too.
  expect(TOAST_DURATION_MS).toBe(5_000)
  expect(TOAST_LONG_DURATION_MS).toBe(8_000)
  vi.useFakeTimers({ shouldAdvanceTime: true })
  try {
    const onOpenChange = vi.fn()
    render(
      <ToastProvider>
        <Toast title="Gearchiveerd" onOpenChange={onOpenChange} />
      </ToastProvider>,
    )
    await vi.advanceTimersByTimeAsync(4_900)
    expect(onOpenChange).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(200)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  } finally {
    vi.useRealTimers()
  }
})

test('the stand of toasts is as wide as the sidebar less its gutters', () => {
  render(
    <ToastProvider>
      <Toast title="Gearchiveerd" duration={Number.POSITIVE_INFINITY} onOpenChange={vi.fn()} />
    </ToastProvider>,
  )
  const viewport = document.querySelector('ol')
  expect(viewport?.className).toContain('w-(--nt-toast-width)')
  expect(viewport?.className).not.toContain('w-80')
})

test('the stand of toasts starts above the foot of the sidebar, not over it', () => {
  render(
    <ToastProvider>
      <Toast title="Gearchiveerd" duration={Number.POSITIVE_INFINITY} onOpenChange={vi.fn()} />
    </ToastProvider>,
  )
  const viewport = document.querySelector('ol')
  expect(viewport?.className).toContain('bottom-(--nt-toast-bottom)')
  expect(viewport?.className).not.toContain('bottom-4')
})

test('the stand of toasts marks a window without the foot of the sidebar', () => {
  const { unmount } = render(
    <ToastProvider>
      <Toast title="Gearchiveerd" duration={Number.POSITIVE_INFINITY} onOpenChange={vi.fn()} />
    </ToastProvider>,
  )
  expect(document.querySelector('ol')?.hasAttribute('data-nt-toast-without-foot')).toBe(false)
  unmount()
  render(
    <ToastProvider aboveFoot={false}>
      <Toast title="Gearchiveerd" duration={Number.POSITIVE_INFINITY} onOpenChange={vi.fn()} />
    </ToastProvider>,
  )
  expect(document.querySelector('ol')?.hasAttribute('data-nt-toast-without-foot')).toBe(true)
})
