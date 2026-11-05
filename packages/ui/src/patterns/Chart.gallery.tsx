import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
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

const builds = (value: number) => `${nl(value)}\u00a0builds`
const hours = (value: number) => `${nl(value)}\u00a0u`
/** Seconds as the StatTile of the dashboard writes them: "1 min 51 s". */
const duration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes === 0) return `${rest}\u00a0s`
  return rest === 0 ? `${minutes}\u00a0min` : `${minutes}\u00a0min ${rest}\u00a0s`
}

/** How the plot is read by key, in Dutch, as its description for a screen reader. */
const KEYS =
  'Pijltjes links en rechts om de dagen te lezen, Home en End voor de eerste en de laatste'

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
  title: `${index + 1} oktober`,
  values: [
    index < DAILY.length ? DAILY.slice(0, index + 1).reduce((sum, hours) => sum + hours, 0) : null,
    Math.round((250 * (index + 1)) / 31),
  ],
}))

/** 182 hours in 20 days is about 282 by the 31st. */
const PROJECTED = Math.round((DAILY.reduce((sum, value) => sum + value, 0) / DAILY.length) * 31)

/** Builds per space this week: names as long as they come. */
const SPACES: ChartPoint[] = [
  ['webwinkel · main', 42, 0],
  ['webwinkel · betaling-ideal', 31, 6],
  ['webwinkel · zoeken-v2', 24, 1],
  ['beheer · main', 18, 0],
  ['nieuwsbrief · sjablonen', 12, 2],
  ['webwinkel · cadeaubon', 6, 0],
].map(([label, ok, failed]) => ({
  label: String(label),
  values: [Number(ok), Number(failed)],
}))

/**
 * The card a chart ships on, as the demos lay it out: white with a hairline in light, a step
 * lighter than the page in dark, 12px corners, the title 13px with a quiet note beside it.
 */
function Card({
  title,
  meta,
  className = 'max-w-3xl',
  children,
}: {
  title: string
  meta?: string
  className?: string
  children: ReactNode
}): ReactNode {
  return (
    <section
      className={`flex w-full flex-col gap-3 rounded-lg bg-overlay p-4 shadow-plane ${className}`}
    >
      <p className="m-0 flex items-baseline gap-2">
        <span className="font-medium text-[13px] text-fg">{title}</span>
        {meta === undefined ? null : <span className="text-[12px] text-muted">{meta}</span>}
      </p>
      {children}
    </section>
  )
}

/** Builds per app this week: short names, which fit under their bars. */
const APPS: ChartPoint[] = [
  ['webwinkel', 103, 7],
  ['beheer', 18, 0],
  ['nieuwsbrief', 12, 2],
  ['zoekdienst', 9, 1],
].map(([label, ok, failed]) => ({ label: String(label), values: [Number(ok), Number(failed)] }))

const SPACE_KEYS = 'Pijltjes om de spaces te lezen, Home en End voor de eerste en de laatste'

const BUILDS = [
  { id: 'ok', label: 'Geslaagd' },
  { id: 'failed', label: 'Mislukt', tone: 'danger' as const },
]

