import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { Button } from './Button'
import { Form } from './Form'
import { FormField } from './FormField'
import { Input } from './Input'

/** A sign-in form whose check says both fields are wrong when empty. */
function SignIn({ onValid }: { onValid(): void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<{ email?: string; name?: string }>({})
  return (
    <Form
      label="Aanmelden"
      onSubmit={() => {
        const next = {
          ...(name === '' ? { name: 'Vul je naam in.' } : {}),
          ...(email.includes('@') ? {} : { email: 'Vul een geldig adres in.' }),
        }
        setErrors(next)
        if (Object.keys(next).length === 0) onValid()
      }}
      actions={<Button type="submit">Aanmelden</Button>}
    >
      <FormField label="Naam" {...(errors.name ? { error: errors.name } : {})}>
        {(field) => (
          <Input label="x" value={name} onChange={(e) => setName(e.target.value)} {...field} />
        )}
      </FormField>
      <FormField label="E-mailadres" {...(errors.email ? { error: errors.email } : {})}>
        {(field) => (
          <Input label="x" value={email} onChange={(e) => setEmail(e.target.value)} {...field} />
        )}
      </FormField>
    </Form>
  )
}

test('a submit with errors moves the focus to the first invalid field', async () => {
  const onValid = vi.fn()
  render(<SignIn onValid={onValid} />)
  await userEvent.type(screen.getByRole('textbox', { name: 'Naam' }), 'Noor')
  await userEvent.click(screen.getByRole('button', { name: 'Aanmelden' }))
  expect(onValid).not.toHaveBeenCalled()
  expect(screen.getByRole('textbox', { name: 'E-mailadres' })).toHaveFocus()
  expect(screen.getByRole('alert')).toHaveTextContent('Vul een geldig adres in.')
})

test('Enter in a field submits; a valid form keeps the focus where it was', async () => {
  const onValid = vi.fn()
  render(<SignIn onValid={onValid} />)
  await userEvent.type(screen.getByRole('textbox', { name: 'Naam' }), 'Noor')
  const email = screen.getByRole('textbox', { name: 'E-mailadres' })
  await userEvent.type(email, 'noor@example.org{Enter}')
  expect(onValid).toHaveBeenCalledOnce()
  expect(email).toHaveFocus()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('the form is named and switches the browser checks off', () => {
  render(<SignIn onValid={vi.fn()} />)
  const form = screen.getByRole('form', { name: 'Aanmelden' })
  expect(form).toHaveAttribute('novalidate')
  expect(form).not.toHaveAttribute('aria-busy')
})

test('busy says so to a screen reader', () => {
  render(
    <Form onSubmit={vi.fn()} label="Opslaan" busy>
      <span>veld</span>
    </Form>,
  )
  expect(screen.getByRole('form', { name: 'Opslaan' })).toHaveAttribute('aria-busy', 'true')
})
