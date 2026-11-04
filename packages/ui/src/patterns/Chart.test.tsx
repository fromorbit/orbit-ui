import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Chart, type ChartPoint, chartTicks, Sparkline } from './Chart'

const nl = (value: number) => value.toLocaleString('nl-NL')
const SERIES = [
  { id: 'ok', label: 'Geslaagd' },
  { id: 'failed', label: 'Mislukt', tone: 'danger' as const },
]
const POINTS: ChartPoint[] = [
  { label: 'ma', values: [26, 0] },
  { label: 'di', values: [1204, 4] },
  { label: 'wo', values: [30, null] },
]

test('the grid steps by 1, 2, 2.5 or 5 times a power of ten, from zero past the largest value', () => {
  expect(chartTicks(33)).toEqual([0, 10, 20, 30, 40])
  expect(chartTicks(250)).toEqual([0, 100, 200, 300])
  expect(chartTicks(9)).toEqual([0, 2.5, 5, 7.5, 10])
  expect(chartTicks(0)).toEqual([0, 1])
})

test('a screen reader gets the values as a table named by the label', () => {
  render(<Chart label="Builds per dag" series={SERIES} points={POINTS} format={nl} />)
  const table = screen.getByRole('table', { name: 'Builds per dag' })
  expect(
    within(table)
      .getAllByRole('row')
      .map((row) => row.textContent),
  ).toEqual(['GeslaagdMislukt', 'ma260', 'di1.2044', 'wo30'])
})

test('two series have a legend; one series does not, its title names it', () => {
  const { container, rerender } = render(<Chart label="Builds" series={SERIES} points={POINTS} />)
  expect(container.querySelector('ul')).toHaveTextContent('GeslaagdMislukt')
  rerender(<Chart label="Builds" series={SERIES.slice(0, 1)} points={POINTS} />)
  expect(container.querySelector('ul')).toBeNull()
})

test('a stacked bar draws a part per value above zero, the failed one on top', () => {
  const { container } = render(<Chart label="Builds" series={SERIES} points={POINTS} />)
  const bar = (label: string) =>
    container.querySelectorAll(`[data-nt-chart-bar="${label}"] path`).length
  expect([bar('ma'), bar('di'), bar('wo')]).toEqual([1, 2, 1])
})

test('the pointer over a bar shows its values in a tooltip', () => {
  const { container } = render(<Chart label="Builds" series={SERIES} points={POINTS} format={nl} />)
  const plot = container.querySelector<HTMLElement>('[data-nt-chart] > div.flex > div.flex-1')
  if (!plot) throw new Error('no plot')
  plot.getBoundingClientRect = () => ({ left: 0, width: 300 }) as DOMRect
  fireEvent.pointerMove(plot, { clientX: 150 })
  expect(container.querySelector('[data-nt-chart-tooltip]')).toHaveTextContent(
    'diGeslaagd1.204Mislukt4',
  )
  fireEvent.pointerLeave(plot)
  expect(container.querySelector('[data-nt-chart-tooltip]')).toBeNull()
})

test('a line breaks where a value is missing, and a reference is dashed', () => {
  const { container } = render(
    <Chart
      kind="line"
      label="Agent-uren"
      series={[
        { id: 'used', label: 'Gebruikt' },
        { id: 'plan', label: 'Plan', reference: true },
      ]}
      points={[
        { label: '1', values: [10, 8] },
        { label: '2', values: [20, 16] },
        { label: '3', values: [null, 24] },
      ]}
    />,
  )
  const used = container.querySelector('[data-nt-chart-line="used"] path[fill="none"]')
  expect(used?.getAttribute('d')?.match(/[ML]/g)).toEqual(['M', 'L'])
  const plan = container.querySelector('[data-nt-chart-line="plan"] path')
  expect(plan).toHaveAttribute('stroke-dasharray', '4 4')
})

test('while loading the figure is busy and says so, without a grid of values', () => {
  const { container } = render(
    <Chart label="Builds" series={SERIES} points={[]} loading="Builds laden" />,
  )
  expect(container.querySelector('figure')).toHaveAttribute('aria-busy', 'true')
  expect(screen.getByText('Builds laden')).toBeInTheDocument()
  expect(container.querySelector('[data-nt-chart-bar]')).toBeNull()
})

test('with only zeros the plot holds one sentence', () => {
  render(
    <Chart
      label="Builds"
      series={SERIES}
      points={[{ label: 'ma', values: [0, 0] }]}
      empty="Nog geen builds in deze periode"
    />,
  )
  expect(screen.getByText('Nog geen builds in deze periode')).toBeInTheDocument()
})

test('a sparkline is an image named by its label, with a dot on the latest value', () => {
  const { container } = render(<Sparkline label="Builds per dag" values={[3, 5, 4, 8]} />)
  expect(screen.getByRole('img', { name: 'Builds per dag' })).toBeInTheDocument()
  expect(container.querySelectorAll('circle')).toHaveLength(1)
})