export default {
  group: 'patterns',
  title: 'Chart',
  states: {
    'Gestapelde staven: builds per dag, mislukte bovenop': () => (
      <Card title="Builds" meta="per dag">
        <Chart
          label="Builds per dag"
          series={BUILDS}
          points={WEEK}
          format={nl}
          total={builds}
          keys={KEYS}
          roleDescription="grafiek"
        />
      </Card>
    ),
    'Veel staven: een maand, om de paar een label en de laatste': () => (
      <Card title="Builds" meta="per dag, oktober">
        <Chart
          label="Builds per dag in oktober"
          series={BUILDS}
          points={MONTH}
          format={nl}
          total={builds}
          keys={KEYS}
          roleDescription="grafiek"
        />
      </Card>
    ),
    'Lijn tegen een plan: de grens getekend, de rest van de maand een verwachting': () => (
      <Card title="Agent-uren" meta="opgeteld, deze maand">
        <Chart
          kind="line"
          label="Agent-uren in oktober, opgeteld per dag"
          series={[
            { id: 'used', label: 'Gebruikt' },
            { id: 'plan', label: 'Tempo van je plan', reference: true },
          ]}
          points={MONTH_HOURS}
          limit={{ value: 250, label: 'Plan 250\u00a0u' }}
          forecast={{
            series: 'used',
            value: PROJECTED,
            label: `≈${PROJECTED}\u00a0u`,
            text: `verwacht eind oktober: ${PROJECTED}\u00a0u`,
            legend: 'Verwachting',
          }}
          format={hours}
          none="nog niet bekend"
          keys={KEYS}
          roleDescription="grafiek"
        />
      </Card>
    ),
    'Eén lijn: geen legenda, de titel noemt hem': () => (
      <Card title="Gemiddelde bouwtijd" meta="per dag">
        <Chart
          kind="line"
          label="Gemiddelde bouwtijd per dag"
          series={[{ id: 'seconds', label: 'Bouwtijd' }]}
          points={WEEK.map((point, index) => ({
            label: point.label,
            ...(point.title === undefined ? {} : { title: point.title }),
            values: [[118, 112, 109, 121, 104, 99, 111][index] ?? 0],
          }))}
          format={duration}
          step={60}
          height={144}
          keys={KEYS}
          roleDescription="grafiek"
        />
      </Card>
    ),
    'Sparkline in een StatTile': () => (
      <div className="grid w-full max-w-3xl grid-cols-2 gap-3">
        <StatTile
          label="Builds"
          value="159"
          trend={
            <TrendBadge value="12%" direction="up" tone="good" description="Gestegen met 12%" />
          }
          comparison="t.o.v. vorige week"
        >
          <div className="mt-auto">
            <Sparkline
              label="Builds per dag, de afgelopen 7 dagen, van 26 naar 5; 159 in totaal, vorige week 142"
              values={[26, 29, 30, 33, 27, 9, 5]}
              previous={[23, 27, 25, 29, 24, 8, 6]}
            />
          </div>
        </StatTile>
        <StatTile
          label="Mislukte space-starts"
          value="7"
          trend={<TrendBadge value="3" direction="down" tone="good" description="Gedaald met 3" />}
          comparison="t.o.v. vorige week"
        >
          <div className="mt-auto">
            <Sparkline
              label="Mislukte space-starts per dag, de afgelopen 7 dagen, van 2 naar 0"
              values={[2, 1, 0, 2, 1, 1, 0]}
            />
          </div>
        </StatTile>
      </div>
    ),
    'Laden: zachte vormen, de figuur bezig': () => (
      <Card title="Builds" meta="per dag">
        <Chart
          label="Builds per dag"
          series={BUILDS}
          points={[]}
          loading="Builds laden"
          loadingCount={WEEK.length}
        />
      </Card>
    ),
    'Leeg: het raster, één zin en de volgende stap': () => (
      <Card title="Builds" meta="per dag">
        <Chart
          label="Builds per dag"
          series={BUILDS}
          points={WEEK.map((point) => ({
            label: point.label,
            ...(point.title === undefined ? {} : { title: point.title }),
            values: [0, 0],
          }))}
          empty="Nog geen builds in deze periode"
          emptyNext="Kies een langere periode of start een build in een space."
          emptyAction={
            <Button variant="secondary" size="sm">
              Toon 30 dagen
            </Button>
          }
        />
      </Card>
    ),
    'Smal: 320px, een maand aan staven': () => (
      <Card title="Builds" meta="per dag" className="max-w-[320px]">
        <Chart
          label="Builds per dag in oktober"
          series={BUILDS}
          points={MONTH}
          format={nl}
          total={builds}
          height={144}
          keys={KEYS}
        />
      </Card>
    ),
    'Eén punt: één staaf en één stip': () => (
      <div className="grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-2">
        <Card title="Builds" meta="vandaag" className="">
          <Chart
            label="Builds vandaag"
            series={BUILDS}
            points={[{ label: 'vandaag', title: 'woensdag 4 november', values: [12, 1] }]}
            format={nl}
            total={builds}
            height={144}
            keys={KEYS}
          />
        </Card>
        <Card title="Gemiddelde bouwtijd" meta="vandaag" className="">
          <Chart
            kind="line"
            label="Gemiddelde bouwtijd vandaag"
            series={[{ id: 'seconds', label: 'Bouwtijd' }]}
            points={[{ label: 'vandaag', title: 'woensdag 4 november', values: [104] }]}
            format={(value) => `${nl(value)}\u00a0s`}
            height={144}
            keys={KEYS}
          />
        </Card>
      </div>
    ),
    'Categorieën: een staaf per space, elke staaf zijn naam': () => (
      <div className="flex w-full max-w-3xl flex-col gap-3">
        <Card title="Builds per app" meta="deze week">
          <Chart
            label="Builds per app, deze week"
            axis="category"
            series={BUILDS}
            points={APPS}
            format={nl}
            total={builds}
            keys={SPACE_KEYS}
            roleDescription="grafiek"
          />
        </Card>
        <Card title="Builds per space" meta="deze week">
          <Chart
            label="Builds per space, deze week"
            axis="category"
            series={BUILDS}
            points={SPACES}
            format={nl}
            total={builds}
            keys={SPACE_KEYS}
            roleDescription="grafiek"
          />
        </Card>
        <Card title="Builds per space" meta="smal" className="max-w-[320px]">
          <Chart
            label="Builds per space, deze week, smal"
            axis="category"
            series={BUILDS}
            points={SPACES}
            format={nl}
            total={builds}
            keys={SPACE_KEYS}
            roleDescription="grafiek"
          />
        </Card>
      </div>
    ),
  },
} satisfies Story
