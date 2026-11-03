import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { UiProvider } from '../provider/UiProvider'
import { addDays, addMonths, Calendar, isIsoDate, monthGrid } from './Calendar'

const LABELS = { previousMonth: 'Vorige maand', nextMonth: 'Volgende maand' }

describe('the date arithmetic', () => {
  test('adds days across a month and a change of summer time', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  test('a month later is the last day of a shorter month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29')
    expect(addMonths('2026-11-03', -12)).toBe('2025-11-03')
  })

  test('the grid is six weeks from the Monday before the first', () => {
    const grid = monthGrid('2026-11-17', 1)
    expect(grid).toHaveLength(6)
    expect(grid[0]?.[0]).toBe('2026-10-26')
    expect(grid[5]?.[6]).toBe('2026-12-06')
    expect(monthGrid('2026-11-17', 0)[0]?.[0]).toBe('2026-11-01')
  })

  test('knows a real day', () => {
    expect(isIsoDate('2026-02-28')).toBe(true)
    expect(isIsoDate('2026-02-30')).toBe(false)
    expect(isIsoDate('3-11-2026')).toBe(false)
  })
})

function Picker({ onChange = vi.fn(), min }: { onChange?(day: string): void; min?: string }) {
  const [value, setValue] = useState<string | null>('2026-11-03')
  return (
    <UiProvider locale="nl-NL">
      <Calendar
        value={value}
        today="2026-11-03"
        labels={LABELS}
        {...(min ? { min } : {})}
        onValueChange={(day) => {
          setValue(day)
          onChange(day)
        }}
      />
    </UiProvider>
  )
}

const focusedDay = () => (document.activeElement as HTMLElement | null)?.dataset.day

test('names the month and every day in the locale', () => {
  render(<Picker />)
  expect(screen.getByRole('table', { name: 'november 2026' })).toBeInTheDocument()
  const today = screen.getByRole('button', { name: 'dinsdag 3 november 2026' })
  expect(today).toHaveAttribute('aria-current', 'date')
  expect(today).toHaveAttribute('aria-pressed', 'true')
})

test('the grid is one tab stop, on the chosen day', async () => {
  render(<Picker />)
  await userEvent.tab()
  expect(screen.getByRole('button', { name: 'Vorige maand' })).toHaveFocus()
  await userEvent.tab()
  expect(screen.getByRole('button', { name: 'Volgende maand' })).toHaveFocus()
  await userEvent.tab()
  expect(focusedDay()).toBe('2026-11-03')
  await userEvent.tab()
  expect(document.body).toHaveFocus()
})

test('the keys walk the days and turn the month', async () => {
  render(<Picker />)
  screen.getByRole('button', { name: 'dinsdag 3 november 2026' }).focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(focusedDay()).toBe('2026-11-04')
  await userEvent.keyboard('{ArrowDown}')
  expect(focusedDay()).toBe('2026-11-11')
  await userEvent.keyboard('{Home}')
  expect(focusedDay()).toBe('2026-11-09')
  await userEvent.keyboard('{End}')
  expect(focusedDay()).toBe('2026-11-15')
  await userEvent.keyboard('{PageDown}')
  expect(focusedDay()).toBe('2026-12-15')
  expect(screen.getByRole('table', { name: 'december 2026' })).toBeInTheDocument()
  await userEvent.keyboard('{Shift>}{PageUp}{/Shift}')
  expect(focusedDay()).toBe('2025-12-15')
})

test('Enter chooses the focused day', async () => {
  const onChange = vi.fn()
  render(<Picker onChange={onChange} />)
  screen.getByRole('button', { name: 'dinsdag 3 november 2026' }).focus()
  await userEvent.keyboard('{ArrowLeft}{Enter}')
  expect(onChange).toHaveBeenCalledWith('2026-11-02')
})

test('a day before min stays reachable but cannot be chosen', async () => {
  const onChange = vi.fn()
  render(<Picker onChange={onChange} min="2026-11-03" />)
  const before = screen.getByRole('button', { name: 'maandag 2 november 2026' })
  expect(before).toHaveAttribute('aria-disabled', 'true')
  await userEvent.click(before)
  expect(onChange).not.toHaveBeenCalled()
  expect(before).toHaveFocus()
})

test('the buttons turn the month', async () => {
  render(<Picker />)
  await userEvent.click(screen.getByRole('button', { name: 'Vorige maand' }))
  expect(screen.getByRole('table', { name: 'oktober 2026' })).toBeInTheDocument()
})
