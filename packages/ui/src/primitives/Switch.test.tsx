import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { Switch } from './Switch'

test('has role switch with its label as its accessible name', () => {
  render(<Switch label="Netwerktoegang" checked={false} onCheckedChange={vi.fn()} />)
  expect(screen.getByRole('switch', { name: 'Netwerktoegang' })).toBeInTheDocument()
})

test('toggles with the space bar', async () => {
  const onCheckedChange = vi.fn()
  render(<Switch label="Netwerktoegang" checked={false} onCheckedChange={onCheckedChange} />)
  const control = screen.getByRole('switch', { name: 'Netwerktoegang' })
  control.focus()
  await userEvent.keyboard(' ')
  expect(onCheckedChange).toHaveBeenCalledWith(true)
})

test('checked sets the aria state', () => {
  render(<Switch label="Netwerktoegang" checked={true} onCheckedChange={vi.fn()} />)
  expect(screen.getByRole('switch', { name: 'Netwerktoegang' })).toBeChecked()
})

test('disabled cannot be operated', async () => {
  const onCheckedChange = vi.fn()
  render(
    <Switch label="Netwerktoegang" checked={false} disabled onCheckedChange={onCheckedChange} />,
  )
  const control = screen.getByRole('switch', { name: 'Netwerktoegang' })
  await userEvent.click(control)
  expect(onCheckedChange).not.toHaveBeenCalled()
})

test('aria-labelledby wins over the label prop for the accessible name (Field supplies the visible label)', () => {
  render(
    <div>
      <span id="visible-label">Netwerktoegang</span>
      <Switch
        label="decoy"
        aria-labelledby="visible-label"
        checked={false}
        onCheckedChange={vi.fn()}
      />
    </div>,
  )
  expect(screen.getByRole('switch', { name: 'Netwerktoegang' })).toBeInTheDocument()
})

test('aria-describedby lands on the switch', () => {
  render(
    <div>
      <span id="hint">Uitleg over deze schakelaar.</span>
      <Switch
        label="Netwerktoegang"
        aria-describedby="hint"
        checked={false}
        onCheckedChange={vi.fn()}
      />
    </div>,
  )
  expect(screen.getByRole('switch')).toHaveAccessibleDescription('Uitleg over deze schakelaar.')
})

/** The track and the thumb of a rendered switch. */
function parts(checked: boolean): { track: string; thumb: string } {
  const { container } = render(
    <Switch label="Netwerktoegang" checked={checked} onCheckedChange={vi.fn()} />,
  )
  return {
    track: container.querySelector('button')?.className ?? '',
    thumb: container.querySelector('button > span')?.className ?? '',
  }
}

// These replace "one white knob with a hairline in both states" and "the off track is the neutral
// of 3:1": the family draws off as an outline. The edge of an empty box (`control-border`) holds
// 3:1 on every plane and the muted thumb does too (`tokens.test.ts`), so the off state keeps the
// requirement of WCAG 1.4.11 that the filled `border-focus` track met.
test('off is an outlined track with a muted thumb, the edge of an empty box', () => {
  const { track, thumb } = parts(false)
  expect(track.split(' ')).toEqual(
    expect.arrayContaining(['border-[1.5px]', 'border-control-border', 'bg-transparent']),
  )
  expect(track).not.toContain('bg-border-focus')
  expect(thumb.split(' ')).toEqual(expect.arrayContaining(['size-[11px]', 'bg-muted']))
  expect(thumb).not.toContain('ring-')
})

test('on is the accent fill with a thumb in the colour of its words', () => {
  const { track, thumb } = parts(true)
  expect(track.split(' ')).toEqual(
    expect.arrayContaining([
      'data-[state=checked]:bg-accent',
      'data-[state=checked]:border-accent',
    ]),
  )
  expect(thumb.split(' ')).toEqual(
    expect.arrayContaining([
      'data-[state=checked]:bg-accent-fg',
      'data-[state=checked]:translate-x-4',
    ]),
  )
})

test('carries its state on the track and the thumb, and dims at 40% when disabled', () => {
  // The `data-[state=checked]:` classes only take hold if Radix puts the state on both parts.
  const { container, rerender } = render(
    <Switch label="Netwerktoegang" checked onCheckedChange={vi.fn()} />,
  )
  const track = container.querySelector('button')
  const thumb = container.querySelector('button > span')
  expect(track).toHaveAttribute('data-state', 'checked')
  expect(thumb).toHaveAttribute('data-state', 'checked')
  rerender(<Switch label="Netwerktoegang" checked={false} disabled onCheckedChange={vi.fn()} />)
  expect(track).toHaveAttribute('data-state', 'unchecked')
  expect(thumb).toHaveAttribute('data-state', 'unchecked')
  expect(track?.className.split(' ')).toContain('disabled:opacity-40')
})

test('never takes the violet of a link or the satellite of a product', () => {
  const { track, thumb } = parts(true)
  // Every colour class of the track and the thumb; the focus ring (`outline-focus`) is the one
  // violet every control shares, and is not the switch's own colour.
  const colours = `${track} ${thumb}`
    .split(' ')
    .filter((name) => /(^|:)(bg|border|ring|fill|text)-/.test(name))
  expect(colours.length).toBeGreaterThan(0)
  for (const name of colours) {
    expect(name).not.toMatch(/accent-text|accent-subtle|satellite|violet|brand|focus|kind-/)
  }
})

test('the thumb slides, and stands still when motion is reduced', () => {
  const { container } = render(
    <Switch label="Netwerktoegang" checked={false} onCheckedChange={vi.fn()} />,
  )
  const thumb = container.querySelector('button > span')
  expect(thumb?.className).toContain('transition-transform')
  expect(thumb?.className).toContain('duration-(--nt-duration-fast)')
  expect(thumb?.className).toContain('motion-reduce:transition-none')
})

test('a pseudo-element makes the hit area 24px high without growing the 32x18 track', () => {
  // The track has a 1.5px edge, so its padding box is 29 by 15: 2px out on either side and 4.5px
  // above and below make 33 by 24. Neither size depends on the density.
  render(<Switch label="Netwerktoegang" checked={false} onCheckedChange={() => {}} />)
  const classes = screen.getByRole('switch', { name: 'Netwerktoegang' }).className.split(' ')
  expect(classes).toEqual(
    expect.arrayContaining([
      'relative',
      'h-[18px]',
      'w-8',
      'before:absolute',
      'before:-inset-x-0.5',
      'before:-inset-y-[4.5px]',
      "before:content-['']",
    ]),
  )
})
