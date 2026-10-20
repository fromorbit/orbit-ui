import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { nl } from '../testing/labels'
import { CopyButton } from './CopyButton'

let writeText: ReturnType<typeof vi.fn>

/** The clipboard as it was before any of this ran, so every test hands it back. */
const realClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

beforeEach(() => {
  vi.useFakeTimers()
  writeText = vi.fn(async () => {})
  // happy-dom has no clipboard, and the real one is unreachable from a test anyway: the component
  // owns the call, so the fake goes where the component looks for it.
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  // A global left standing is a global the next file inherits.
  if (realClipboard) Object.defineProperty(navigator, 'clipboard', realClipboard)
  else Reflect.deleteProperty(navigator, 'clipboard')
})

/** The button and the region that speaks for it. */
const button = () => screen.getByRole('button', { name: 'Kopiëren' })
const said = () => screen.getByRole('status').textContent

/** Clicks the button and flushes the promise the clipboard call returns. */
async function press(): Promise<void> {
  await act(async () => {
    button().click()
  })
}

/** Lets the timers run for `ms`, with the re-render that follows flushed inside `act`. */
async function wait(ms: number): Promise<void> {
  await act(async () => {
    vi.advanceTimersByTime(ms)
  })
}

test('copies its text and confirms it in words as well as in the icon', async () => {
  render(<CopyButton {...nl.copy} text="Hallo" />)
  expect(said()).toBe('')

  await press()
  expect(writeText).toHaveBeenCalledWith('Hallo')
  expect(said()).toBe('Gekopieerd')
  expect(button().querySelector('svg.lucide-check')).toBeInTheDocument()
})

test('the name of the button never changes, so it is not announced twice', async () => {
  render(<CopyButton {...nl.copy} text="Hallo" />)
  await press()
  expect(button()).toHaveAccessibleName('Kopiëren')
  await wait(1_500)
  expect(button()).toHaveAccessibleName('Kopiëren')
})

test('after a second and a half both the word and the tick are gone', async () => {
  render(<CopyButton {...nl.copy} text="Hallo" />)
  await press()
  await wait(1_499)
  expect(said()).toBe('Gekopieerd')
  await wait(1)
  expect(said()).toBe('')
  expect(button().querySelector('svg.lucide-copy')).toBeInTheDocument()
})

test('clicking again while it still says so starts the second and a half over', async () => {
  render(<CopyButton {...nl.copy} text="Hallo" />)
  await press()
  await wait(1_400)
  await press()
  await wait(1_400)
  // Without the restart the first timer would have cleared it 1300 ms ago.
  expect(said()).toBe('Gekopieerd')
  await wait(100)
  expect(said()).toBe('')
})

test('a function is asked only when the button is pressed, and asked again', async () => {
  // The caller hands over a whole message or a whole code block; building that string on every
  // render of a conversation is work nobody asked for.
  const text = vi.fn(() => 'Nu')
  render(<CopyButton {...nl.copy} text={text} />)
  expect(text).not.toHaveBeenCalled()
  await press()
  expect(writeText).toHaveBeenCalledWith('Nu')
  await press()
  expect(text).toHaveBeenCalledTimes(2)
})

test('a refused clipboard is visible as well as audible', async () => {
  writeText.mockRejectedValue(new Error('geweigerd'))
  render(<CopyButton {...nl.copy} text="Hallo" />)
  await press()

  // Whoever is looking sees it too: the glyph becomes a warning sign in the danger colour. Shape
  // and word together, never colour on its own.
  expect(said()).toBe('Kopiëren mislukt')
  const warning = button().querySelector('svg.lucide-triangle-alert')
  expect(warning).toBeInTheDocument()
  expect(warning?.getAttribute('class')).toContain('text-danger')
  // No tick: nothing was copied, so nothing may look as if it was.
  expect(button().querySelector('svg.lucide-check')).toBeNull()
})

test('the warning goes away on the same second and a half as the tick', async () => {
  writeText.mockRejectedValue(new Error('geweigerd'))
  render(<CopyButton {...nl.copy} text="Hallo" />)
  await press()
  await wait(1_500)
  expect(said()).toBe('')
  expect(button().querySelector('svg.lucide-copy')).toBeInTheDocument()
  expect(button()).toHaveAccessibleName('Kopiëren')
})

test('unmounting leaves no timer behind and nothing running', async () => {
  const errors = vi.spyOn(console, 'error')
  const { unmount } = render(<CopyButton {...nl.copy} text="Hallo" />)
  await press()
  // The flash is waiting to be undone.
  expect(vi.getTimerCount()).toBe(1)

  unmount()
  // Not "some clearTimeout ran": there is no timer left at all, so nothing can come back to a
  // component that is gone.
  expect(vi.getTimerCount()).toBe(0)
  await wait(5_000)
  expect(errors).not.toHaveBeenCalled()
})

test('a clipboard that answers after the unmount changes nothing', async () => {
  const errors = vi.spyOn(console, 'error')
  let answer = () => {}
  writeText.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        answer = resolve
      }),
  )
  const { unmount } = render(<CopyButton {...nl.copy} text="Hallo" />)
  // Deliberately not awaited: the press is still in the air when the component leaves.
  button().click()
  unmount()

  await act(async () => {
    answer()
  })
  expect(vi.getTimerCount()).toBe(0)
  expect(errors).not.toHaveBeenCalled()
})

test('the region that speaks is mounted from the start, or it is never read out', async () => {
  // A screen reader only announces a live region that was already in the document when its text
  // changed, so it may not appear together with the word.
  render(<CopyButton {...nl.copy} text="Hallo" />)
  const region = screen.getByRole('status')
  await press()
  expect(screen.getByRole('status')).toBe(region)
})

test('shows its name as a tooltip on focus, like every icon button', async () => {
  // `findByRole` polls on timers; the fake ones of this file would never let it look again.
  vi.useRealTimers()
  render(<CopyButton {...nl.copy} text="npm test" />)
  button().focus()
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Kopiëren')
})
