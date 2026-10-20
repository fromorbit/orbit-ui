import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Button } from '../primitives/Button'
import { ErrorState } from './ErrorState'

test('a failure announces itself: role alert, with the text as the message', () => {
  render(<ErrorState title="De run kon niet starten" />)
  expect(screen.getByRole('alert')).toHaveTextContent('De run kon niet starten')
})

test('the code stands in mono and muted, as a complement to the text', () => {
  render(<ErrorState title="De run kon niet starten" code="provider_unavailable" />)
  const code = screen.getByText('provider_unavailable')
  expect(code.className).toContain('font-mono')
  expect(code.className).toContain('text-muted')
})

test('without a code there is no second row', () => {
  const { container } = render(<ErrorState title="De run kon niet starten" />)
  expect(container.querySelectorAll('p')).toHaveLength(1)
})

test('the icon is decorative: the text carries the message', () => {
  const { container } = render(<ErrorState title="De run kon niet starten" />)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test('the small size is compact: a row instead of a centred column', () => {
  // Both shapes stand in the same document here, so each one is read from its own container
  // instead of from the screen.
  const compact = within(render(<ErrorState title="Mislukt" size="sm" />).container).getByRole(
    'alert',
  )
  const full = within(render(<ErrorState title="Mislukt" />).container).getByRole('alert')
  // The two directions themselves. `expect(compact.className).not.toBe(full.className)` stood here
  // and could not fail as long as the sizes differed by a single character, so it proved nothing
  // the two lines below do not. How the two really look is held by the reference images
  // `patterns-errorstate--with-a-code.png` and
  // `patterns-errorstate--compact-inside-a-list-or-a-popover.png`.
  expect(compact.className).toContain('flex-row')
  expect(full.className).toContain('flex-col')
  expect(compact.className).not.toContain('text-center')
  expect(full.className).toContain('text-center')
})

test('the action is there, from the caller', () => {
  render(<ErrorState title="Mislukt" action={<Button>Opnieuw</Button>} />)
  expect(screen.getByRole('button', { name: 'Opnieuw' })).toBeInTheDocument()
})

test('the words of the source itself stand below it, untranslated and selectable', () => {
  // A provider says more than its code does ("your session has expired", "you are over quota").
  // That is content, not interface text, so it arrives exactly as the source wrote it.
  render(
    <ErrorState
      title="Er ging iets mis"
      code="authentication_failed"
      detail="Your Claude subscription has expired."
    />,
  )
  const detail = screen.getByText('Your Claude subscription has expired.')
  expect(detail.className).toContain('font-mono')
  expect(detail.className).toContain('text-muted')
  expect(detail.className).toContain('select-text')
  expect(detail.className).toContain('break-words')
})

test('the words of the source are there in the small size too', () => {
  render(<ErrorState size="sm" title="Er ging iets mis" detail="Rate limit reached." />)
  expect(screen.getByRole('alert')).toHaveTextContent('Rate limit reached.')
})

test('an empty or blank detail counts as absent: no empty row', () => {
  const { container } = render(<ErrorState title="Er ging iets mis" detail="   " />)
  expect(container.querySelectorAll('p')).toHaveLength(1)
})

test('the text comes from the caller: the pattern translates nothing itself', () => {
  // The caller resolves `errors.<code>` and hands over the result, so a pattern never needs the
  // catalogue and a core error code never becomes interface text by accident.
  render(<ErrorState title="Provider niet beschikbaar" code="provider_unavailable" />)
  expect(screen.getByRole('alert')).toHaveTextContent('Provider niet beschikbaar')
  expect(screen.getByRole('alert')).toHaveTextContent('provider_unavailable')
})
