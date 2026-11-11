import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { expect, test, vi } from 'vitest'
import { uiWrapper } from '../testing/ui-wrapper'
import { SearchFieldButton } from './SearchFieldButton'

test('is a button named by its placeholder, that opens what it stands for on a click', async () => {
  const onClick = vi.fn()
  render(<SearchFieldButton placeholder="Zoek of spring naar…" onClick={onClick} />)
  const button = screen.getByRole('button', { name: 'Zoek of spring naar…' })
  expect(button).toHaveAttribute('type', 'button')
  await userEvent.click(button)
  expect(onClick).toHaveBeenCalledTimes(1)
})

test('has the shape of a field: a control height, a hairline on the surface, muted words', () => {
  render(<SearchFieldButton placeholder="Zoek" />)
  const classes = screen.getByRole('button', { name: 'Zoek' }).className.split(' ')
  expect(classes).toEqual(
    expect.arrayContaining([
      'h-(--nt-control-sm)',
      'rounded-md',
      'border',
      'border-border',
      'bg-surface',
      'text-muted',
      'text-[13px]',
      'w-full',
      'min-w-0',
    ]),
  )
  // A field, not a main button: no accent, no satellite.
  expect(classes.join(' ')).not.toMatch(/\bbg-(accent|satellite)\b/)
})

test('draws the search icon before the words, decorative', () => {
  render(<SearchFieldButton placeholder="Zoek" />)
  const button = screen.getByRole('button', { name: 'Zoek' })
  const glyph = button.querySelector('svg')
  expect(glyph).not.toBeNull()
  expect(glyph?.closest('[aria-hidden="true"]') ?? glyph).toHaveAttribute('aria-hidden', 'true')
})

test('lets the placeholder lose its tail before the key', () => {
  render(<SearchFieldButton placeholder="Zoek" />)
  const words = screen.getByText('Zoek')
  expect(words.className).toContain('truncate')
  expect(words.className).toContain('flex-1')
})

test('shows its key at the end in a cap, and announces it as aria-keyshortcuts', () => {
  render(<SearchFieldButton placeholder="Zoek" shortcut="demo.open" />, {
    wrapper: uiWrapper(),
  })
  const button = screen.getByRole('button', { name: 'Zoek' })
  expect(button).toHaveAttribute('aria-keyshortcuts', 'Meta+O')
  const kbd = button.querySelector('[data-nt-kbd]')
  expect(kbd).not.toBeNull()
  expect(kbd?.className).toContain('border-border-strong')
  // The key is part of the look, never of the name.
  expect(kbd?.closest('[aria-hidden="true"]')).not.toBeNull()
  expect(button).toHaveAccessibleName('Zoek')
})

test('draws no key without a provider', () => {
  render(<SearchFieldButton placeholder="Zoek" shortcut="demo.open" />)
  const button = screen.getByRole('button', { name: 'Zoek' })
  expect(button.querySelector('[data-nt-kbd]')).toBeNull()
  expect(button).not.toHaveAttribute('aria-keyshortcuts')
})

test('takes a ref and the props of a button, and never a className', () => {
  const ref = createRef<HTMLButtonElement>()
  render(
    <SearchFieldButton
      ref={ref}
      placeholder="Zoek"
      aria-haspopup="dialog"
      {...({ className: 'bg-danger' } as object)}
    />,
  )
  const button = screen.getByRole('button', { name: 'Zoek' })
  expect(ref.current).toBe(button)
  expect(button).toHaveAttribute('aria-haspopup', 'dialog')
  expect(button.className).not.toContain('bg-danger')
})
