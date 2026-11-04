import { type ReactNode, useState } from 'react'
import {
  Banner,
  Button,
  Chart,
  type ChartPoint,
  IconButton,
  List,
  ListRow,
  PageHeader,
  ProgressMeter,
  RelativeTime,
  ScrollArea,
  SegmentedControl,
  StatusMark,
  type StatusMarkKind,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import type { DemoModule } from '../demo-kit/types'
import { AppFrame, HOUR, MINUTE, NOW } from './parts/AppFrame'
import { type Figure, KpiTile } from './parts/KpiTile'
import { Panel } from './parts/Panel'

type Period = '1' | '7' | '30'

const PERIODS = [
  { value: '1', label: '24 uur' },
  { value: '7', label: '7 dagen' },
  { value: '30', label: '30 dagen' },
] as const

/** What a figure is compared with, per period. */
const AGAINST: Record<Period, string> = {
  '1': 't.o.v. gisteren',
  '7': 't.o.v. vorige week',
  '30': 't.o.v. 30 dagen ervoor',
}

/**
 * Made-up figures per period: label, value and change against the period before. The value of
 * Builds is left out here: it is the sum of the chart under the tiles, so the two always agree.
 */
const KPIS: Record<Period, Omit<Figure, 'against'>[]> = {
  '1': [
    { label: 'Draaiende spaces', value: '9 van 12', delta: '2', tone: 'good', rising: true },
    { label: 'Builds', value: '', delta: '8%', tone: 'good', rising: true },
    {
      label: 'Gemiddelde bouwtijd',
      value: '1 min 42 s',
      delta: '11 s',
      tone: 'good',
      rising: false,
    },
    { label: 'Mislukte starts', value: '2', delta: '1', tone: 'bad', rising: true },
  ],
  '7': [
    { label: 'Draaiende spaces', value: '9 van 12', delta: '3', tone: 'good', rising: true },
    { label: 'Builds', value: '', delta: '12%', tone: 'good', rising: true },
    {
      label: 'Gemiddelde bouwtijd',
      value: '1 min 51 s',
      delta: '6 s',
      tone: 'good',
      rising: false,
    },
    { label: 'Mislukte starts', value: '7', delta: '3', tone: 'good', rising: false },
  ],
  '30': [
    { label: 'Draaiende spaces', value: '9 van 12', delta: '4', tone: 'good', rising: true },
    { label: 'Builds', value: '', delta: '21%', tone: 'good', rising: true },
    { label: 'Gemiddelde bouwtijd', value: '1 min 58 s', delta: '14 s', tone: 'bad', rising: true },
    { label: 'Mislukte starts', value: '31', delta: '9', tone: 'good', rising: false },
  ],
}

const WEEKDAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'] as const
const WEEKDAY_NAMES = [
  'maandag',
  'dinsdag',
  'woensdag',
  'donderdag',
  'vrijdag',
  'zaterdag',
  'zondag',
] as const

/** What a period is called under a sparkline, for a screen reader. */
const PERIOD_TEXT: Record<Period, string> = {
  '1': 'per uur, de afgelopen 24 uur',
  '7': 'per dag, de afgelopen 7 dagen',
  '30': 'per dag, de afgelopen 30 dagen',
}

/** The course of the other figures over each period, made up, for the sparklines of the tiles. */
const TRAILS: Record<Period, Record<string, readonly number[]>> = {
  '1': {
    'Draaiende spaces': [7, 7, 7, 8, 8, 8, 9, 9],
    'Gemiddelde bouwtijd': [113, 108, 110, 104, 101, 106, 99, 102],
    'Mislukte starts': [0, 0, 0, 1, 0, 0, 1, 2],
  },
  '7': {
    'Draaiende spaces': [6, 7, 7, 8, 8, 9, 9],
    'Gemiddelde bouwtijd': [118, 112, 109, 121, 104, 99, 111],
    'Mislukte starts': [2, 1, 0, 2, 1, 1, 0],
  },
  '30': {
    'Draaiende spaces': [5, 5, 6, 6, 7, 7, 8, 8, 9, 9],
    'Gemiddelde bouwtijd': [104, 108, 111, 106, 113, 117, 115, 119, 121, 118],
    'Mislukte starts': [6, 5, 4, 5, 3, 4, 2, 1, 1, 0],
  },
}

/** Builds per hour of a working day: quiet at night, busy from nine to six. */
const HOURLY = [0, 0, 0, 0, 0, 0, 1, 2, 4, 7, 9, 8, 5, 8, 9, 8, 7, 5, 3, 2, 1, 1, 0, 0]
/** The failed ones among them: one late in the morning, one in the afternoon. */
const HOURLY_FAILED: Record<number, number> = { 11: 1, 15: 1 }

/** Builds per day of the past week, quiet in the weekend, with a bad Thursday. */
const DAILY = [26, 29, 30, 29, 27, 8, 5]
const DAILY_FAILED = [0, 0, 0, 4, 0, 1, 0]

const MONTHS = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
] as const
const DAY = 24 * HOUR

