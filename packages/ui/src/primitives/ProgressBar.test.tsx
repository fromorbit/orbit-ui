import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ProgressBar } from './ProgressBar'

test('a known value is a progressbar with its value and words', () => {
  render(<ProgressBar label="Uploaden" value={40} valueText={(v, m) => `${v} van ${m}`} />)
  const bar = screen.getByRole('progressbar', { name: 'Uploaden' })
  expect(bar).toHaveAttribute('aria-valuenow', '40')
  expect(bar).toHaveAttribute('aria-valuemax', '100')
  expect(bar).toHaveAttribute('aria-valuetext', '40 van 100')
  expect(bar.querySelector<HTMLElement>('[data-nt-progress-fill]')?.style.width).toBe('40%')
})

test('without a value it is indeterminate: no value, a pulsing bar', () => {
  render(<ProgressBar label="Bouwen" />)
  const bar = screen.getByRole('progressbar', { name: 'Bouwen' })
  expect(bar).not.toHaveAttribute('aria-valuenow')
  expect(bar.querySelector('[data-nt-progress-fill]')?.className).toContain('nt-shimmer')
})

test('the fill clamps to its ends', () => {
  render(<ProgressBar label="Kopiëren" value={12} max={10} />)
  const fill = screen.getByRole('progressbar').querySelector<HTMLElement>('[data-nt-progress-fill]')
  expect(fill?.style.width).toBe('100%')
})
