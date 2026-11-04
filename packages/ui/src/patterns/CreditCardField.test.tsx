import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test } from 'vitest'
import { nl } from '../testing/labels'
import { CreditCardField } from './CreditCardField'
import { type CardValue, EMPTY_CARD } from './credit-card'

const NOW = new Date(2026, 10, 3)

function Card({
  initial = EMPTY_CARD,
  showErrors = false,
}: {
  initial?: CardValue
  showErrors?: boolean
}) {
  const [value, setValue] = useState(initial)
  return (
    <CreditCardField
      value={value}
      onValueChange={setValue}
      labels={nl.creditCard}
      now={NOW}
      showErrors={showErrors}
    />
  )
}

const number = () => screen.getByRole('textbox', { name: 'Kaartnummer' })
const expiry = () => screen.getByRole('textbox', { name: 'Vervaldatum' })
const cvc = () => screen.getByRole('textbox', { name: 'Beveiligingscode' })
const name = () => screen.getByRole('textbox', { name: 'Naam op de kaart' })
const card = () => document.querySelector('[data-nt-credit-card]')

test('every field has the autocomplete of a saved card and a number keyboard', () => {
  render(<Card />)
  expect(number()).toHaveAttribute('autocomplete', 'cc-number')
  expect(number()).toHaveAttribute('inputmode', 'numeric')
  expect(expiry()).toHaveAttribute('autocomplete', 'cc-exp')
  expect(expiry()).toHaveAttribute('inputmode', 'numeric')
  expect(cvc()).toHaveAttribute('autocomplete', 'cc-csc')
  expect(cvc()).toHaveAttribute('inputmode', 'numeric')
  expect(name()).toHaveAttribute('autocomplete', 'cc-name')
  for (const field of [number(), expiry(), cvc(), name()]) expect(field).toBeRequired()
})

test('the number groups itself and names its brand', async () => {
  render(<Card />)
  await userEvent.type(number(), '378282246310005')
  expect(number()).toHaveValue('3782 822463 10005')
  expect(number()).toHaveAccessibleDescription('American Express')
  expect(cvc()).toHaveAttribute('placeholder', '0000')
})

test('a digit typed in the middle keeps the caret behind it', async () => {
  render(<Card />)
  await userEvent.type(number(), '42424242')
  const field = number() as HTMLInputElement
  // After "4242 4" (six signs): type a digit there.
  field.setSelectionRange(6, 6)
  await userEvent.type(field, '9', { initialSelectionStart: 6, initialSelectionEnd: 6 })
  expect(field).toHaveValue('4242 4924 2')
  expect(field.selectionStart).toBe(7)
})

test('the expiry writes its own slash', async () => {
  render(<Card />)
  await userEvent.type(expiry(), '1228')
  expect(expiry()).toHaveValue('12/28')
})

test('the code takes no more digits than the brand has', async () => {
  render(<Card />)
  await userEvent.type(number(), '4242')
  await userEvent.type(cvc(), '12345')
  expect(cvc()).toHaveValue('123')
})

test('a field shows its problem only once it is left, wired through FormField', async () => {
  render(<Card />)
  await userEvent.type(number(), '4242424242424241')
  expect(number()).not.toHaveAttribute('aria-invalid')
  await userEvent.tab()
  expect(number()).toHaveAttribute('aria-invalid', 'true')
  expect(number()).toHaveAccessibleDescription(/Dit kaartnummer klopt niet\./)
  expect(screen.getByRole('alert')).toHaveTextContent('Dit kaartnummer klopt niet.')
})

test('showErrors shows every problem at once', () => {
  render(<Card showErrors initial={{ number: '4242', expiry: '1026', cvc: '1', name: '' }} />)
  expect(number()).toHaveAccessibleDescription(/Vul het hele kaartnummer in\./)
  expect(expiry()).toHaveAccessibleDescription('Deze kaart is verlopen.')
  expect(cvc()).toHaveAccessibleDescription('Vul de 3 cijfers in.')
  expect(name()).toHaveAccessibleDescription('Vul de naam op de kaart in.')
})

test('a complete card shows no problem, also with showErrors', () => {
  render(
    <Card
      showErrors
      initial={{ number: '5555555555554444', expiry: '1228', cvc: '123', name: 'Noor de Vries' }}
    />,
  )
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('the picture is hidden from a screen reader and fills in as one types', async () => {
  render(<Card />)
  expect(card()).toHaveAttribute('aria-hidden', 'true')
  await userEvent.type(name(), 'Noor de Vries')
  await userEvent.type(expiry(), '0929')
  expect(card()).toHaveTextContent('Noor de Vries')
  expect(card()).toHaveTextContent('09/29')
})

test('the picture never shows more of the number than its last four digits', async () => {
  render(<Card />)
  const shown = () => document.querySelector('[data-nt-card-number]')?.textContent ?? ''
  for (const digit of '4242424242424242') {
    await userEvent.type(number(), digit)
    expect(shown().replace(/\D/g, '').length).toBeLessThanOrEqual(4)
  }
  expect(shown()).toBe('•••• •••• •••• 4242')
  // Nowhere else on the card either.
  expect(card()?.textContent).not.toContain('42424242')
})

test('the card turns over while the code has the focus', async () => {
  render(<Card />)
  expect(card()).toHaveAttribute('data-flipped', 'false')
  await userEvent.click(cvc())
  expect(card()).toHaveAttribute('data-flipped', 'true')
  await userEvent.type(cvc(), '12')
  expect(document.querySelector('[data-nt-card-cvc]')?.textContent).toBe('••·')
  await userEvent.click(name())
  expect(card()).toHaveAttribute('data-flipped', 'false')
})

test('the turn has no transition under reduced motion', () => {
  render(<Card />)
  const turning = card()?.firstElementChild
  expect(turning?.className).toContain('motion-reduce:transition-none')
})
