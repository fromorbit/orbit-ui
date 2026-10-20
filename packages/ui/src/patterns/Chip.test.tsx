import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { TooltipProvider } from '../overlays/Tooltip'
import { Chip, ChipRow } from './Chip'

/** A one-pixel PNG: enough for an `img` to have a source, nothing to look at. */
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

test('a chip names its content and opens on click', async () => {
  render(
    <Chip label="knop ‘Opslaan’ op winkel.test" image={PIXEL} panel={{ label: 'Uitsnede' }}>
      <p>Wat erin staat</p>
    </Chip>,
  )
  const chip = screen.getByRole('button', { name: 'knop ‘Opslaan’ op winkel.test' })
  // The thumbnail illustrates the name; it never adds a second one.
  expect(chip.querySelector('img')).toHaveAttribute('alt', '')
  expect(screen.queryByText('Wat erin staat')).toBeNull()
  await userEvent.click(chip)
  const panel = screen.getByRole('dialog', { name: 'Uitsnede' })
  expect(within(panel).getByText('Wat erin staat')).toBeInTheDocument()
})

test('a chip without a panel is plain text, not a button', () => {
  render(<Chip label="Schermafbeelding van winkel.test" image={PIXEL} />)
  expect(screen.getByText('Schermafbeelding van winkel.test')).toBeInTheDocument()
  expect(screen.queryByRole('button')).toBeNull()
})

test('a chip with onOpen is a button that does something else instead of opening a popover', async () => {
  const onOpen = vi.fn()
  render(<Chip label="Expert · Architect" onOpen={onOpen} />)
  await userEvent.click(screen.getByRole('button', { name: 'Expert · Architect' }))
  expect(onOpen).toHaveBeenCalledOnce()
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('the cross removes the chip and carries its own name', async () => {
  const onRemove = vi.fn()
  render(
    <Chip
      label="Gebied op winkel.test"
      remove={{ label: 'Haal weg: Gebied op winkel.test', onRemove }}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Haal weg: Gebied op winkel.test' }))
  expect(onRemove).toHaveBeenCalledOnce()
})

test('a chip row wraps and keeps its order', () => {
  render(
    <ChipRow label="Bijlagen">
      <Chip label="een" />
      <Chip label="twee" />
      <Chip label="drie" />
    </ChipRow>,
  )
  const row = screen.getByRole('list', { name: 'Bijlagen' })
  expect(row.className).toContain('flex-wrap')
  expect(
    within(row)
      .getAllByRole('listitem')
      .map((item) => item.textContent),
  ).toEqual(['een', 'twee', 'drie'])
})

test('a numbered chip starts its name with the number', () => {
  render(
    <Chip
      label="knop ‘Opslaan’ op winkel.test"
      number={{ value: 2, label: 'Aanwijzing 2 van 3' }}
      panel={{ label: 'Aanwijzing 2 van 3' }}
    />,
  )
  const chip = screen.getByRole('button', {
    name: 'Aanwijzing 2 van 3: knop ‘Opslaan’ op winkel.test',
  })
  // The eye gets the digit alone, small before the words; the full phrase is for the ear.
  const digit = chip.querySelector('[data-nt-chip-number]')
  expect(digit).toHaveTextContent(/^2$/)
  expect(digit).toHaveAttribute('aria-hidden', 'true')
})

test('a mark is a dimmed icon that explains itself in a tooltip', async () => {
  render(
    <TooltipProvider delayDuration={0}>
      <Chip
        label="knop ‘Opslaan’ op winkel.test"
        mark={{ icon: 'sliders-horizontal', label: '2 aanpassingen' }}
        panel={{ label: 'Uitsnede' }}
      />
    </TooltipProvider>,
  )
  const chip = screen.getByRole('button', { name: 'knop ‘Opslaan’ op winkel.test' })
  const mark = chip.querySelector('[data-nt-chip-mark]')
  expect(mark).not.toBeNull()
  expect(mark?.getAttribute('class')).toContain('text-muted')
  act(() => chip.focus())
  expect(await screen.findByRole('tooltip')).toHaveTextContent('2 aanpassingen')
  expect(chip).toHaveAccessibleDescription('2 aanpassingen')
})

test('a chip can carry an icon before its words', () => {
  render(<Chip label="totaal.ts" icon={<svg data-testid="type-icon" aria-hidden="true" />} />)
  const icon = screen.getByTestId('type-icon')
  const words = screen.getByText('totaal.ts')
  // Before the words, in the same chip.
  expect(icon.compareDocumentPosition(words) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

test('the cross shows its name as a tooltip on focus', async () => {
  render(<Chip label="Gebied op winkel.test" remove={{ label: 'Haal weg', onRemove: () => {} }} />)
  screen.getByRole('button', { name: 'Haal weg' }).focus()
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Haal weg')
})

test('a small chip is 24px with a 16px thumbnail and its cross only on hover or focus', () => {
  // The chips above the composer: a row of five crosses
  // read as five errors, so the cross waits for the pointer or the keyboard.
  render(
    <TooltipProvider>
      <Chip
        size="sm"
        label="schets.png"
        image={PIXEL}
        remove={{ label: 'Haal weg: schets.png', onRemove: () => {} }}
      />
    </TooltipProvider>,
  )
  const frame = document.querySelector('[data-nt-chip]') as HTMLElement
  expect(frame.className).toContain('h-(--nt-control-sm)')
  expect(frame.querySelector('img')?.getAttribute('class')).toContain('size-4')
  const cross = screen.getByRole('button', { name: 'Haal weg: schets.png' })
  const holder = cross.closest('[data-nt-chip-remove]') as HTMLElement
  expect(holder.className).toContain('opacity-0')
  expect(holder.className).toContain('group-hover/chip:opacity-100')
  expect(holder.className).toContain('group-focus-within/chip:opacity-100')
})

test('a chip keeps its size and its cross by default', () => {
  render(
    <TooltipProvider>
      <Chip label="schets.png" remove={{ label: 'Haal weg', onRemove: () => {} }} />
    </TooltipProvider>,
  )
  const frame = document.querySelector('[data-nt-chip]') as HTMLElement
  expect(frame.className).toContain('h-(--nt-control-md)')
  expect(document.querySelector('[data-nt-chip-remove]')?.className ?? '').not.toContain(
    'opacity-0',
  )
})
