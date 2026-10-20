import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import { expect, test, vi } from 'vitest'
import { Input } from './Input'

test('is found by its label, also without a visible label', () => {
  render(<Input label="Zoeken" />)
  expect(screen.getByRole('textbox', { name: 'Zoeken' })).toBeInTheDocument()
})

test('typed text reaches the user', async () => {
  render(<Input label="Zoeken" />)
  const field = screen.getByRole('textbox', { name: 'Zoeken' })
  await userEvent.type(field, 'agent')
  expect(field).toHaveValue('agent')
})

test('without size the size is md', () => {
  const { container } = render(<Input label="Zoeken" />)
  expect(container.firstElementChild?.className).toContain('h-(--nt-control-md)')
})

test.each([
  ['sm', 'h-(--nt-control-sm)'],
  ['md', 'h-(--nt-control-md)'],
  ['lg', 'h-(--nt-control-lg)'],
] as const)('size="%s" gives %s', (size, expected) => {
  const { container } = render(<Input label="Zoeken" size={size} />)
  expect(container.firstElementChild?.className).toContain(expected)
})

test('with icon the icon stands before it and is decorative', () => {
  const { container } = render(<Input label="Zoeken" icon="search" />)
  const wrapper = container.firstElementChild
  const svg = wrapper?.querySelector('svg')
  expect(svg).toHaveAttribute('aria-hidden', 'true')
  // The icon is the wrapper's first element, before the input.
  expect(wrapper?.firstElementChild?.tagName).toBe('svg')
})

test('the icon follows the size of the field: sm gives the small icon token', () => {
  const { container } = render(<Input label="Zoeken" icon="search" size="sm" />)
  expect(container.querySelector('svg')?.getAttribute('class')).toContain('size-(--nt-icon-sm)')
})

test.each(['md', 'lg'] as const)(
  'the icon follows the size of the field: size="%s" gives the middle icon token',
  (size) => {
    const { container } = render(<Input label="Zoeken" icon="search" size={size} />)
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('size-(--nt-icon-md)')
  },
)

test('without icon there is no svg in the DOM', () => {
  const { container } = render(<Input label="Zoeken" />)
  expect(container.querySelector('svg')).toBeNull()
})

test('focus gives the accent border and a visible focus ring', () => {
  const { container } = render(<Input label="Zoeken" />)
  const className = container.firstElementChild?.className
  expect(className).toContain('focus-within:border-accent-border')
  expect(className).toContain('focus-within:outline-2')
  expect(className).toContain('focus-within:outline-offset-2')
})

test('bare drops the frame and the ring with it, and keeps the size', () => {
  // For a field inside a panel: the panel is the frame, and the caret is what a text field shows
  // focus with. A second ring there put two cyan boxes on screen at once. Which of the two really
  // paints is measured in the gallery; this pins that no frame class is emitted at all.
  const { container } = render(<Input label="Zoeken" variant="bare" />)
  const className = container.firstElementChild?.className ?? ''
  for (const frame of ['border-border', 'bg-surface', 'outline-focus', 'accent']) {
    expect(className, frame).not.toContain(frame)
  }
  expect(className).toContain('h-(--nt-control-md)')
})

test('without a variant the field brings its own frame', () => {
  const { container } = render(<Input label="Zoeken" />)
  expect(container.firstElementChild?.className).toContain('border-border')
})

test('disabled mutes the field and it cannot be edited', async () => {
  const { container } = render(<Input label="Zoeken" disabled />)
  const field = screen.getByRole('textbox', { name: 'Zoeken' })
  expect(field).toBeDisabled()
  expect(container.firstElementChild?.className).toContain('opacity-40')
})

test('a given className does not reach the DOM and does not replace the own classes', () => {
  // @ts-expect-error className is not allowed; every field looks the same
  render(<Input label="Zoeken" className="rogue" />)
  const field = screen.getByRole('textbox', { name: 'Zoeken' })
  expect(field.className).not.toContain('rogue')
  expect(field.className).toContain('outline-none')
})

test('a given style does not reach the DOM', () => {
  // @ts-expect-error style is not allowed; every field looks the same
  const { container } = render(<Input label="Zoeken" style={{ color: 'red' }} />)
  expect(container.firstElementChild).not.toHaveAttribute('style')
  expect(screen.getByRole('textbox', { name: 'Zoeken' })).not.toHaveAttribute('style')
})

test('a ref points at the native input element, not at the wrapper', () => {
  const ref = createRef<HTMLInputElement>()
  render(<Input label="Zoeken" ref={ref} />)
  expect(ref.current).toBeInstanceOf(HTMLInputElement)
})

test('a ref still reaches the input of a field with a clearLabel', () => {
  const ref = createRef<HTMLInputElement>()
  render(<Input label="Zoeken" clearLabel="Wissen" ref={ref} />)
  expect(ref.current).toBeInstanceOf(HTMLInputElement)
})

test('a clearLabel shows no cross while the field is empty', () => {
  render(<Input label="Zoeken" clearLabel="Wissen" value="" onChange={() => undefined} />)
  expect(screen.queryByRole('button', { name: 'Wissen' })).toBeNull()
})

test('a clearLabel empties a controlled field through its own onChange and keeps the focus', async () => {
  function Controlled() {
    const [value, setValue] = useState('agent')
    return (
      <Input
        label="Zoeken"
        icon="search"
        clearLabel="Wissen"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    )
  }
  render(<Controlled />)
  const field = screen.getByRole('textbox', { name: 'Zoeken' })
  await userEvent.click(screen.getByRole('button', { name: 'Wissen' }))
  expect(field).toHaveValue('')
  expect(field).toHaveFocus()
  expect(screen.queryByRole('button', { name: 'Wissen' })).toBeNull()
})

test('a clearLabel also empties an uncontrolled field and calls onClear', async () => {
  const onClear = vi.fn()
  render(<Input label="Zoeken" clearLabel="Wissen" defaultValue="agent" onClear={onClear} />)
  const field = screen.getByRole('textbox', { name: 'Zoeken' })
  await userEvent.click(screen.getByRole('button', { name: 'Wissen' }))
  expect(field).toHaveValue('')
  expect(onClear).toHaveBeenCalledOnce()
  // Typing again brings the cross back.
  await userEvent.type(field, 'a')
  expect(screen.getByRole('button', { name: 'Wissen' })).toBeInTheDocument()
})

test('without a clearLabel there is no cross', () => {
  render(<Input label="Zoeken" defaultValue="agent" />)
  expect(screen.queryByRole('button')).toBeNull()
})

test('a disabled field with a clearLabel offers no cross', () => {
  render(<Input label="Zoeken" clearLabel="Wissen" disabled defaultValue="agent" />)
  expect(screen.queryByRole('button', { name: 'Wissen' })).toBeNull()
})

test('trailing content stands inside the frame, after the text', () => {
  const { container } = render(<Input label="Sleutel" trailing={<span data-testid="end" />} />)
  expect(container.firstElementChild?.lastElementChild).toBe(screen.getByTestId('end'))
})
