import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { RelativeTime, type RelativeTimeLabels, RelativeTimeText } from './RelativeTime'

/** The short units a Dutch host gives. */
const NL: RelativeTimeLabels = {
  now: 'nu',
  minutes: (count) => `${count} min`,
  hours: (count) => `${count} u`,
  days: (count) => `${count} d`,
  weeks: (count) => `${count} w`,
}

/** The same in English, where an hour is an `h`. */
const EN: RelativeTimeLabels = { ...NL, now: 'now', hours: (count) => `${count} h` }

const now = Date.UTC(2026, 8, 19, 12, 0, 0)
const minute = 60_000
const hour = 60 * minute
const day = 24 * hour

/**
 * The short text for a moment, read off a render of its own.
 *
 * Through the component rather than through the formatter: the thresholds only ever reach a user
 * this way, and the formatter has no caller besides this component to justify an export.
 */
function shortText(at: number): string {
  const { container } = render(<RelativeTime at={at} now={now} labels={NL} />)
  return container.querySelector('time')?.textContent ?? ''
}

test.each([
  [0, 'nu'],
  [59_000, 'nu'],
  [5 * minute, '5 min'],
  [59 * minute, '59 min'],
  [hour, '1 u'],
  [23 * hour, '23 u'],
  [day, '1 d'],
  [6 * day, '6 d'],
  [7 * day, '1 w'],
  [30 * day, '4 w'],
])('%i ms ago is "%s"', (ago, expected) => {
  expect(shortText(now - ago)).toBe(expected)
})

test('a moment in the future is "nu"', () => {
  expect(shortText(now + hour)).toBe('nu')
})

test('the units are the words it is given', () => {
  const english = render(<RelativeTime at={now - 2 * hour} now={now} labels={EN} />)
  expect(english.container.querySelector('time')).toHaveTextContent('2 h')
  english.unmount()
  expect(shortText(now - 2 * hour)).toBe('2 u')
})

test('the component shows the same short text', () => {
  render(<RelativeTime at={now - 5 * minute} now={now} labels={NL} />)
  expect(screen.getByText('5 min')).toBeInTheDocument()
})

test('the full time stands as an ISO time in dateTime, for whoever asks for it', () => {
  const { container } = render(<RelativeTime at={now - hour} now={now} labels={NL} />)
  expect(container.querySelector('time')).toHaveAttribute(
    'datetime',
    new Date(now - hour).toISOString(),
  )
})

test('the digits line up under each other', () => {
  const { container } = render(<RelativeTime at={now} now={now} labels={NL} />)
  expect(container.querySelector('time')?.className).toContain('tabular-nums')
})

test('a row that already has the short text draws the same element with it', () => {
  // ChatRow formats the time for its own label; handing that text over spares every row a second
  // format, which adds up on start with a long list of chats.
  const at = now - 5 * minute
  const own = render(<RelativeTime at={at} now={now} labels={NL} />).container.innerHTML
  const given = render(<RelativeTimeText at={at} text="5 min" />).container.innerHTML
  expect(given).toBe(own)
})
