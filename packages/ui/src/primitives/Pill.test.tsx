import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { expect, test, vi } from 'vitest'
import { Pill, PillText } from './Pill'

test('is a 28px button of radius 999 with a white plane of 4% and the strong border', () => {
  render(<Pill>Claude Sonnet</Pill>)
  const button = screen.getByRole('button', { name: 'Claude Sonnet' })
  expect(button).toHaveAttribute('type', 'button')
  expect(button.className.split(' ')).toEqual(
    expect.arrayContaining([
      'h-(--nt-control-md)',
      'rounded-full',
      'bg-pill',
      'border',
      'border-border-strong',
      'text-[12px]',
      'font-medium',
      'text-secondary',
    ]),
  )
})

test('ends in chevrons-up-down of 12px in the faint tone, decorative', () => {
  render(<Pill>Claude Sonnet</Pill>)
  const glyphs = screen.getByRole('button').querySelectorAll('svg')
  expect(glyphs).toHaveLength(1)
  const chevron = glyphs[0]
  expect(chevron?.getAttribute('class')).toContain('lucide-chevrons-up-down')
  expect(chevron?.getAttribute('class')).toContain('size-(--nt-icon-xs)')
  expect(chevron?.getAttribute('class')).toContain('text-faint')
  expect(chevron).toHaveAttribute('aria-hidden', 'true')
})

test('an icon stands before the value at 14px, faint; no brand glyph unless asked for', () => {
  render(<Pill icon="shield">Bewerkingen</Pill>)
  const glyphs = screen.getByRole('button', { name: 'Bewerkingen' }).querySelectorAll('svg')
  expect(glyphs).toHaveLength(2)
  expect(glyphs[0]?.getAttribute('class')).toContain('lucide-shield')
  expect(glyphs[0]?.getAttribute('class')).toContain('size-(--nt-icon-sm)')
  expect(glyphs[0]?.getAttribute('class')).toContain('text-faint')
})

test('a glyph of the caller stands before the value in the place of an icon', () => {
  render(<Pill glyph={<svg data-testid="mark" aria-hidden="true" />}>Opus 5.5 · Medium</Pill>)
  const button = screen.getByRole('button', { name: 'Opus 5.5 · Medium' })
  expect(button.firstElementChild).toBe(screen.getByTestId('mark'))
})

test('a spoken value names what the glyph shows and the text leaves out', () => {
  render(
    <Pill label="Model" spoken="Claude Code · Opus 5.5 · Medium">
      Opus 5.5 · Medium
    </Pill>,
  )
  expect(
    screen.getByRole('button', { name: 'Model: Claude Code · Opus 5.5 · Medium' }),
  ).toBeInTheDocument()
})

test('a label names the pill with what it chooses and its value', () => {
  render(<Pill label="Toegang">Bewerkingen</Pill>)
  expect(screen.getByRole('button', { name: 'Toegang: Bewerkingen' })).toBeInTheDocument()
})

test('passes the props of a trigger through, so it can be the child of one (asChild)', async () => {
  // `Popover.Trigger asChild` and `DropdownMenu.Trigger asChild` hand their child a ref, handlers
  // and `aria-*`; the pill has to take all three.
  const ref = createRef<HTMLButtonElement>()
  const onClick = vi.fn()
  render(
    <Pill ref={ref} onClick={onClick} aria-expanded={false} aria-haspopup="menu">
      Claude Sonnet
    </Pill>,
  )
  const button = screen.getByRole('button', { name: 'Claude Sonnet' })
  expect(ref.current).toBe(button)
  expect(button).toHaveAttribute('aria-haspopup', 'menu')
  await userEvent.click(button)
  expect(onClick).toHaveBeenCalledOnce()
})

test('a long value truncates inside the pill', () => {
  render(<Pill>Een heel lange naam van een model dat niet past</Pill>)
  const value = screen.getByText('Een heel lange naam van een model dat niet past')
  expect(value.className).toContain('truncate')
})

test('a given className does not reach the DOM', () => {
  // @ts-expect-error className is not allowed
  render(<Pill className="rogue">Ga</Pill>)
  expect(screen.getByRole('button', { name: 'Ga' }).className).not.toContain('rogue')
})

test('quiet keeps the size and the focus ring but drops the border and the plane at rest', () => {
  // After the first message the pills step back: the same box, so nothing
  // shifts, with the plane only on hover and while the menu is open.
  render(<Pill quiet>Opus 5.5</Pill>)
  const classes = screen.getByRole('button', { name: 'Opus 5.5' }).className.split(' ')
  expect(classes).toEqual(
    expect.arrayContaining([
      'h-(--nt-control-md)',
      'rounded-full',
      'border',
      'border-transparent',
      'bg-transparent',
      'hover:bg-pill-hover',
      'aria-expanded:bg-pill-hover',
      'focus-visible:outline-2',
    ]),
  )
  expect(classes).not.toContain('border-border-strong')
  expect(classes).not.toContain('bg-pill')
})

test('PillText is the quiet pill as text: the same box, no chevron', () => {
  render(
    <PillText icon="shield" label="Toegang">
      Handmatig
    </PillText>,
  )
  const text = screen.getByText('Handmatig').parentElement as HTMLElement
  expect(text.tagName).toBe('SPAN')
  expect(text.className.split(' ')).toEqual(
    expect.arrayContaining(['h-(--nt-control-md)', 'ps-2.5', 'pe-2', 'text-[12px]', 'border']),
  )
  expect(text.querySelector('.lucide-chevrons-up-down')).toBeNull()
  expect(text).toHaveTextContent('Toegang: Handmatig')
})
