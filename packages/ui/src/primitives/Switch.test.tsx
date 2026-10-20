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

// The thumb was `bg-white` in both states; on the checked (cyan) track that gives a contrast of
// only 2.05. It now takes its colour from tokens, with an explicit colour for the checked state.
test('the thumb is one white knob with a hairline in both states, from tokens', () => {
  // Off used to be a dark knob on an all but invisible track, which in light read as on.
  const { container } = render(
    <Switch label="Netwerktoegang" checked={false} onCheckedChange={vi.fn()} />,
  )
  const thumb = container.querySelector('button > span')
  expect(thumb?.className).toContain('bg-accent-fg')
  expect(thumb?.className).toContain('ring-border-strong')
  expect(thumb?.className).not.toContain('bg-white')
  expect(thumb?.className).not.toContain('bg-fg')
})

test('the off track is the neutral of 3:1, the on track the accent', () => {
  const { container } = render(
    <Switch label="Netwerktoegang" checked={false} onCheckedChange={vi.fn()} />,
  )
  const track = container.querySelector('button')
  expect(track?.className).toContain('bg-border-focus')
  expect(track?.className).toContain('data-[state=checked]:bg-accent')
})

test('the thumb slides, and stands still when motion is reduced', () => {
  const { container } = render(
    <Switch label="Netwerktoegang" checked={false} onCheckedChange={vi.fn()} />,
  )
  const thumb = container.querySelector('button > span')
  expect(thumb?.className).toContain('transition-transform')
  expect(thumb?.className).toContain('duration-100')
  expect(thumb?.className).toContain('motion-reduce:transition-none')
})
