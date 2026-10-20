import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { uiWrapper } from '../testing/ui-wrapper'
import { FileLink } from './FileLink'

test('a file link is a button named after the path and the line', () => {
  render(
    <p>
      Zie{' '}
      <FileLink
        label="Open src/winkelmand/totaal.ts, regel 42"
        text="src/winkelmand/totaal.ts:42"
        path="src/winkelmand/totaal.ts"
        line={42}
        onOpen={() => {}}
      />
    </p>,
  )
  const link = screen.getByRole('button', { name: 'Open src/winkelmand/totaal.ts, regel 42' })
  expect(link).toHaveAttribute('title', 'src/winkelmand/totaal.ts:42')
  // The text is the agent's own, and nothing else: copying it gives what was written.
  expect(link.textContent).toBe('src/winkelmand/totaal.ts:42')
  expect(link.querySelector('[data-nt-file-icon]')).not.toBeNull()
  render(<FileLink label="Open src/app.ts" text="src/app.ts" path="src/app.ts" onOpen={() => {}} />)
  expect(screen.getByRole('button', { name: 'Open src/app.ts' })).toBeInTheDocument()
})

test('it has room on both sides and a quiet surface on hover, never an underline', () => {
  // Classes, because happy-dom computes no layout: the look itself is the gallery's reference.
  render(<FileLink label="Open src/app.ts" text="src/app.ts" path="src/app.ts" onOpen={() => {}} />)
  const link = screen.getByRole('button', { name: 'Open src/app.ts' })
  expect(link.className).toMatch(/(^| )px-1( |$)/)
  expect(link.className).toMatch(/(^| )hover:bg-surface-active( |$)/)
  expect(link.className).toMatch(/(^| )rounded-sm( |$)/)
  expect(link.className).toMatch(/(^| )cursor-pointer( |$)/)
  expect(link.className).toMatch(/focus-visible:outline-2/)
  expect(link.innerHTML).not.toMatch(/underline/)
})

test('it reports the modifier of the click', async () => {
  const onOpen = vi.fn()
  const { unmount } = render(
    <FileLink label="Open src/app.ts" text="src/app.ts" path="src/app.ts" onOpen={onOpen} />,
    {
      wrapper: uiWrapper({ platform: 'windows' }),
    },
  )
  const link = screen.getByRole('button', { name: 'Open src/app.ts' })
  await userEvent.click(link)
  // The platform's own modifier: ⌘ on macOS, Ctrl elsewhere.
  fireEvent.click(link, { ctrlKey: true })
  fireEvent.click(link, { metaKey: true })
  expect(onOpen.mock.calls.map(([event]) => event.modifier)).toEqual([false, true, false])
  expect(onOpen.mock.calls[0]?.[0].target).toBe(link)
  unmount()
  onOpen.mockClear()
  render(<FileLink label="Open src/app.ts" text="src/app.ts" path="src/app.ts" onOpen={onOpen} />, {
    wrapper: uiWrapper({ platform: 'mac' }),
  })
  const mac = screen.getByRole('button', { name: 'Open src/app.ts' })
  fireEvent.click(mac, { metaKey: true })
  fireEvent.click(mac, { ctrlKey: true })
  expect(onOpen.mock.calls.map(([event]) => event.modifier)).toEqual([true, false])
})
