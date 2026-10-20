import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { StepChips } from './StepChips'

const steps = [
  { id: 'plek', label: 'Plek', state: 'done' as const, stateLabel: 'beantwoord' },
  { id: 'inhoud', label: 'Inhoud' },
  { id: 'vorm', label: 'Vorm', state: 'skipped' as const, stateLabel: 'overgeslagen' },
]

test('is a named row of tabs, the selected one the only tab stop', () => {
  render(<StepChips label="Vragen" steps={steps} selected="inhoud" onSelect={() => {}} />)
  expect(screen.getByRole('tablist', { name: 'Vragen' })).toBeInTheDocument()
  const selected = screen.getByRole('tab', { name: 'Inhoud' })
  expect(selected).toHaveAttribute('aria-selected', 'true')
  expect(selected).toHaveAttribute('tabindex', '0')
  expect(screen.getByRole('tab', { name: /Plek/ })).toHaveAttribute('tabindex', '-1')
})

test('a step that is done or skipped says so to a screen reader', () => {
  render(<StepChips label="Vragen" steps={steps} selected="inhoud" onSelect={() => {}} />)
  expect(screen.getByRole('tab', { name: 'Plek beantwoord' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Vorm overgeslagen' })).toBeInTheDocument()
})

test('a click selects a step', async () => {
  const onSelect = vi.fn()
  render(<StepChips label="Vragen" steps={steps} selected="inhoud" onSelect={onSelect} />)
  await userEvent.click(screen.getByRole('tab', { name: /Vorm/ }))
  expect(onSelect).toHaveBeenCalledWith('vorm')
})
