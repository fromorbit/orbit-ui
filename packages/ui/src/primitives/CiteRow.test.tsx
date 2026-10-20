import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { CiteRow } from './CiteRow'

test('is a button named by its words and its line under them, and jumps on a click', async () => {
  const onJump = vi.fn()
  render(
    <CiteRow
      icon="check"
      tone="success"
      label="Een bon telt op bij het afrekenen"
      description="2 criteria"
      onJump={onJump}
    />,
  )
  const row = screen.getByRole('button', { name: 'Een bon telt op bij het afrekenen' })
  expect(row).toHaveAccessibleDescription('2 criteria')
  await userEvent.click(row)
  expect(onJump).toHaveBeenCalledOnce()
})

test('without a place to jump to it is no button, and says the same', () => {
  render(<CiteRow icon="alert-triangle" tone="attention" label="Doel ontbreekt" />)
  expect(screen.queryByRole('button')).toBeNull()
  expect(screen.getByText('Doel ontbreekt')).toBeTruthy()
})

test('carries a tag after its words, in its name', () => {
  render(<CiteRow framed label="Een bon geldt een jaar" tag="Impact hoog" onJump={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Een bon geldt een jaar Impact hoog' })).toBeTruthy()
})

test('its icon is decoration only', () => {
  const { container } = render(<CiteRow icon="check" label="Klopt" />)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})
