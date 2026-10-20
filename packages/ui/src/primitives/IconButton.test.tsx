import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { expect, test, vi } from 'vitest'
import { IconButton } from './IconButton'

test('label becomes the accessible name; the icon stays decorative', () => {
  render(<IconButton icon="x" label="Close" />)
  const button = screen.getByRole('button', { name: 'Close' })
  expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test('is a button by default that does not submit a form on its own', () => {
  render(<IconButton icon="x" label="Close" />)
  expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('type', 'button')
})

test.each([
  ['sm', '--nt-control-sm'],
  ['md', '--nt-control-md'],
  ['lg', '--nt-control-lg'],
] as const)('size="%s" is square: height and width from %s', (size, token) => {
  render(<IconButton icon="x" label="Close" size={size} />)
  const className = screen.getByRole('button', { name: 'Close' }).className
  expect(className).toContain(`h-(${token})`)
  expect(className).toContain(`w-(${token})`)
})

test('carries no text size: there is no visible text to scale', () => {
  render(<IconButton icon="x" label="Close" />)
  expect(screen.getByRole('button', { name: 'Close' }).className).not.toContain('text-[')
})

test('the icon follows the size: sm stays sm, the rest becomes md', () => {
  const small = render(<IconButton icon="x" label="Close" size="sm" />)
  expect(small.container.querySelector('svg')?.getAttribute('class')).toContain(
    'size-(--nt-icon-sm)',
  )
  const large = render(<IconButton icon="x" label="Close" size="lg" />)
  expect(large.container.querySelector('svg')?.getAttribute('class')).toContain(
    'size-(--nt-icon-md)',
  )
})

test('without a variant the tone is ghost: no border', () => {
  render(<IconButton icon="x" label="Close" />)
  expect(screen.getByRole('button', { name: 'Close' }).className).not.toContain('border-border')
})

test('variant="plain" rests in the foreground colour and gains only a fill on hover', () => {
  render(<IconButton icon="plus" label="Add" variant="plain" />)
  const button = screen.getByRole('button', { name: 'Add' })
  expect(button.className).toContain('text-fg')
  expect(button.className).not.toContain('text-muted')
  expect(button.className).toContain('hover:bg-surface')
  expect(button.className).not.toContain('border-border')
})

test('variant="primary" gets the accent as its background', () => {
  render(<IconButton icon="plus" label="Add" variant="primary" />)
  expect(screen.getByRole('button', { name: 'Add' }).className).toContain('bg-accent')
})

test('a tone reaches the glyph and leaves the button itself alone', () => {
  // The glyph is the whole visible content of an icon button, so colouring it colours the button
  // — without a second `text-*` class on the button that would race the one its variant sets.
  render(<IconButton icon="alert-triangle" label="Copy" tone="danger" />)
  const button = screen.getByRole('button', { name: 'Copy' })
  expect(button.querySelector('svg')?.getAttribute('class')).toContain('text-danger')
  expect(button.className).not.toContain('text-danger')
})

test('shape="round" outlined is a 28px circle in the strong border, the glyph muted', () => {
  render(<IconButton icon="plus" label="Add" shape="round" outlined />)
  const button = screen.getByRole('button', { name: 'Add' })
  const classes = button.className.split(' ')
  expect(classes).toEqual(
    expect.arrayContaining([
      'rounded-full',
      'border',
      'border-border-strong',
      'h-(--nt-control-md)',
      'w-(--nt-control-md)',
      'text-muted',
    ]),
  )
  expect(classes).not.toContain('rounded-md')
  expect(button.querySelector('svg')?.getAttribute('class')).toContain('size-(--nt-icon-md)')
})

test('without a shape it stays the square of radius md, without a border', () => {
  render(<IconButton icon="plus" label="Add" />)
  const classes = screen.getByRole('button', { name: 'Add' }).className.split(' ')
  expect(classes).toContain('rounded-md')
  expect(classes).not.toContain('rounded-full')
  expect(classes).not.toContain('border-border-strong')
})

test('carries a mark the gallery can find it by', () => {
  render(<IconButton icon="plus" label="Add" />)
  expect(screen.getByRole('button', { name: 'Add' })).toHaveAttribute('data-nt-icon-button')
})

test('disabled is not clickable', async () => {
  const onClick = vi.fn()
  render(<IconButton icon="x" label="Close" disabled onClick={onClick} />)
  await userEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClick).not.toHaveBeenCalled()
})

test('a given className does not reach the DOM', () => {
  // @ts-expect-error className is not allowed
  render(<IconButton icon="x" label="Close" className="rogue" />)
  expect(screen.getByRole('button', { name: 'Close' }).className).not.toContain('rogue')
})

test('a given style does not reach the DOM', () => {
  // @ts-expect-error style is not allowed
  render(<IconButton icon="x" label="Close" style={{ color: 'red' }} />)
  expect(screen.getByRole('button', { name: 'Close' })).not.toHaveAttribute('style')
})

test('a ref points at the native button element', () => {
  const ref = createRef<HTMLButtonElement>()
  render(<IconButton icon="x" label="Close" ref={ref} />)
  expect(ref.current).toBeInstanceOf(HTMLButtonElement)
})
