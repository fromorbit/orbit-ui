import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { expect, test } from 'vitest'
import { Textarea } from './Textarea'

test('is found by its label', () => {
  render(<Textarea label="Message" />)
  expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
})

test('typed text reaches the user', async () => {
  render(<Textarea label="Message" />)
  const field = screen.getByRole('textbox', { name: 'Message' })
  await userEvent.type(field, 'hello')
  expect(field).toHaveValue('hello')
})

test('starts empty at one row (default minRows)', () => {
  render(<Textarea label="Message" />)
  expect(screen.getByRole('textbox', { name: 'Message' })).toHaveAttribute('rows', '1')
})

test('minRows keeps the field at its minimum, also when empty', () => {
  render(<Textarea label="Message" minRows={3} />)
  expect(screen.getByRole('textbox', { name: 'Message' })).toHaveAttribute('rows', '3')
})

test('the number of rows follows the number of typed lines', async () => {
  render(<Textarea label="Message" />)
  const field = screen.getByRole('textbox', { name: 'Message' })
  await userEvent.type(field, 'one{Enter}two{Enter}three')
  expect(field).toHaveAttribute('rows', '3')
})

test('rows stops at maxRows instead of growing on', async () => {
  render(<Textarea label="Message" maxRows={2} />)
  const field = screen.getByRole('textbox', { name: 'Message' })
  await userEvent.type(field, 'one{Enter}two{Enter}three{Enter}four')
  expect(field).toHaveAttribute('rows', '2')
})

test('defaultValue sets the starting rows of an uncontrolled field', () => {
  render(<Textarea label="Message" defaultValue={'one\ntwo'} />)
  expect(screen.getByRole('textbox', { name: 'Message' })).toHaveAttribute('rows', '2')
})

test('a controlled field follows the value prop, also without typing', () => {
  const { rerender } = render(<Textarea label="Message" value="one" onChange={() => {}} />)
  expect(screen.getByRole('textbox', { name: 'Message' })).toHaveAttribute('rows', '1')
  rerender(<Textarea label="Message" value={'one\ntwo\nthree'} onChange={() => {}} />)
  expect(screen.getByRole('textbox', { name: 'Message' })).toHaveAttribute('rows', '3')
})

test('disabled mutes the field and it cannot be edited', () => {
  const { container } = render(<Textarea label="Message" disabled />)
  const field = screen.getByRole('textbox', { name: 'Message' })
  expect(field).toBeDisabled()
  expect(container.firstElementChild?.className).toContain('opacity-40')
})

test('focus gives the accent border and a visible focus ring', () => {
  const { container } = render(<Textarea label="Message" />)
  const className = container.firstElementChild?.className
  expect(className).toContain('focus-within:border-accent-border')
  expect(className).toContain('focus-within:outline-2')
  expect(className).toContain('focus-within:outline-offset-2')
})

test('variant="bare" leaves border, padding and focus ring to the surface around it', () => {
  // The composer draws one surface around field and toolbar; a second border and a second focus
  // ring inside it would be a box in a box.
  const { container } = render(<Textarea label="Message" variant="bare" />)
  const className = container.firstElementChild?.className ?? ''
  expect(className).not.toContain('border')
  expect(className).not.toContain('bg-surface')
  expect(className).not.toContain('focus-within:')
  expect(className).not.toContain('px-2')
})

test('a bare field does not mute itself: the surface around it does', () => {
  // Two dimmings over each other (0.6 × 0.4) leave text nobody can read.
  const { container } = render(<Textarea label="Message" variant="bare" disabled />)
  expect(screen.getByRole('textbox', { name: 'Message' })).toBeDisabled()
  expect(container.firstElementChild?.className).not.toContain('opacity-40')
})

test('without a variant the field keeps its own frame', () => {
  const { container } = render(<Textarea label="Message" />)
  expect(container.firstElementChild?.className).toContain('border-border')
})

test('a given className does not reach the DOM and does not replace the own classes', () => {
  // @ts-expect-error className is not allowed; every field looks the same
  render(<Textarea label="Message" className="rogue" />)
  const field = screen.getByRole('textbox', { name: 'Message' })
  expect(field.className).not.toContain('rogue')
  expect(field.className).toContain('outline-none')
})

test('a given style does not reach the DOM', () => {
  // @ts-expect-error style is not allowed; every field looks the same
  const { container } = render(<Textarea label="Message" style={{ color: 'red' }} />)
  expect(container.firstElementChild).not.toHaveAttribute('style')
  expect(screen.getByRole('textbox', { name: 'Message' })).not.toHaveAttribute('style')
})

test('a ref points at the native textarea element, not at the wrapper', () => {
  const ref = createRef<HTMLTextAreaElement>()
  render(<Textarea label="Message" ref={ref} />)
  expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
})
