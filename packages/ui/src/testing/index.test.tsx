import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Button } from '../primitives/Button'
import { useUi } from '../provider/UiProvider'
import { fakeShortcuts, HEADING_START_CASES, renderWithUi } from './index'

/** Shows the platform the provider hands down, so a test can read it. */
function PlatformProbe() {
  return <span data-testid="platform">{useUi().platform}</span>
}

test('renders with the neutral ports when none are given', () => {
  renderWithUi(<Button shortcut="demo.new">Nieuw</Button>)
  const button = screen.getByRole('button', { name: 'Nieuw' })
  expect(button).not.toHaveAttribute('aria-keyshortcuts')
  expect(button.querySelector('kbd')).toBeNull()
})

test('hands the given ports to the provider', () => {
  renderWithUi(
    <>
      <Button shortcut="demo.new">Nieuw</Button>
      <PlatformProbe />
    </>,
    { ports: { shortcuts: fakeShortcuts('windows'), platform: 'windows' } },
  )
  expect(screen.getByRole('button', { name: 'Nieuw' })).toHaveAttribute(
    'aria-keyshortcuts',
    'Control+N',
  )
  expect(screen.getByTestId('platform')).toHaveTextContent('windows')
})

test('names no command id of a host in its fake catalogue', () => {
  const port = fakeShortcuts()
  for (const id of ['browser.hardReload', 'chat.new', 'panel.toggle', 'panel.start.changes']) {
    expect(port.label(id), id).toBe(id)
  }
})

test('hands a host the heading cases of Prose, to hold equal to its own', () => {
  expect(HEADING_START_CASES.length).toBeGreaterThan(0)
  expect(HEADING_START_CASES.every((testCase) => typeof testCase.source === 'string')).toBe(true)
})
