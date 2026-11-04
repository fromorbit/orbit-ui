import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Chart, type ChartPoint, chartTicks, Sparkline, stackHeights } from './Chart'

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

test('counts step by whole numbers', () => {
  expect(chartTicks(9, true)).toEqual([0, 5, 10])
  expect(chartTicks(3, true)).toEqual([0, 1, 2, 3])
  expect(chartTicks(33, true)).toEqual([0, 10, 20, 30, 40])
})

test('a part above zero shows at least 3px, taken from the tallest part', () => {
  // 30 builds and 1 failure at 4px a build: the failure gets 3px and the 2px gap under it.
  expect(stackHeights([30, 1], 4)).toEqual([119, 5])
  expect(stackHeights([30, 10], 4)).toEqual([120, 40])
})

test('a screen reader gets the values as a table named by the label', () => {
  render(<Chart label="Builds per dag" series={SERIES} points={POINTS} format={nl} />)
  const table = screen.getByRole('table', { name: 'Builds per dag' })
  expect(
    within(table)
      .getAllByRole('row')
      .map((row) => row.textContent),
  ).toEqual(['GeslaagdMislukt', 'ma260', 'di1.2044', 'wo30–'])
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
  const plot = container.querySelector<HTMLElement>('[data-nt-chart-plot]')
  if (!plot) throw new Error('no plot')
  plot.getBoundingClientRect = () => ({ left: 0, width: 300 }) as DOMRect
  fireEvent.pointerMove(plot, { clientX: 150 })
  expect(container.querySelector('[data-nt-chart-tooltip]')).toHaveTextContent(
    'diGeslaagd1.204Mislukt4',
  )
  fireEvent.pointerLeave(plot)
  expect(container.querySelector('[data-nt-chart-tooltip]')).toBeNull()
})

test('the plot is one tab stop: the arrow keys read the points, Escape closes', () => {
  render(<Chart label="Builds" series={SERIES} points={POINTS} format={nl} />)
  const plot = screen.getByRole('group', { name: 'Builds' })
  expect(plot).toHaveAttribute('tabindex', '0')
  fireEvent.keyDown(plot, { key: 'Home' })
  const tooltip = () => document.querySelector('[data-nt-chart-tooltip]')
  expect(tooltip()).toHaveTextContent('maGeslaagd26')
  fireEvent.keyDown(plot, { key: 'ArrowRight' })
  expect(tooltip()).toHaveTextContent('diGeslaagd1.204Mislukt4')
  expect(plot.querySelector('[aria-live]')).toHaveTextContent('di, Geslaagd 1.204, Mislukt 4')
  fireEvent.keyDown(plot, { key: 'Escape' })
  expect(tooltip()).toBeNull()
})

test('a tap reads a point, a second tap on it closes it', () => {
  const { container } = render(<Chart label="Builds" series={SERIES} points={POINTS} format={nl} />)
  const plot = container.querySelector<HTMLElement>('[data-nt-chart-plot]')
  if (!plot) throw new Error('no plot')
  plot.getBoundingClientRect = () => ({ left: 0, width: 300 }) as DOMRect
  fireEvent.pointerDown(plot, { clientX: 20, pointerType: 'touch' })
  fireEvent.pointerLeave(plot, { pointerType: 'touch' })
  expect(container.querySelector('[data-nt-chart-tooltip]')).toHaveTextContent('ma')
  fireEvent.pointerDown(plot, { clientX: 20, pointerType: 'touch' })
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

test('with only zeros the plot holds one sentence and the next step, without a legend', () => {
  const { container } = render(
    <Chart
      label="Builds"
      series={SERIES}
      points={[{ label: 'ma', values: [0, 0] }]}
      empty="Nog geen builds in deze periode"
      emptyNext="Kies een langere periode."
    />,
  )
  expect(screen.getByText('Nog geen builds in deze periode')).toBeVisible()
  expect(screen.getByText('Kies een langere periode.')).toBeInTheDocument()
  expect(screen.getByText('Nog geen builds in deze periode').closest('[aria-hidden]')).toBeNull()
  expect(container.querySelector('ul')).toBeNull()
})

test('a sparkline is an image named by its label, with a dot on the latest value', () => {
  const { container } = render(<Sparkline label="Builds per dag" values={[3, 5, 4, 8]} />)
  expect(screen.getByRole('img', { name: 'Builds per dag' })).toBeInTheDocument()
  expect(container.querySelectorAll('circle')).toHaveLength(1)
})
