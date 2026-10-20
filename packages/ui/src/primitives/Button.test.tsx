import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { expect, test, vi } from 'vitest'
import { uiWrapper } from '../testing/ui-wrapper'
import { Button } from './Button'

test('is a button by default that does not submit a form on its own', () => {
  render(<Button>Verstuur</Button>)
  expect(screen.getByRole('button', { name: 'Verstuur' })).toHaveAttribute('type', 'button')
})

test('without size the size is md', () => {
  render(<Button>Ga</Button>)
  expect(screen.getByRole('button', { name: 'Ga' }).className).toContain('h-(--nt-control-md)')
})

test.each([
  ['xs', 'h-(--nt-control-xs)'],
  ['sm', 'h-(--nt-control-sm)'],
  ['md', 'h-(--nt-control-md)'],
  ['lg', 'h-(--nt-control-lg)'],
] as const)('size="%s" gives %s', (size, expected) => {
  render(
    <Button size={size} disabled={false}>
      Ga
    </Button>,
  )
  expect(screen.getByRole('button', { name: 'Ga' }).className).toContain(expected)
})

test('size="xs" is the quiet button of a footer: 11px words, lit on focus as on hover', () => {
  render(
    <Button variant="ghost" size="xs">
      Ga
    </Button>,
  )
  const { className } = screen.getByRole('button', { name: 'Ga' })
  expect(className).toContain('text-[11px]')
  expect(className).toContain('focus-visible:text-fg')
})

test('variant="primary" gets the accent as its background', () => {
  render(<Button variant="primary">Verstuur</Button>)
  const className = screen.getByRole('button', { name: 'Verstuur' }).className
  expect(className).toContain('bg-accent')
  expect(className).toContain('text-accent-fg')
})

test('carries no-drag, so it stays clickable in a drag region', () => {
  render(<Button>Ga</Button>)
  expect(screen.getByRole('button', { name: 'Ga' }).className).toContain('no-drag')
})

