import { describe, expect, test } from 'vitest'
import { CHART_FIGURE_FIXTURES } from './chart-fixtures'
import {
  buildChartModel,
  CHART_MAX_SERIES,
  CHART_SERIES_COLORS,
  chartPieSlices,
  formatTick,
  linearScale,
  niceTicks,
} from './chart-model'

describe('buildChartModel', () => {
  test('takes x and every numeric column as y when the block names neither', () => {
    const model = buildChartModel({ type: 'bar' }, [{ a: 'x', b: 1, c: 'tekst', d: 2 }])
    expect(model.xLabel).toBe('a')
    expect(model.series.map((entry) => entry.name)).toEqual(['b', 'd'])
  })

  test('a missing number is a gap, not a zero', () => {
    const model = buildChartModel({ type: 'line', x: 'm', y: 'v' }, [
      { m: 'a', v: 1 },
      { m: 'b', v: null },
      { m: 'c', v: 3 },
    ])
    expect(model.series[0]?.points.map((point) => [point.label, point.x])).toEqual([
      ['a', 0],
      ['c', 2],
    ])
  })

  test('colours follow the series in fixed order and a sixth series is announced, not drawn', () => {
    const row = Object.fromEntries(
      ['x', 'a', 'b', 'c', 'd', 'e', 'f'].map((key, index) => [key, index === 0 ? 'k' : index]),
    )
    const model = buildChartModel({ type: 'bar' }, [row])
    expect(model.series.map((entry) => entry.color)).toEqual([...CHART_SERIES_COLORS])
    expect(model.hidden).toBe(6 - CHART_MAX_SERIES)
  })

  test('a scatter needs numbers on both axes and keeps one measure', () => {
    const model = buildChartModel(CHART_FIGURE_FIXTURES.scatter, [
      { uren: 'veel', kosten: 5 },
      { uren: 2, kosten: 6 },
    ])
    expect(model.series).toHaveLength(1)
    expect(model.series[0]?.points).toEqual([{ label: '2', x: 2, y: 6 }])
  })

  test('a pie drops slices without a positive value', () => {
    const model = buildChartModel({ type: 'pie', x: 'n', y: 'v' }, [
      { n: 'a', v: 3 },
      { n: 'b', v: 0 },
      { n: 'c', v: -1 },
    ])
    expect(model.series[0]?.points.map((point) => point.label)).toEqual(['a'])
  })
})

test('a pie folds the tail past the colours into one rest slice', () => {
  const points = Array.from({ length: 8 }, (_, index) => ({ label: `s${index}`, x: index, y: 1 }))
  const slices = chartPieSlices(points, 'Overig')
  expect(slices).toHaveLength(CHART_MAX_SERIES)
  expect(slices.at(-1)).toMatchObject({ label: 'Overig', value: 4, rest: true })
})

describe('niceTicks', () => {
  test.each([
    [0, 24, [0, 5, 10, 15, 20, 25]],
    [0, 1, [0, 0.2, 0.4, 0.6, 0.8, 1]],
    [-40, 130, [-50, 0, 50, 100, 150]],
    [5, 5, [0, 1, 2, 3, 4, 5]],
    [0, 0, [0, 1]],
  ])('%s..%s', (min, max, ticks) => expect(niceTicks(min, max)).toEqual(ticks))

  test('a non-number falls back instead of looping', () => {
    expect(niceTicks(Number.NaN, 3)).toEqual([0, 1])
  })
})

test('linearScale maps the ends of the ticks to the ends of the range', () => {
  const scale = linearScale(0, 24, 100, 0)
  expect(scale.domain).toEqual([0, 25])
  expect(scale.map(0)).toBe(100)
  expect(scale.map(25)).toBe(0)
  expect(scale.map(12.5)).toBe(50)
})

test('formatTick keeps labels short', () => {
  expect(formatTick(0)).toBe('0')
  expect(formatTick(999)).toBe('999')
  expect(formatTick(12_500)).toBe('12,5k')
  expect(formatTick(-3_000_000)).toBe('-3M')
})
