import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { CheckboxField } from './CheckboxField'

function Controlled({ onChange }: { onChange(next: boolean): void }) {
  const [checked, setChecked] = useState(false)
  return (
    <CheckboxField
      label="Ingelogd blijven"
      description="Op dit apparaat, dertig dagen."
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next)
        onChange(next)
      }}
    />
  )
}

test('the visible words name the box and the line under them describes it', () => {
  render(<Controlled onChange={vi.fn()} />)
  const box = screen.getByRole('checkbox', { name: 'Ingelogd blijven' })
  expect(box).toHaveAccessibleDescription('Op dit apparaat, dertig dagen.')
})

test('a click on the words toggles the box, once', async () => {
  const onChange = vi.fn()
  render(<Controlled onChange={onChange} />)
  await userEvent.click(screen.getByText('Ingelogd blijven'))
  expect(onChange).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('checkbox', { name: 'Ingelogd blijven' })).toBeChecked()
})

test('space on the focused box toggles it', async () => {
  const onChange = vi.fn()
  render(<Controlled onChange={onChange} />)
  await userEvent.tab()
  expect(screen.getByRole('checkbox', { name: 'Ingelogd blijven' })).toHaveFocus()
  await userEvent.keyboard(' ')
  expect(onChange).toHaveBeenCalledWith(true)
})

test('an error marks the box invalid, replaces the description and is announced', () => {
  render(
    <CheckboxField
      label="Ik ga akkoord met de voorwaarden"
      description="Lees ze eerst."
      error="Ga akkoord om door te gaan."
      required
      checked={false}
      onCheckedChange={vi.fn()}
    />,
  )
  const box = screen.getByRole('checkbox', { name: 'Ik ga akkoord met de voorwaarden' })
  expect(box).toHaveAttribute('aria-invalid', 'true')
  expect(box).toHaveAttribute('aria-required', 'true')
  expect(box).toHaveAccessibleDescription('Ga akkoord om door te gaan.')
  expect(screen.getByRole('alert')).toHaveTextContent('Ga akkoord om door te gaan.')
  expect(screen.queryByText('Lees ze eerst.')).not.toBeInTheDocument()
})

test('a disabled field does not toggle from its words', async () => {
  const onCheckedChange = vi.fn()
  render(
    <CheckboxField label="Gezien" checked={false} disabled onCheckedChange={onCheckedChange} />,
  )
  await userEvent.click(screen.getByText('Gezien'))
  expect(onCheckedChange).not.toHaveBeenCalled()
})
