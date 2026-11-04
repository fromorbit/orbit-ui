import type { Story } from '../gallery/story'
import { TrendBadge } from '../primitives/TrendBadge'
import { Chart, type ChartPoint, Sparkline } from './Chart'
import { StatTile } from './StatTile'

const nl = (value: number) => value.toLocaleString('nl-NL')

const WEEK: ChartPoint[] = [
  { label: 'ma', title: 'maandag', values: [26, 0] },
  { label: 'di', title: 'dinsdag', values: [29, 0] },
  { label: 'wo', title: 'woensdag', values: [30, 0] },
  { label: 'do', title: 'donderdag', values: [29, 4] },
  { label: 'vr', title: 'vrijdag', values: [27, 0] },
  { label: 'za', title: 'zaterdag', values: [8, 1] },
  { label: 'zo', title: 'zondag', values: [5, 0] },
]

const builds = (value: number) => `${nl(value)} builds`

/** Builds per day of October: quiet in the weekends, a failure every few days. */
const MONTH: ChartPoint[] = Array.from({ length: 31 }, (_, index) => {
  const weekend = index % 7 >= 5
  const value = Math.round(
    (weekend ? 6 : 20) + Math.sin(index / 1.7) * 5 + Math.cos(index / 3.1) * 4,
  )
  return {
    label: `${index + 1} okt`,
    title: `${index + 1} oktober`,
    values: [value, index % 5 === 3 ? 2 : 0],
  }
})

/** Agent hours of October so far, added up, against the pace of a plan of 250 hours. */
const DAILY = [11, 12, 2, 1, 13, 12, 14, 11, 10, 2, 3, 14, 13, 12, 15, 12, 2, 1, 13, 9]
const MONTH_HOURS: ChartPoint[] = Array.from({ length: 31 }, (_, index) => ({
  label: `${index + 1} okt`,
  values: [
    index < DAILY.length ? DAILY.slice(0, index + 1).reduce((sum, hours) => sum + hours, 0) : null,
    Math.round((250 * (index + 1)) / 31),
  ],
}))

const BUILDS = [
  { id: 'ok', label: 'Geslaagd' },
  { id: 'failed', label: 'Mislukt', tone: 'danger' as const },
]

export default {
  group: 'patterns',
  title: 'Chart',
  states: {
    'Stacked bars: builds per day, failures on top': () => (
      <div className="w-full max-w-3xl">
        <Chart label="Builds per dag" series={BUILDS} points={WEEK} format={nl} total={builds} />
      </div>
    ),
    'Many bars: a month, a label every few and the last': () => (
      <div className="w-full max-w-3xl">
        <Chart
          label="Builds per dag in oktober"
          series={BUILDS}
          points={MONTH}
          format={nl}
          total={builds}
        />
      </div>
    ),
    'Line against a plan: the limit drawn, the days to come empty': () => (
      <div className="w-full max-w-3xl">
        <Chart
          kind="line"
          label="Agent-uren in oktober, opgeteld"
          series={[
            { id: 'used', label: 'Gebruikt' },
            { id: 'plan', label: 'Op koers voor 250 u', reference: true },
          ]}
          points={MONTH_HOURS}
          limit={{ value: 250, label: 'Plan 250 u' }}
          format={(value) => `${nl(value)} u`}
          none="nog geen waarde"
        />
      </div>
    ),
    'One line: no legend, the title names it': () => (
      <div className="flex w-full max-w-3xl flex-col gap-3">
        <p className="m-0 font-medium text-[13px] text-fg">
          Gem. bouwtijd per dag <span className="font-normal text-muted">in seconden</span>
        </p>
        <Chart
          kind="line"
          label="Gem. bouwtijd per dag, in seconden"
          series={[{ id: 'seconds', label: 'Bouwtijd' }]}
          points={WEEK.map((point, index) => ({
            label: point.label,
            values: [[118, 112, 109, 121, 104, 99, 111][index] ?? 0],
          }))}
          format={(value) => `${nl(value)} s`}
          height={144}
        />
      </div>
    ),
    'Sparkline in a StatTile': () => (
      <div className="grid w-full max-w-3xl grid-cols-2 gap-3">
        <StatTile
          label="Builds"
          value="159"
          trend={
            <TrendBadge value="12%" direction="up" tone="good" description="Gestegen met 12%" />
          }
          comparison="t.o.v. vorige week"
        >
          <Sparkline
            label="Builds per dag, de afgelopen 7 dagen, van 26 naar 5"
            values={[26, 29, 30, 33, 27, 9, 5]}
          />
        </StatTile>
        <StatTile
          label="Mislukte starts"
          value="7"
          trend={<TrendBadge value="3" direction="down" tone="good" description="Gedaald met 3" />}
          comparison="t.o.v. vorige week"
        >
          <Sparkline
            label="Mislukte starts per dag, de afgelopen 7 dagen, van 2 naar 0"
            values={[2, 1, 0, 2, 1, 1, 0]}
          />
        </StatTile>
      </div>
    ),
    'Loading: soft shapes, the figure busy': () => (
      <div className="w-full max-w-3xl">
        <Chart label="Builds per dag" series={BUILDS} points={[]} loading="Builds laden" />
      </div>
    ),
    'Empty: the grid, one sentence and the next step': () => (
      <div className="w-full max-w-3xl">
        <Chart
          label="Builds per dag"
          series={BUILDS}
          points={WEEK.map((point) => ({ label: point.label, values: [0, 0] }))}
          empty="Nog geen builds in deze periode"
          emptyNext="Kies een langere periode of start een build in een space."
        />
      </div>
    ),
    'Narrow: 320px, a month of bars': () => (
      <div className="w-full max-w-[288px]">
        <Chart
          label="Builds per dag in oktober"
          series={BUILDS}
          points={MONTH}
          format={nl}
          total={builds}
          height={144}
        />
      </div>
    ),
  },
} satisfies Story
