import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { FormField } from './FormField'
import { cleanOtp, OtpInput } from './OtpInput'

describe('cleanOtp', () => {
  test.each([
    ['123 456', 6, 'digits', '123456'],
    ['12-34-56-78', 6, 'digits', '123456'],
    ['ab12', 6, 'digits', '12'],
    ['ab-12', 6, 'alphanumeric', 'AB12'],
    ['', 6, 'digits', ''],
  ] as const)('%s with %i %s gives %s', (text, length, charset, expected) => {
    expect(cleanOtp(text, length, charset)).toBe(expected)
  })
})

function Code({ onComplete = vi.fn() }: { onComplete?(code: string): void }) {
  const [value, setValue] = useState('')
  return (
    <OtpInput
      label="Verificatiecode"
      value={value}
      onValueChange={setValue}
      onComplete={onComplete}
      groupAfter={3}
    />
  )
}

test('one field with one name, set up for a code from a message', () => {
  render(<Code />)
  const field = screen.getByRole('textbox', { name: 'Verificatiecode' })
  expect(field).toHaveAttribute('autocomplete', 'one-time-code')
  expect(field).toHaveAttribute('inputmode', 'numeric')
  // The boxes only draw; a screen reader meets the field alone.
  for (const box of document.querySelectorAll('[data-nt-otp-box]')) {
    expect(box).toHaveAttribute('aria-hidden', 'true')
  }
  expect(document.querySelectorAll('[data-nt-otp-box]')).toHaveLength(6)
})

test('typing fills the boxes in order and skips what is not a digit', async () => {
  render(<Code />)
  const field = screen.getByRole('textbox', { name: 'Verificatiecode' })
  await userEvent.type(field, '1a2')
  expect(field).toHaveValue('12')
  const boxes = [...document.querySelectorAll('[data-nt-otp-box]')]
  expect(boxes.map((box) => box.textContent)).toEqual(['1', '2', '', '', '', ''])
  // The third box is where the next digit goes.
  expect(boxes[2]).toHaveAttribute('data-active', 'true')
})

test('pasting a code with a space fills every box and completes once', async () => {
  const onComplete = vi.fn()
  render(<Code onComplete={onComplete} />)
  const field = screen.getByRole('textbox', { name: 'Verificatiecode' })
  field.focus()
  await userEvent.paste('482 913')
  expect(field).toHaveValue('482913')
  expect(onComplete).toHaveBeenCalledExactlyOnceWith('482913')
  await userEvent.type(field, '7')
  expect(field).toHaveValue('482913')
  expect(onComplete).toHaveBeenCalledOnce()
})

test('Backspace removes the last digit', async () => {
  render(<Code />)
  const field = screen.getByRole('textbox', { name: 'Verificatiecode' })
  await userEvent.type(field, '123{Backspace}')
  expect(field).toHaveValue('12')
})

test('FormField names it and an error marks it invalid', () => {
  render(
    <FormField label="Code" error="Deze code klopt niet.">
      {(field) => <OtpInput label="x" value="12" onValueChange={vi.fn()} {...field} />}
    </FormField>,
  )
  const input = screen.getByRole('textbox', { name: 'Code' })
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAccessibleDescription('Deze code klopt niet.')
  expect(document.querySelector('[data-nt-otp-box]')?.className).toContain('border-danger')
})