/** A made-up series of builds, per hour, day or day of the past 30, with the failed ones on top. */
function builds(period: Period): ChartPoint[] {
  if (period === '1') {
    return HOURLY.map((value, hour) => {
      const label = `${String(hour).padStart(2, '0')}:00`
      return { label, values: [value, HOURLY_FAILED[hour] ?? 0] }
    })
  }
  if (period === '7') {
    return DAILY.map((value, index) => ({
      label: WEEKDAYS[index] ?? '',
      title: WEEKDAY_NAMES[index] ?? '',
      values: [value, DAILY_FAILED[index] ?? 0],
    }))
  }
  // The 30 days up to today, quiet in the weekends, a failure every few days.
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(NOW - (29 - index) * DAY)
    const weekday = (date.getUTCDay() + 6) % 7
    const wave = Math.sin(index / 1.7) * 4 + Math.cos(index / 3.1) * 3
    const value = Math.max(1, Math.round((weekday >= 5 ? 5 : 20) + (weekday >= 5 ? 0 : wave)))
    const failed = index % 5 === 3 && weekday < 5 ? Math.max(1, Math.round(value / 8)) : 0
    const month = MONTHS[date.getUTCMonth()] ?? ''
    return {
      label: `${date.getUTCDate()} ${month.slice(0, 3)}`,
      title: `${WEEKDAY_NAMES[weekday] ?? ''} ${date.getUTCDate()} ${month}`,
      values: [value, failed],
    }
  })
}

/** The builds and the failed ones of a series, and where most of them failed, in one sentence. */
function summary(period: Period, points: readonly ChartPoint[]): string {
  const all = points.reduce(
    (sum, point) => sum + (point.values[0] ?? 0) + (point.values[1] ?? 0),
    0,
  )
  const failed = points.reduce((sum, point) => sum + (point.values[1] ?? 0), 0)
  const worst = points.reduce<ChartPoint | undefined>(
    (best, point) => ((point.values[1] ?? 0) > (best?.values[1] ?? 0) ? point : best),
    undefined,
  )
  const where =
    worst === undefined || failed < 2
      ? ''
      : period === '1'
        ? `, de meeste om ${worst.label}`
        : `, de meeste op ${worst.title ?? worst.label}`
  return `${failed} van de ${all.toLocaleString('nl-NL')} builds mislukt${where}.`
}

/** Seconds as the tile writes them: "1 min 51 s". */
function duration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes === 0 ? `${rest}\u00a0s` : `${minutes}\u00a0min ${rest}\u00a0s`
}

/** The made-up builds of the period before, per point: about the share the delta says fewer. */
function previousBuilds(perPoint: readonly number[], rise: number): number[] {
  return perPoint.map((value, index) =>
    Math.max(0, Math.round((value / (1 + rise)) * (1 + Math.sin(index * 2.3) * 0.08))),
  )
}

/** The rise of Builds per period, as the share its delta says. */
const RISE: Record<Period, number> = { '1': 0.08, '7': 0.12, '30': 0.21 }

/** How the plot is read by key, as its description for a screen reader. */
const KEYS: Record<Period, string> = {
  '1': 'Pijltjes links en rechts om de uren te lezen, Home en End voor het eerste en het laatste',
  '7': 'Pijltjes links en rechts om de dagen te lezen, Home en End voor de eerste en de laatste',
  '30': 'Pijltjes links en rechts om de dagen te lezen, Home en End voor de eerste en de laatste',
}

/** One space of the made-up web shop: a branch of the app running on its own address. */
interface Space {
  name: string
  branch: string
  kind: StatusMarkKind
  status: string
  since: number
}

const SPACES: Space[] = [
  { name: 'webwinkel', branch: 'main', kind: 'running', status: 'Draait', since: 3 * HOUR },
  {
    name: 'webwinkel',
    branch: 'betaling-ideal',
    kind: 'fault',
    status: 'Start niet',
    since: 12 * MINUTE,
  },
  { name: 'webwinkel', branch: 'zoeken-v2', kind: 'running', status: 'Draait', since: 47 * MINUTE },
  { name: 'beheer', branch: 'main', kind: 'running', status: 'Draait', since: 26 * HOUR },
  {
    name: 'nieuwsbrief',
    branch: 'sjablonen',
    kind: 'blocked',
    status: 'Wacht op geheim',
    since: 2 * HOUR,
  },
  {
    name: 'webwinkel',
    branch: 'cadeaubon',
    kind: 'stopped',
    status: 'Gestopt',
    since: 3 * 24 * HOUR,
  },
]

/** The machine every space runs on, and how full it is. */
const HOST = [
  { label: 'Processor', value: 38, max: 100, text: '38%' },
  { label: 'Geheugen', value: 11.2, max: 32, text: '11,2 van 32 GB' },
  { label: 'Schijf', value: 184, max: 512, text: '184 van 512 GB' },
] as const

/**
 * Halo's first screen: how the spaces of the workspace are doing, how many builds ran and how
 * full the host is, with the one space that needs attention on top.
 */
