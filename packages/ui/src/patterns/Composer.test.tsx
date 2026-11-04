import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { nl } from '../testing/labels'
import { Composer, type ComposerProps } from './Composer'

function Live({
  onSend = () => {},
  initial = '',
  ...props
}: Partial<Omit<ComposerProps, 'value' | 'onValueChange'>> & { initial?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <Composer
      labels={nl.composer}
      value={value}
      onValueChange={setValue}
      onSend={() => {
        onSend()
        setValue('')
      }}
      {...props}
    />
  )
}

test('Enter sends what was typed, and the caller clears the field', async () => {
  const onSend = vi.fn()
  render(<Live onSend={onSend} />)
  const field = screen.getByRole('textbox', { name: 'Bericht' })
  await userEvent.type(field, 'Hallo{Enter}')
  expect(onSend).toHaveBeenCalledTimes(1)
  expect(field).toHaveValue('')
})

test('Shift+Enter makes a new line instead', async () => {
  const onSend = vi.fn()
  render(<Live onSend={onSend} />)
  const field = screen.getByRole('textbox', { name: 'Bericht' })
  await userEvent.type(field, 'Een{Shift>}{Enter}{/Shift}twee')
  expect(onSend).not.toHaveBeenCalled()
  expect(field).toHaveValue('Een\ntwee')
})

test('an Enter that confirms an input method sends nothing', () => {
  const onSend = vi.fn()
  render(<Live onSend={onSend} initial="にほん" />)
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', isComposing: true })
  expect(onSend).not.toHaveBeenCalled()
})

test('an empty field cannot be sent, but the button stays a named tab stop', async () => {
  const onSend = vi.fn()
  render(<Live onSend={onSend} initial="   " />)
  const button = screen.getByRole('button', { name: 'Verstuur' })
  expect(button).toHaveAttribute('aria-disabled', 'true')
  expect(button).not.toBeDisabled()
  await userEvent.click(button)
  await userEvent.type(screen.getByRole('textbox'), '{Enter}')
  expect(onSend).not.toHaveBeenCalled()
})

test('the button sends text', async () => {
  const onSend = vi.fn()
  render(<Live onSend={onSend} initial="Zet het lage tarief erin" />)
  const button = screen.getByRole('button', { name: 'Verstuur' })
  expect(button).not.toHaveAttribute('aria-disabled')
  await userEvent.click(button)
  expect(onSend).toHaveBeenCalledTimes(1)
})

test('while an answer runs the button stops it, and Enter sends nothing', async () => {
  const onSend = vi.fn()
  const onStop = vi.fn()
  render(<Live onSend={onSend} onStop={onStop} running initial="En daarna" />)
  expect(screen.queryByRole('button', { name: 'Verstuur' })).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Stop' }))
  expect(onStop).toHaveBeenCalledTimes(1)
  await userEvent.type(screen.getByRole('textbox'), '{Enter}')
  expect(onSend).not.toHaveBeenCalled()
})

test('a reason turns the field off but keeps it a tab stop that says why', async () => {
  const onSend = vi.fn()
  render(
    <Live
      onSend={onSend}
      initial="Hallo"
      disabledReason="Kies eerst een project."
      tools={<button type="button">Model</button>}
    />,
  )
  const field = screen.getByRole('textbox', { name: 'Bericht' })
  // Not `disabled`: a disabled field leaves the tab order, and its reason is then never heard.
  expect(field).not.toBeDisabled()
  expect(field).toHaveAttribute('aria-disabled', 'true')
  expect(field).toHaveAttribute('readonly')
  expect(field).toHaveAccessibleDescription('Kies eerst een project.')
  const send = screen.getByRole('button', { name: 'Verstuur' })
  expect(send).toHaveAttribute('aria-disabled', 'true')
  expect(send).toHaveAccessibleDescription('Kies eerst een project.')
  await userEvent.click(send)
  await userEvent.type(field, '{Enter}')
  expect(onSend).not.toHaveBeenCalled()
  // The tools cannot act while the composer is off, so they leave the tab order.
  expect(screen.getByText('Model').closest('[inert]')).not.toBeNull()
})

test('Escape in the field stops a running answer', async () => {
  const onStop = vi.fn()
  render(<Live onStop={onStop} running />)
  await userEvent.type(screen.getByRole('textbox'), '{Escape}')
  expect(onStop).toHaveBeenCalledTimes(1)
})

test('a click on the plane beside the controls puts the caret in the field', async () => {
  const { container } = render(<Live />)
  const plane = container.querySelector('[data-nt-composer]')
  if (!(plane instanceof HTMLElement)) throw new Error('no plane')
  await userEvent.click(plane)
  expect(screen.getByRole('textbox')).toHaveFocus()
})

test('the tools and the footer stand where the caller put them', () => {
  render(<Live tools={<span>Opus 5.5</span>} footer={<span>webwinkel</span>} />)
  expect(screen.getByText('Opus 5.5')).toBeInTheDocument()
  expect(screen.getByText('webwinkel')).toBeInTheDocument()
})
