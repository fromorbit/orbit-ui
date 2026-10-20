import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { StatusLine } from './StatusLine'

/** The fixed slot the glyph sits in; the same span in every state, filled or empty. */
function slotOf(container: HTMLElement): Element | null {
  return container.querySelector('[role="status"] > span')
}

test('a quiet row announces itself politely: role status', () => {
  render(<StatusLine>Opslaan…</StatusLine>)
  expect(screen.getByRole('status')).toHaveTextContent('Opslaan…')
})

// Requirement change, not a weakened test: a status line is one live region for the life of the
// element it is mounted on, and swapping a mounted node's role from `status` to `alert` is handled
// unreliably by screen readers — so a failure is announced politely here, and anything that must
// interrupt is a `Banner tone="danger"` or a dialog.
test('a failure keeps the same role: one polite row, the word carries the severity', () => {
  render(<StatusLine tone="danger">Opslaan mislukt</StatusLine>)
  expect(screen.getByRole('status')).toHaveTextContent('Opslaan mislukt')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('the role stays status when the tone changes on the same element', () => {
  const { rerender } = render(<StatusLine busy>Opslaan…</StatusLine>)
  for (const tone of ['success', 'danger', 'muted'] as const) {
    rerender(<StatusLine tone={tone}>Opslaan mislukt</StatusLine>)
    expect(screen.getByRole('status'), tone).toHaveTextContent('Opslaan mislukt')
    expect(screen.queryByRole('alert'), tone).not.toBeInTheDocument()
  }
})

test('success carries its message in words, with the check mark as decoration', () => {
  const { container } = render(<StatusLine tone="success">Opgeslagen</StatusLine>)
  expect(screen.getByRole('status')).toHaveTextContent('Opgeslagen')
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test('busy shows a Spinner that does not announce itself', () => {
  const { container } = render(<StatusLine busy>Opslaan…</StatusLine>)
  // One live region, not two: the sentence already says what is happening.
  expect(screen.getAllByRole('status')).toHaveLength(1)
  const spinner = container.querySelector('svg')
  expect(spinner?.getAttribute('class')).toContain('nt-spin')
  expect(spinner).toHaveAttribute('aria-hidden', 'true')
})

test('the box of the icon keeps the same size in every state that has a glyph', () => {
  // The class is all happy-dom can see; that the sentence really starts at the same x in every
  // such state is measured in Orbit's end-to-end gallery test.
  const slots = [
    slotOf(render(<StatusLine busy>Opslaan…</StatusLine>).container),
    slotOf(render(<StatusLine tone="success">Opgeslagen</StatusLine>).container),
    slotOf(render(<StatusLine tone="danger">Mislukt</StatusLine>).container),
  ]
  for (const slot of slots) {
    expect(slot?.getAttribute('class')).toContain('size-(--nt-icon-sm)')
  }
})

// Requirement change: an empty slot of 14px plus its gap pushed a plain line 22px
// off the left line, as the queue line above the composer.
test('a line without a glyph has no slot, so its words start on the left line', () => {
  const { container } = render(<StatusLine>In de wachtrij</StatusLine>)
  const first = container.querySelector('[role="status"] > span')
  expect(first).toHaveTextContent('In de wachtrij')
})

test('meta stands after the text, on the right of the row, in mono with aligned digits', () => {
  const { container } = render(
    <StatusLine busy meta="3,4k">
      Leest translate.ts
    </StatusLine>,
  )
  const text = screen.getByText('Leest translate.ts')
  const meta = within(container).getByText('3,4k')
  expect(text.compareDocumentPosition(meta)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  expect(meta.className).toContain('font-mono')
  expect(meta.className).toContain('tabular-nums')
})

test('without meta nothing stands right of the text', () => {
  // The slot and the text: a line with a glyph, so the slot is there and nothing follows the text.
  const { container } = render(<StatusLine busy>Klaar</StatusLine>)
  expect(container.querySelectorAll('[role="status"] > span')).toHaveLength(2)
})

test('the text comes from the caller: the pattern translates nothing itself', () => {
  render(<StatusLine tone="danger">Provider niet beschikbaar</StatusLine>)
  expect(screen.getByRole('status')).toHaveTextContent('Provider niet beschikbaar')
})