function Overview(): ReactNode {
  const [period, setPeriod] = useState<Period>('7')
  const points = builds(period)
  const perPoint = points.map((point) =>
    point.values.reduce<number>((sum, value) => sum + (value ?? 0), 0),
  )
  const all = perPoint.reduce((sum, value) => sum + value, 0)
  const figure = (kpi: Omit<Figure, 'against'>): Figure =>
    kpi.label === 'Builds'
      ? {
          ...kpi,
          value: all.toLocaleString('nl-NL'),
          against: AGAINST[period],
          trail: perPoint,
          // The line follows the day; the delta compares the totals, so the period before is drawn behind it.
          previous: previousBuilds(perPoint, RISE[period]),
        }
      : {
          ...kpi,
          against: AGAINST[period],
          trail: TRAILS[period][kpi.label] ?? [],
          ...(kpi.label === 'Gemiddelde bouwtijd' ? { unit: duration } : {}),
        }
  return (
    <AppFrame product="halo" current="dashboard">
      <ScrollArea>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 @3xl:px-8 @3xl:py-7">
          <PageHeader
            title="Overzicht"
            meta="Zilverberg · 4 apps · 12 spaces"
            actions={
              <>
                <SegmentedControl<Period>
                  label="Periode"
                  size="sm"
                  value={period}
                  options={PERIODS}
                  onValueChange={setPeriod}
                />
                <div className="hidden @xl:block">
                  <Button variant="primary" size="sm">
                    Nieuwe space
                  </Button>
                </div>
                <div className="@xl:hidden">
                  <IconButton icon="plus" variant="primary" size="sm" label="Nieuwe space" />
                </div>
              </>
            }
          />
          <Banner
            tone="attention"
            action={
              <Button variant="secondary" size="sm">
                Andere poort kiezen
              </Button>
            }
          >
            De space betaling-ideal start niet: poort 5173 is al bezet.
          </Banner>
          <div className="grid grid-cols-2 gap-3 @5xl:grid-cols-4">
            {KPIS[period].map((kpi) => (
              <KpiTile key={kpi.label} figure={figure(kpi)} period={PERIOD_TEXT[period]} />
            ))}
          </div>
          <Panel
            title="Builds"
            meta={period === '1' ? 'per uur' : 'per dag'}
            actions={
              <Button variant="ghost" size="sm">
                Bekijk alle builds
              </Button>
            }
          >
            <Chart
              label={period === '1' ? 'Builds per uur' : 'Builds per dag'}
              series={[
                { id: 'ok', label: 'Geslaagd' },
                { id: 'failed', label: 'Mislukt', tone: 'danger' },
              ]}
              points={points}
              format={(value) => value.toLocaleString('nl-NL')}
              total={(value) => `${value.toLocaleString('nl-NL')}\u00a0builds`}
              empty="Nog geen builds in deze periode"
              emptyNext="Kies een langere periode of start een build in een space."
              emptyAction={
                <Button variant="secondary" size="sm" onClick={() => setPeriod('30')}>
                  Toon 30 dagen
                </Button>
              }
              keys={KEYS[period]}
              roleDescription="grafiek"
            />
            <p aria-live="polite" className="m-0 mt-3 text-[12px] text-muted">
              {summary(period, points)}
            </p>
          </Panel>
          <div className="grid grid-cols-1 gap-5 @4xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Panel title="Spaces" meta={`${SPACES.length} getoond`} flush>
              <div className="px-2 pb-2">
                <List label="Spaces">
                  {SPACES.map((space) => (
                    <ListRow
                      key={`${space.name}/${space.branch}`}
                      title={`${space.name} · ${space.branch}`}
                      marker={<StatusMark kind={space.kind} />}
                      status={space.status}
                      meta={
                        <RelativeTime
                          labels={galleryLabels.time}
                          at={NOW - space.since}
                          now={NOW}
                        />
                      }
                    />
                  ))}
                </List>
              </div>
            </Panel>
            <Panel title="Host" meta="halo-01 · 6 kernen">
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {HOST.map((part) => (
                  <li key={part.label} className="flex flex-col gap-1.5">
                    <span className="flex items-baseline justify-between gap-2 text-[12px]">
                      <span className="text-secondary">{part.label}</span>
                      <span className="text-muted tabular-nums">{part.text}</span>
                    </span>
                    <ProgressMeter
                      value={part.value}
                      max={part.max}
                      label={part.label}
                      valueText={() => part.text}
                      width="fill"
                      count={false}
                    />
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-5 border-border border-t pt-3 text-[12px] text-muted">
                Laatste opruimronde{' '}
                <RelativeTime labels={galleryLabels.time} at={NOW - 5 * HOUR} now={NOW} />: 3 oude
                images en 2 volumes weg.
              </p>
            </Panel>
          </div>
        </div>
      </ScrollArea>
    </AppFrame>
  )
}

export default {
  title: 'Overzicht',
  description:
    'Het eerste scherm van Halo: hoe de spaces erbij staan, hoeveel builds er liepen en hoe vol de host is. De ene space die aandacht vraagt staat bovenaan.',
  icon: 'columns',
  product: 'halo',
  Screen: Overview,
} satisfies DemoModule
