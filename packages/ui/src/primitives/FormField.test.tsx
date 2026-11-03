import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { FormField } from './FormField'
import { Input } from './Input'
import { Select } from './Select'
import { Textarea } from './Textarea'

test('the visible label names the control, over its own label', () => {
  render(<FormField label="E-mailadres">{(field) => <Input label="decoy" {...field} />}</FormField>)
  expect(screen.getByRole('textbox', { name: 'E-mailadres' })).toBeInTheDocument()
  expect(screen.queryByRole('textbox', { name: 'decoy' })).not.toBeInTheDocument()
})

test('a click on the label focuses the control', async () => {
  render(<FormField label="E-mailadres">{(field) => <Input label="x" {...field} />}</FormField>)
  await userEvent.click(screen.getByText('E-mailadres'))
  expect(screen.getByRole('textbox', { name: 'E-mailadres' })).toHaveFocus()
})

test('the description describes the control', () => {
  render(
    <FormField label="Naam" description="Zoals je collega's je kennen.">
      {(field) => <Input label="x" {...field} />}
    </FormField>,
  )
  const control = screen.getByRole('textbox', { name: 'Naam' })
  expect(control).toHaveAccessibleDescription("Zoals je collega's je kennen.")
  expect(control).not.toHaveAttribute('aria-invalid')
})

test('an error replaces the description, is announced and marks the control invalid', () => {
  render(
    <FormField label="E-mailadres" description="Je werkadres." error="Vul een geldig adres in.">
      {(field) => <Input label="x" {...field} />}
    </FormField>,
  )
  const control = screen.getByRole('textbox', { name: 'E-mailadres' })
  expect(control).toHaveAttribute('aria-invalid', 'true')
  expect(control).toHaveAccessibleDescription('Vul een geldig adres in.')
  expect(screen.getByRole('alert')).toHaveTextContent('Vul een geldig adres in.')
  expect(screen.queryByText('Je werkadres.')).not.toBeInTheDocument()
})

test('a blank error is no error', () => {
  render(
    <FormField label="Naam" error="  ">
      {(field) => <Input label="x" {...field} />}
    </FormField>,
  )
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  const control = screen.getByRole('textbox', { name: 'Naam' })
  expect(control).not.toHaveAttribute('aria-invalid')
  expect(control).not.toHaveAttribute('aria-describedby')
})

test('required marks the control; optionalLabel shows only on an optional field', () => {
  const { rerender } = render(
    <FormField label="Naam" required optionalLabel="optioneel">
      {(field) => <Input label="x" {...field} />}
    </FormField>,
  )
  expect(screen.getByRole('textbox', { name: 'Naam' })).toBeRequired()
  expect(screen.queryByText('optioneel')).not.toBeInTheDocument()
  rerender(
    <FormField label="Naam" optionalLabel="optioneel">
      {(field) => <Input label="x" {...field} />}
    </FormField>,
  )
  expect(screen.getByText('optioneel')).toHaveAttribute('aria-hidden', 'true')
  // The hidden word stays out of the name.
  expect(screen.getByRole('textbox', { name: 'Naam' })).not.toBeRequired()
})

test('wires a Textarea and a Select the same way', () => {
  render(
    <>
      <FormField label="Toelichting" error="Te kort.">
        {(field) => <Textarea label="x" {...field} />}
      </FormField>
      <FormField label="Rol" error="Kies een rol.">
        {(field) => (
          <Select
            label="x"
            value="lid"
            options={[{ value: 'lid', label: 'Lid' }]}
            onValueChange={vi.fn()}
            {...field}
          />
        )}
      </FormField>
    </>,
  )
  expect(screen.getByRole('textbox', { name: 'Toelichting' })).toHaveAccessibleDescription(
    'Te kort.',
  )
  const select = screen.getByRole('combobox', { name: 'Rol' })
  expect(select).toHaveAttribute('aria-invalid', 'true')
  expect(select.className).toContain('border-danger')
})

test('aside stands beside the label and stays out of the name', () => {
  render(
    <FormField label="Wachtwoord" aside={<a href="#vergeten">Vergeten?</a>}>
      {(field) => <Input label="x" type="password" {...field} />}
    </FormField>,
  )
  expect(screen.getByRole('link', { name: 'Vergeten?' })).toBeInTheDocument()
  expect(screen.getByLabelText('Wachtwoord')).toHaveAttribute('type', 'password')
})
