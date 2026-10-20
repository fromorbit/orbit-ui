import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ProgressMeter } from './ProgressMeter'

/** What a host says for the figures. */
const valueText = (value: number, max: number) => `${value} van ${max}`

test('is a meter with the count beside it', () => {
  render(<ProgressMeter valueText={valueText} value={2} max={5} label="PLAN-10" />)
  const meter = screen.getByRole('meter', { name: 'PLAN-10' })
  expect(meter).toHaveAttribute('aria-valuenow', '2')
  expect(meter).toHaveAttribute('aria-valuemin', '0')
  expect(meter).toHaveAttribute('aria-valuemax', '5')
  expect(meter).toHaveAttribute('aria-valuetext', '2 van 5')
  const count = screen.getByText('2/5')
  expect(count).toHaveAttribute('aria-hidden', 'true')
  expect(count.className).toContain('tabular-nums')
})

test('fills its bar in proportion, never past either end', () => {
  const fill = (value: number, max: number) => {
    const { container, unmount } = render(
      <ProgressMeter valueText={valueText} value={value} max={max} label="x" />,
    )
    const width = (container.querySelector('[data-nt-meter-fill]') as HTMLElement).style.width
    unmount()
    return width
  }
  expect(fill(2, 5)).toBe('40%')
  expect(fill(9, 12)).toBe('75%')
  expect(fill(7, 5)).toBe('100%')
  expect(fill(-1, 5)).toBe('0%')
  expect(fill(0, 0)).toBe('0%')
})

test('can leave the count out and fill its column', () => {
  render(
    <ProgressMeter
      valueText={valueText}
      value={9}
      max={12}
      label="Acceptatie"
      count={false}
      width="fill"
    />,
  )
  expect(screen.queryByText('9/12')).toBeNull()
  expect(screen.getByRole('meter').className).toContain('flex-1')
})
