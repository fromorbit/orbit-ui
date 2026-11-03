import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { FormField } from '../primitives/FormField'
import { UiProvider } from '../provider/UiProvider'
import { DatePicker } from './DatePicker'

const LABELS = { previousMonth: 'Vorige maand', nextMonth: 'Volgende maand' }

function Deadline({ onChange = vi.fn() }: { onChange?(day: string): void }) {
  const [value, setValue] = useState<string | null>(null)
  return (
    <UiProvider locale="nl-NL">
      <DatePicker
        label="Deadline"
        placeholder="Kies een datum"
        labels={LABELS}
        today="2026-11-03"
        value={value}
        onValueChange={(day) => {
          setValue(day)
          onChange(day)
        }}
      />
    </UiProvider>
  )
}

test('opens a calendar with the focus on today', async () => {
  render(<Deadline />)
  const trigger = screen.getByRole('button', { name: 'Deadline' })
  expect(trigger).toHaveTextContent('Kies een datum')
  await userEvent.click(trigger)
  expect(screen.getByRole('table', { name: 'november 2026' })).toBeInTheDocument()
  expect((document.activeElement as HTMLElement).dataset.day).toBe('2026-11-03')
})

test('a day chosen with the keys closes the panel and shows in the trigger', async () => {
  const onChange = vi.fn()
  render(<Deadline onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Deadline' }))
  await userEvent.keyboard('{ArrowDown}{Enter}')
  expect(onChange).toHaveBeenCalledWith('2026-11-10')
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  const trigger = screen.getByRole('button', { name: 'Deadline' })
  expect(trigger).toHaveTextContent('10 nov 2026')
  expect(trigger).toHaveFocus()
})

test('Escape closes without a choice', async () => {
  const onChange = vi.fn()
  render(<Deadline onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Deadline' }))
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  expect(onChange).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Deadline' })).toHaveFocus()
})

test('FormField names it and marks it invalid', () => {
  render(
    <FormField label="Publicatiedatum" error="Kies een datum.">
      {(field) => (
        <DatePicker
          label="x"
          placeholder="Kies"
          labels={LABELS}
          value={null}
          onValueChange={vi.fn()}
          {...field}
        />
      )}
    </FormField>,
  )
  const trigger = screen.getByRole('button', { name: 'Publicatiedatum' })
  expect(trigger).toHaveAttribute('aria-invalid', 'true')
  expect(trigger).toHaveAccessibleDescription('Kies een datum.')
})
