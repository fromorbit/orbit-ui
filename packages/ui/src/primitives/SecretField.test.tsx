import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { SecretField } from './SecretField'

/** The words of the field, as a host gives them. */
const LABELS = {
  set: 'Ingesteld',
  unset: 'Niet ingesteld',
  show: 'Toon wat je typt',
  clear: 'Wissen',
}

function field(): HTMLInputElement {
  return screen.getByLabelText('API-sleutel', { selector: 'input' }) as HTMLInputElement
}

test('the field is a password field that starts empty and says whether a value is set', () => {
  const { rerender } = render(
    <SecretField label="API-sleutel" labels={LABELS} isSet={false} onSave={() => undefined} />,
  )
  expect(field()).toHaveAttribute('type', 'password')
  expect(field()).toHaveValue('')
  expect(field()).toHaveAttribute('placeholder', 'Niet ingesteld')
  rerender(<SecretField label="API-sleutel" labels={LABELS} isSet onSave={() => undefined} />)
  expect(field()).toHaveValue('')
  // A stored key looks like a filled password field: a fixed row of dots, never its length, and
  // the word for a screen reader, which reads no placeholder of dots.
  expect(field()).toHaveAttribute('placeholder', '••••••••••••')
  expect(field()).toHaveAccessibleDescription('Ingesteld')
})

test('a set value draws its dots as text, and gives them up to the caret', async () => {
  render(<SecretField label="API-sleutel" labels={LABELS} isSet onSave={() => undefined} />)
  expect(field().className).toContain('placeholder:text-fg')
  await userEvent.click(field())
  expect(field()).toHaveAttribute('placeholder', '')
})

test('Enter saves what was typed, trimmed, and empties the field', async () => {
  const onSave = vi.fn()
  render(<SecretField label="API-sleutel" labels={LABELS} isSet={false} onSave={onSave} />)
  await userEvent.type(field(), '  geheim-123 {Enter}')
  expect(onSave).toHaveBeenCalledWith('geheim-123')
  expect(field()).toHaveValue('')
})

test('leaving the field saves too, without a button of its own', async () => {
  const onSave = vi.fn()
  render(<SecretField label="API-sleutel" labels={LABELS} isSet={false} onSave={onSave} />)
  await userEvent.type(field(), 'geheim')
  await userEvent.click(document.body)
  expect(onSave).toHaveBeenCalledWith('geheim')
  expect(screen.queryByRole('button', { name: /opslaan/i })).toBeNull()
})

test('an empty field saves nothing', async () => {
  const onSave = vi.fn()
  render(<SecretField label="API-sleutel" labels={LABELS} isSet onSave={onSave} />)
  await userEvent.type(field(), '   {Enter}')
  await userEvent.tab()
  expect(onSave).not.toHaveBeenCalled()
})

test('a refused value is not kept on screen either', async () => {
  const onSave = vi.fn(async () => 'Ongeldige sleutel')
  render(<SecretField label="API-sleutel" labels={LABELS} isSet={false} onSave={onSave} />)
  await userEvent.type(field(), 'fout{Enter}')
  expect(onSave).toHaveBeenCalledOnce()
  expect(field()).toHaveValue('')
})

test('the eye shows what is being typed and hides it again', async () => {
  render(<SecretField label="API-sleutel" labels={LABELS} isSet={false} onSave={() => undefined} />)
  const eye = screen.getByRole('button', { name: 'Toon wat je typt' })
  expect(eye).toHaveAttribute('aria-pressed', 'false')
  await userEvent.click(eye)
  expect(field()).toHaveAttribute('type', 'text')
  expect(eye).toHaveAttribute('aria-pressed', 'true')
  await userEvent.click(eye)
  expect(field()).toHaveAttribute('type', 'password')
})

test('tabbing to the eye does not save a half-typed value; leaving the field does', async () => {
  const onSave = vi.fn()
  render(<SecretField label="API-sleutel" labels={LABELS} isSet={false} onSave={onSave} />)
  await userEvent.type(field(), 'half')
  await userEvent.tab()
  expect(screen.getByRole('button', { name: 'Toon wat je typt' })).toHaveFocus()
  expect(onSave).not.toHaveBeenCalled()
  await userEvent.tab()
  expect(onSave).toHaveBeenCalledWith('half')
})

test('switching to another app does not save a half-typed value', async () => {
  const onSave = vi.fn()
  render(<SecretField label="API-sleutel" labels={LABELS} isSet={false} onSave={onSave} />)
  await userEvent.type(field(), 'half')
  // The window losing focus blurs the field with no element to go to; the document has no focus.
  const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(false)
  try {
    fireEvent.blur(field(), { relatedTarget: null })
  } finally {
    hasFocus.mockRestore()
  }
  expect(onSave).not.toHaveBeenCalled()
  expect(field()).toHaveValue('half')
})

test('pressing the eye does not save a half-typed value', async () => {
  const onSave = vi.fn()
  render(<SecretField label="API-sleutel" labels={LABELS} isSet={false} onSave={onSave} />)
  await userEvent.type(field(), 'half')
  await userEvent.click(screen.getByRole('button', { name: 'Toon wat je typt' }))
  expect(onSave).not.toHaveBeenCalled()
  expect(field()).toHaveValue('half')
})

test('a set value can be cleared, and the focus returns to the field', async () => {
  const onClear = vi.fn()
  render(
    <SecretField
      label="API-sleutel"
      labels={LABELS}
      isSet
      onSave={() => undefined}
      onClear={onClear}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Wissen' }))
  expect(onClear).toHaveBeenCalledOnce()
  expect(field()).toHaveFocus()
})

test('nothing set means nothing to clear', () => {
  render(
    <SecretField
      label="API-sleutel"
      labels={LABELS}
      isSet={false}
      onSave={() => undefined}
      onClear={vi.fn()}
    />,
  )
  expect(screen.queryByRole('button', { name: 'Wissen' })).toBeNull()
})

test('disabled turns the field and its buttons off', () => {
  render(
    <SecretField
      label="API-sleutel"
      labels={LABELS}
      isSet
      disabled
      onSave={() => undefined}
      onClear={vi.fn()}
    />,
  )
  expect(field()).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Wissen' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Toon wat je typt' })).toBeDisabled()
})

test('the ids of a row reach the field', () => {
  render(
    <>
      <span id="rij">Sleutel van Kompas</span>
      <span id="uitleg">Voor het beslismodel</span>
      <SecretField
        label="API-sleutel"
        labels={LABELS}
        aria-labelledby="rij"
        aria-describedby="uitleg"
        isSet={false}
        onSave={() => undefined}
      />
    </>,
  )
  // A password field has no ARIA role, so it is found by its (labelledby) name instead.
  const input = screen.getByLabelText('Sleutel van Kompas', { selector: 'input' })
  expect(input).toHaveAccessibleDescription('Voor het beslismodel')
})
