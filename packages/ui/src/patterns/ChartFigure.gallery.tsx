import type { Story } from '../gallery/story'
import { nl } from '../testing/labels'
import { ChartFigure } from './ChartFigure'
import { CHART_FIGURE_FIXTURES } from './chart-fixtures'
import type { ChartSpec } from './chart-model'

const frame = (spec: ChartSpec) => () => (
  <div className="w-[32rem] max-w-full">
    <ChartFigure spec={spec} labels={nl.chartFigure} />
  </div>
)

const many: ChartSpec = {
  type: 'line',
  title: 'Twaalf maanden, drie reeksen',
  x: 'maand',
  y: ['web', 'mobiel', 'data'],
  data: Array.from({ length: 12 }, (_, index) => ({
    maand: `maand ${index + 1}`,
    web: 20 + index * 3,
    mobiel: 40 - index,
    data: 10 + ((index * 7) % 15),
  })),
}

const slices: ChartSpec = {
  type: 'pie',
  title: 'Acht teams',
  x: 'team',
  y: 'uren',
  data: Array.from({ length: 8 }, (_, index) => ({
    team: `Team ${index + 1}`,
    uren: 30 - index * 3,
  })),
}

export default {
  group: 'patterns',
  title: 'ChartFigure',
  states: {
    Staven: frame(CHART_FIGURE_FIXTURES.bar),
    Lijn: frame(CHART_FIGURE_FIXTURES.line),
    Vlak: frame(CHART_FIGURE_FIXTURES.area),
    Taart: frame(CHART_FIGURE_FIXTURES.pie),
    'Taart met een samengevouwen staart': frame(slices),
    Spreiding: frame(CHART_FIGURE_FIXTURES.scatter),
    'Drie reeksen, twaalf punten': frame(many),
    'Wacht op de bron': frame({ type: 'bar', source: 'data/omzet.csv' }),
    Leeg: frame({ type: 'bar', data: [] }),
  },
} satisfies Story
