import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Button } from '../primitives/Button'
import { Banner } from './Banner'

test('a notice about the app waits politely for a pause: role status', () => {
  render(<Banner tone="attention">Core start opnieuw op</Banner>)
  expect(screen.getByRole('status')).toHaveTextContent('Core start opnieuw op')
})

test('a failure interrupts: role alert', () => {
  render(<Banner tone="danger">Het commando kon niet worden verstuurd</Banner>)
  expect(screen.getByRole('alert')).toHaveTextContent('Het commando kon niet worden verstuurd')
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('announce={false} leaves the bar out of the accessibility tree as a live region', () => {
  // For a caller that already keeps a live region of its own mounted: the bar itself comes and
  // goes with the condition, so its own `status` would announce nothing and would double the
  // sentence for whoever does hear it.
  render(
    <Banner tone="attention" announce={false}>
      Core start opnieuw op
    </Banner>,
  )
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(screen.getByText('Core start opnieuw op').closest('[role]')).toBeNull()
})

test('the role of a mounted bar does not switch when the tone does', () => {
  // A role is read once, when the element enters the accessibility tree; changing it afterwards is
  // handled unreliably. The contract is to render a fresh Banner per tone (keyed), and the
  // component holds the line for a caller who changes `tone` on a mounted one anyway.
  const { rerender } = render(<Banner tone="attention">Core start opnieuw op</Banner>)
  rerender(<Banner tone="danger">Het commando kon niet worden verstuurd</Banner>)
  expect(screen.getByRole('status')).toHaveTextContent('Het commando kon niet worden verstuurd')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('a fresh bar with tone danger is an alert', () => {
  // Keyed per tone, as the contract says: a new element enters the tree with role `alert` and is
  // announced because it was inserted.
  const { rerender } = render(
    <Banner key="attention" tone="attention">
      Core start opnieuw op
    </Banner>,
  )
  rerender(
    <Banner key="danger" tone="danger">
      Het commando kon niet worden verstuurd
    </Banner>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Het commando kon niet worden verstuurd')
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('the icon is decorative: the text carries the message', () => {
  const { container } = render(<Banner tone="danger">Mislukt</Banner>)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test('busy replaces the icon with a Spinner that does not announce itself', () => {
  const { container } = render(
    <Banner tone="attention" busy>
      Core start opnieuw op
    </Banner>,
  )
  // One live region, not two: the banner says what is happening, so a second "Laden…" on top of
  // it would only be noise.
  expect(screen.getAllByRole('status')).toHaveLength(1)
  const spinner = container.querySelector('svg')
  expect(spinner?.getAttribute('class')).toContain('nt-spin')
  expect(spinner).toHaveAttribute('aria-hidden', 'true')
})

test('the action stands after the message, on the right of the bar', () => {
  render(
    <Banner tone="danger" action={<Button size="sm">Opnieuw</Button>}>
      Mislukt
    </Banner>,
  )
  const message = screen.getByText('Mislukt')
  const action = screen.getByRole('button', { name: 'Opnieuw' })
  // Reading order is the half of "on the right" that happy-dom can see; the other half (the edge
  // it actually sits against) is measured in Orbit's end-to-end gallery test.
  expect(message.compareDocumentPosition(action)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
})

test('without an action nothing stands next to the text', () => {
  render(<Banner tone="attention">Core start opnieuw op</Banner>)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('the bar is at least 32px high, not exactly 32px: long text may wrap', () => {
  // The class is the only thing happy-dom can see here; that it really yields 32px for one line
  // and more for two is measured in Orbit's end-to-end gallery test.
  render(<Banner tone="attention">Core start opnieuw op</Banner>)
  const classes = screen.getByRole('status').className.split(' ')
  expect(classes).toContain('min-h-(--nt-control-lg)')
  expect(classes).not.toContain('h-(--nt-control-lg)')
})

test('the text comes from the caller: the pattern translates nothing itself', () => {
  render(<Banner tone="danger">Provider niet beschikbaar</Banner>)
  expect(screen.getByRole('alert')).toHaveTextContent('Provider niet beschikbaar')
})

test.each(['attention', 'danger'] as const)(
  'prose sets the %s sentence in the text colour at 13px, and only the icon in the tone',
  (tone) => {
    const { container } = render(
      <Banner tone={tone} prose>
        Deze map is nog geen project
      </Banner>,
    )
    const bar = container.firstElementChild as HTMLElement
    const classes = bar.className.split(' ')
    expect(classes).toContain('text-fg')
    expect(classes).toContain('text-[13px]')
    expect(classes).not.toContain(`text-${tone}`)
    // The icon's own box is one line high, so it stands beside the first line, not the middle.
    const icon = container.querySelector('svg')?.parentElement
    expect(icon?.className.split(' ')).toEqual(expect.arrayContaining([`text-${tone}`, 'h-5']))
  },
)

test.each(['attention', 'danger'] as const)(
  'prose lies on the plane with the hairline of the %s tone, top-aligned',
  (tone) => {
    const { container } = render(
      <Banner tone={tone} prose>
        Deze map is nog geen project
      </Banner>,
    )
    const classes = (container.firstElementChild as HTMLElement).className.split(' ')
    expect(classes).toEqual(
      expect.arrayContaining(['bg-plane', 'border', `border-${tone}-border`, 'items-start']),
    )
    expect(classes).not.toContain(`bg-${tone}-subtle`)
    expect(classes).not.toContain('items-center')
  },
)

test('prose lands one line on 40px and lifts a small button level with the first line', () => {
  // happy-dom draws nothing, so the arithmetic is in the classes: the padding is what
  // `--nt-control-lg` leaves after the 20px line and the two 1px edges, and the action's margin
  // lifts a `Button` `sm` to the height of that line, in either density; only at the top, so an
  // action that wraps under the sentence keeps the full padding below it.
  render(
    <Banner tone="danger" prose action={<Button size="sm">Opnieuw</Button>}>
      Mislukt
    </Banner>,
  )
  const bar = screen.getByRole('alert')
  expect(bar.className.split(' ')).toEqual(
    expect.arrayContaining([
      'min-h-(--nt-control-lg)',
      'py-[calc((var(--nt-control-lg)_-_22px)/2)]',
      'leading-5',
    ]),
  )
  const action = screen.getByRole('button', { name: 'Opnieuw' }).parentElement
  const actionClasses = action?.className.split(' ') ?? []
  expect(actionClasses).toContain('mt-[calc((20px_-_var(--nt-control-sm))/2)]')
  expect(actionClasses.some((name) => name.startsWith('my-') || name.startsWith('mb-'))).toBe(false)
})

test('without prose the bar keeps the tinted plane, the tone in its words and no edge', () => {
  render(<Banner tone="attention">Core start opnieuw op</Banner>)
  const classes = screen.getByRole('status').className.split(' ')
  expect(classes).toEqual(
    expect.arrayContaining([
      'bg-attention-subtle',
      'text-attention',
      'items-center',
      'text-[12px]',
    ]),
  )
  expect(classes).not.toContain('border')
  expect(classes).not.toContain('bg-plane')
})