test('disabled is not clickable', async () => {
  const onClick = vi.fn()
  render(
    <Button disabled onClick={onClick}>
      Ga
    </Button>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Ga' }))
  expect(onClick).not.toHaveBeenCalled()
})

test('a given className does not reach the DOM', () => {
  // @ts-expect-error className is not allowed; every button looks the same
  render(<Button className="rogue">Ga</Button>)
  expect(screen.getByRole('button', { name: 'Ga' }).className).not.toContain('rogue')
})

test('a given style does not reach the DOM', () => {
  // @ts-expect-error style is not allowed; every button looks the same
  render(<Button style={{ color: 'red' }}>Ga</Button>)
  expect(screen.getByRole('button', { name: 'Ga' })).not.toHaveAttribute('style')
})

test('a ref points at the native button element', () => {
  const ref = createRef<HTMLButtonElement>()
  render(<Button ref={ref}>Ga</Button>)
  expect(ref.current).toBeInstanceOf(HTMLButtonElement)
})

test('variant="ghost" has no border and muted text', () => {
  render(<Button variant="ghost">Ga</Button>)
  const className = screen.getByRole('button', { name: 'Ga' }).className
  expect(className).toContain('text-muted')
  expect(className).not.toContain('border-border')
})

test('variant="quiet" comes forward on keyboard focus as it does on hover', () => {
  render(<Button variant="quiet">Ga</Button>)
  const className = screen.getByRole('button', { name: 'Ga' }).className
  expect(className).toContain('hover:text-fg')
  expect(className).toContain('focus-visible:text-fg')
})

test('variant="ghost" reads as active through aria-pressed', () => {
  render(
    <Button variant="ghost" aria-pressed>
      Ga
    </Button>,
  )
  // The state itself, as a toolbar reports it, rather than the class that paints it: a class
  // assertion would still pass if the attribute never reached the element.
  expect(screen.getByRole('button', { name: 'Ga', pressed: true })).toBeInTheDocument()
})

test('block fills the full width and aligns the content left, without justify-center beside it', () => {
  render(<Button block>Ga</Button>)
  const className = screen.getByRole('button', { name: 'Ga' }).className
  expect(className).toContain('w-full')
  expect(className).toContain('justify-start')
  expect(className).not.toContain('justify-center')
})

test('rowInset starts the content 8px in, like a list row, and keeps the end padding of its size', () => {
  render(
    <Button size="lg" block rowInset>
      Ga
    </Button>,
  )
  const classes = screen.getByRole('button', { name: 'Ga' }).className.split(' ')
  expect(classes).toContain('ps-2')
  expect(classes).toContain('pe-3.5')
  // Never both: with no class-merging tool the winner would depend on Tailwind's output order.
  expect(classes).not.toContain('px-3.5')
})

test('without rowInset a size keeps its even horizontal padding', () => {
  render(<Button size="lg">Ga</Button>)
  const classes = screen.getByRole('button', { name: 'Ga' }).className.split(' ')
  expect(classes).toContain('px-3.5')
  expect(classes).not.toContain('ps-2')
})

test('without block the content is centred, never together with justify-start', () => {
  render(<Button>Ga</Button>)
  const className = screen.getByRole('button', { name: 'Ga' }).className
  expect(className).toContain('justify-center')
  expect(className).not.toContain('justify-start')
})

test('an icon and a label stand on one row, with the gap from the button itself', () => {
  // Tailwind's reset gives an `<svg>` `display: block`, so without a row of its own around the
  // children the label drops onto its own line. Every caller with an icon needed the same wrapper
  // by hand; the button owns that row, and the space in it, instead.
  render(
    <Button>
      <svg aria-hidden="true" viewBox="0 0 14 14" />
      Nieuwe chat
    </Button>,
  )
  const row = screen.getByRole('button', { name: 'Nieuwe chat' }).firstElementChild
  expect(row?.className).toContain('inline-flex')
  expect(row?.className).toContain('items-center')
  expect(row?.className).toContain('gap-1.5')
})

test('a label gets a box of its own, so it can truncate instead of wrapping', () => {
  // A bare text node inside a flex row becomes an anonymous item, and `text-overflow` never
  // reaches one: measured in Chromium, such a label is clipped without an ellipsis. Wrapping the
  // text gives it a block box of its own, which is the only box an ellipsis can appear in.
  render(<Button block>Start een chat over de kassa</Button>)
  const label = screen.getByText('Start een chat over de kassa')
  expect(label.tagName).toBe('SPAN')
  expect(label.className).toContain('truncate')
  expect(label.className).toContain('min-w-0')
})

test('text inside a fragment gets no box of its own, so it cannot truncate', () => {
  // The documented limit of `withTruncatableText`: `Children.map` does not descend into a
  // fragment. Pinned rather than fixed, because the fix would mean walking the whole child tree
  // and wrapping text wherever it turns up — including inside a caller's own layout. A caller who
  // wants a truncating label passes it as a direct child.
  render(
    <Button block>
      <>Start een chat over de kassa</>
    </Button>,
  )
  expect(screen.getByText('Start een chat over de kassa').className).not.toContain('truncate')
})

test('loading: onClick does not run, aria-busy is set, the Spinner is aria-hidden and the text stays the name', async () => {
  const onClick = vi.fn()
  render(
    <Button loading onClick={onClick}>
      Verstuur
    </Button>,
  )
  const button = screen.getByRole('button', { name: 'Verstuur' })
  expect(button).toHaveAttribute('aria-busy', 'true')
  await userEvent.click(button)
  expect(onClick).not.toHaveBeenCalled()
  expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test('loading: the label stays in the DOM (only invisible through opacity), not removed', () => {
  render(<Button loading>Verstuur</Button>)
  // The accessible name already proves the label is still in the a11y tree (the test above); this
  // proves it via a visual mechanism (opacity), not visibility:hidden or display:none, which would
  // also drop it from that tree and collapse the button's width. The opacity sits on the row the
  // children stand in, one box out from the label's own truncating span.
  const label = screen.getByText('Verstuur')
  expect(label.closest('[class*="opacity-0"]')).not.toBeNull()
})

test('a button holds its width unless it is told it may give it up', () => {
  // What it really does — truncate instead of pushing its neighbours out of the row — is a matter
  // of pixels, and Orbit's end-to-end tests measure it in a 900px window. Here only the swap: both
  // classes exist, exactly one of them is emitted, and neither is assembled at runtime.
  const { rerender } = render(<Button>Ga</Button>)
  expect(screen.getByRole('button', { name: 'Ga' }).className).toContain('shrink-0')

  rerender(<Button shrink>Ga</Button>)
  const className = screen.getByRole('button', { name: 'Ga' }).className
  expect(className).not.toContain('shrink-0')
  expect(className).toContain('min-w-0')
})

test('shortcut on the primary variant draws the key on the accent, out of the accessible name', () => {
  render(
    <Button variant="primary" shortcut="Enter">
      Verstuur
    </Button>,
    { wrapper: uiWrapper() },
  )
  // The key is part of the look, not of the name: the button is still called "Verstuur".
  const button = screen.getByRole('button', { name: 'Verstuur' })
  const kbd = button.querySelector('[data-nt-kbd]')
  expect(kbd?.className).toContain('bg-accent-key')
  expect(kbd?.closest('[aria-hidden="true"]')).not.toBeNull()
  // Enter is the icon, never the glyph.
  expect(kbd?.querySelector('svg')).not.toBeNull()
  expect(button.textContent).not.toMatch(/[↵⏎↩]/)
})

test.each(['secondary', 'ghost', 'quiet', 'plain'] as const)(
  'shortcut on variant="%s" draws the key on a quiet plane of the shape of the accent one',
  (variant) => {
    // Stop's esc and Verstuur's Enter stand in the same kind of cap.
    render(
      <>
        <Button variant={variant} shortcut="Escape">
          Ga
        </Button>
        <Button variant="primary" shortcut="Enter">
          Verstuur
        </Button>
      </>,
      { wrapper: uiWrapper() },
    )
    const kbd = screen.getByRole('button', { name: 'Ga' }).querySelector('[data-nt-kbd]')
    const accent = screen.getByRole('button', { name: 'Verstuur' }).querySelector('[data-nt-kbd]')
    expect(kbd?.className).toContain('text-muted')
    expect(kbd?.className).toContain('bg-surface-hover')
    expect(kbd?.className).not.toContain('bg-accent-key')
    for (const shape of ['h-4', 'rounded-sm', 'px-1']) {
      expect(kbd?.className).toContain(shape)
      expect(accent?.className).toContain(shape)
    }
  },
)

test.each([{ 'aria-disabled': true }, { disabled: true }])(
  'a primary that cannot act yet draws as the empty Verstuur (%o)',
  (off) => {
    render(
      <Button variant="primary" {...off}>
        Opdracht maken
      </Button>,
    )
    const classes = screen.getByRole('button', { name: 'Opdracht maken' }).className.split(' ')
    // The plane and the words of `idle`, never a faded accent.
    expect(classes).toEqual(
      expect.arrayContaining([
        'aria-disabled:bg-pill',
        'aria-disabled:text-muted',
        'disabled:not-aria-busy:bg-pill',
        'disabled:not-aria-busy:text-muted',
      ]),
    )
    expect(classes).not.toContain('aria-disabled:opacity-40')
    expect(classes).not.toContain('disabled:opacity-40')
  },
)

test('a shortcut of the catalogue also becomes aria-keyshortcuts', () => {
  render(<Button shortcut="demo.new">Nieuwe chat</Button>, {
    wrapper: uiWrapper({ platform: 'mac' }),
  })
  expect(screen.getByRole('button', { name: 'Nieuwe chat' })).toHaveAttribute(
    'aria-keyshortcuts',
    'Meta+N',
  )
})

test('aria-disabled keeps the button focusable, unlike disabled', async () => {
  render(
    <Button variant="primary" aria-disabled="true" shortcut="Enter">
      Verstuur
    </Button>,
  )
  await userEvent.tab()
  expect(screen.getByRole('button', { name: 'Verstuur' })).toHaveFocus()
})

test('variant="plain" has no fill or border at rest, the text in fg, and lights up on hover', () => {
  render(<Button variant="plain">Deze chat</Button>)
  const classes = screen.getByRole('button', { name: 'Deze chat' }).className.split(' ')
  expect(classes).toEqual(expect.arrayContaining(['text-fg', 'hover:bg-surface-hover']))
  expect(classes.some((name) => name.startsWith('bg-'))).toBe(false)
  expect(classes.some((name) => name === 'border' || name.startsWith('border-'))).toBe(false)
})

test('variant="idle" is a plane of white with muted words and is not dimmed while aria-disabled', () => {
  // The empty send button: it says what it will do, in a
  // quiet plane, without the accent — and at full strength, so its words keep their contrast.
  render(
    <Button variant="idle" aria-disabled="true">
      Verstuur
    </Button>,
  )
  const classes = screen.getByRole('button', { name: 'Verstuur' }).className.split(' ')
  expect(classes).toEqual(expect.arrayContaining(['bg-pill', 'text-muted']))
  expect(classes).not.toContain('bg-accent')
  expect(classes).not.toContain('aria-disabled:opacity-40')
})

test.each(['secondary', 'ghost', 'quiet', 'plain'] as const)(
  'variant="%s" is still dimmed while aria-disabled',
  (variant) => {
    render(<Button variant={variant}>Ga</Button>)
    expect(screen.getByRole('button', { name: 'Ga' }).className.split(' ')).toContain(
      'aria-disabled:opacity-40',
    )
  },
)

test('variant="idle" draws its key as on the accent, so the button keeps its width when it lights up', () => {
  const { container } = render(
    <>
      <Button variant="idle" shortcut="Enter">
        Leeg
      </Button>
      <Button variant="primary" shortcut="Enter">
        Klaar
      </Button>
    </>,
    { wrapper: uiWrapper() },
  )
  const [idle, primary] = [...container.querySelectorAll('[data-nt-kbd]')]
  expect(idle).toBeDefined()
  expect(idle?.className).toBe(primary?.className)
})
