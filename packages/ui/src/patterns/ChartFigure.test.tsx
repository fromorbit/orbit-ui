import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { nl } from '../testing/labels'
import { ChartFigure } from './ChartFigure'
import { CHART_FIGURE_FIXTURES } from './chart-fixtures'
import type { ChartRow, ChartSpec } from './chart-model'

const labels = nl.chartFigure
const draw = (spec: ChartSpec, rows?: readonly ChartRow[]) =>
  render(
    rows === undefined ? (
      <ChartFigure spec={spec} labels={labels} />
    ) : (
      <ChartFigure spec={spec} rows={rows} labels={labels} />
    ),
  )
const marks = (container: HTMLElement, tag: string): number =>
  container.querySelectorAll(`svg ${tag}`).length

describe('the five kinds', () => {
  test('a bar chart draws a bar per value per series, on labelled axes', () => {
    const { container } = draw(CHART_FIGURE_FIXTURES.bar)
    expect(marks(container, 'rect[rx]')).toBe(8)
    expect(screen.getByRole('img', { name: /Omzet en kosten.*staafdiagram/ })).toBeInTheDocument()
    // The y axis is on a round scale that covers the data (max 24), zero included.
    expect(container.querySelector('svg')?.textContent).toMatch(/0.*5.*10.*15.*20.*25/)
    expect(container.querySelector('svg')?.textContent).toContain('jan')
  })

  test('the grid is dashed and the baseline solid, as in the desktop app', () => {
    const { container } = draw(CHART_FIGURE_FIXTURES.bar)
    const lines = [...container.querySelectorAll('svg line')]
    const base = lines.find((line) => line.getAttribute('stroke-width') === '1.5')
    expect(base?.getAttribute('stroke-dasharray')).toBeNull()
    expect(lines.filter((line) => line.getAttribute('stroke-dasharray') === '2 3').length).toBe(
      lines.length - 1,
    )
  })

  test('a line chart draws one path per series with a marker per point', () => {
    const { container } = draw(CHART_FIGURE_FIXTURES.line)
    expect(marks(container, 'path[fill="none"]')).toBe(1)
    expect(marks(container, 'circle')).toBe(4)
  })

  test('an area chart fills under the line', () => {
    const { container } = draw(CHART_FIGURE_FIXTURES.area)
    expect(marks(container, 'path[fill-opacity]')).toBe(1)
  })

  test('a pie draws a slice per row and a legend for them', () => {
    const { container } = draw(CHART_FIGURE_FIXTURES.pie)
    expect(marks(container, 'path')).toBe(3)
    expect(screen.getByRole('list', { name: 'Legenda' })).toHaveTextContent('WebMobielData')
  })

  test('a pie of one slice is a full circle, not nothing', () => {
    const { container } = draw({ type: 'pie', x: 'n', y: 'v', data: [{ n: 'a', v: 1 }] })
    expect(container.querySelector('svg path')?.getAttribute('d')).toContain('a')
    expect(screen.queryByRole('list', { name: 'Legenda' })).toBeNull()
  })

  test('a scatter draws a point per row on two number axes', () => {
    const { container } = draw(CHART_FIGURE_FIXTURES.scatter)
    expect(marks(container, 'circle:not([fill="transparent"])')).toBe(4)
    expect(container.querySelector('svg')?.textContent).toContain('uren')
  })
})

describe('the legend', () => {
  test('is there for two series and not for one', () => {
    const { rerender } = draw(CHART_FIGURE_FIXTURES.bar)
    expect(screen.getByRole('list', { name: 'Legenda' })).toHaveTextContent('omzetkosten')
    rerender(<ChartFigure spec={CHART_FIGURE_FIXTURES.line} labels={labels} />)
    expect(screen.queryByRole('list', { name: 'Legenda' })).toBeNull()
  })

  test('a sixth series is announced, not drawn', () => {
    const row = Object.fromEntries(
      ['x', 'a', 'b', 'c', 'd', 'e', 'f'].map((key, index) => [key, index === 0 ? 'k' : index]),
    )
    draw({ type: 'bar', data: [row] })
    expect(screen.getByText('1 reeks niet getoond: meer dan 5 reeksen lezen niet')).toBeVisible()
  })
})

describe('the tooltip', () => {
  test('names the category and every series under the pointer', () => {
    const { container } = draw(CHART_FIGURE_FIXTURES.bar)
    const hits = [...container.querySelectorAll('svg rect[fill="transparent"]')]
    fireEvent.mouseEnter(hits[1] as Element)
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('feb')
    expect(tip).toHaveTextContent('omzet18')
    expect(tip).toHaveTextContent('kosten9')
    fireEvent.mouseLeave(container.querySelector('svg') as Element)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  test('a pie slice says its share', () => {
    const { container } = draw(CHART_FIGURE_FIXTURES.pie)
    fireEvent.mouseEnter(container.querySelector('svg path') as Element)
    expect(screen.getByRole('tooltip')).toHaveTextContent('49%')
  })
})

describe('data and states', () => {
  test('a block with a source waits for the host, then draws its rows', () => {
    const spec: ChartSpec = { type: 'bar', x: 'm', y: 'v', source: 'data/x.csv' }
    const { rerender, container } = draw(spec)
    expect(screen.getByRole('status')).toHaveTextContent('Gegevens laden')
    rerender(<ChartFigure spec={spec} rows={[{ m: 'a', v: 1 }]} labels={labels} />)
    expect(marks(container, 'rect[rx]')).toBe(1)
  })

  test('says so when there is nothing to draw', () => {
    draw({ type: 'line', data: [] })
    expect(screen.getByRole('status')).toHaveTextContent('geen gegevens')
  })

  test('keeps the same numbers in a table for a screen reader', () => {
    draw(CHART_FIGURE_FIXTURES.line)
    const table = screen.getByRole('table', { name: 'Gegevens van de grafiek' })
    expect(table).toHaveTextContent('jan12')
  })

  test('without a title the figure is named by the untitled word', () => {
    draw({ type: 'bar', data: [{ m: 'a', v: 1 }] })
    expect(screen.getByRole('figure', { name: 'Grafiek zonder titel' })).toBeInTheDocument()
  })
})

test('every colour is a token of the kit, never a literal, so each theme brings its own', () => {
  const dir = import.meta.dirname
  const source = ['ChartFigure.tsx', 'chart-model.ts']
    .map((file) => readFileSync(resolve(dir, file), 'utf8'))
    .join('\n')
  const tokens = readFileSync(resolve(dir, '../tokens.css'), 'utf8')
  expect(source).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i)
  const used = [...source.matchAll(/var\((--nt-[a-z-]+)[,)]/g)].map((match) => match[1])
  expect(used.length).toBeGreaterThan(5)
  for (const name of new Set(used)) {
    if (name === '--nt-chart-ground') continue
    expect(tokens, name).toContain(`${name}:`)
  }
})
