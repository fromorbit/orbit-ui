import type { ChartFigureType, ChartRow, ChartSpec } from './chart-model'

const months: ChartRow[] = [
  { maand: 'jan', omzet: 12, kosten: 8 },
  { maand: 'feb', omzet: 18, kosten: 9 },
  { maand: 'mrt', omzet: 15, kosten: 11 },
  { maand: 'apr', omzet: 24, kosten: 12 },
]

/**
 * One block of each of the five kinds of `ChartFigure`: the fixtures of its tests and its gallery
 * story, the same as the desktop app's chart element uses.
 */
export const CHART_FIGURE_FIXTURES: Record<ChartFigureType, ChartSpec> = {
  bar: { type: 'bar', title: 'Omzet en kosten', x: 'maand', y: ['omzet', 'kosten'], data: months },
  line: { type: 'line', title: 'Omzet', x: 'maand', y: 'omzet', data: months },
  area: { type: 'area', title: 'Kosten', x: 'maand', y: 'kosten', data: months },
  pie: {
    type: 'pie',
    title: 'Aandeel',
    x: 'team',
    y: 'uren',
    data: [
      { team: 'Web', uren: 120 },
      { team: 'Mobiel', uren: 80 },
      { team: 'Data', uren: 45 },
    ],
  },
  scatter: {
    type: 'scatter',
    title: 'Duur en kosten',
    x: 'uren',
    y: 'kosten',
    data: [
      { uren: 1.5, kosten: 90 },
      { uren: 3, kosten: 210 },
      { uren: 4.5, kosten: 260 },
      { uren: 8, kosten: 610 },
    ],
  },
}
