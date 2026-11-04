import { type ReactNode, useState } from 'react'
import {
  Banner,
  Button,
  Chart,
  type ChartPoint,
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

/** Made-up figures per period: label, value and change against the period before. */
const KPIS: Record<Period, Figure[]> = {
  '1': [
    {
      label: 'Draaiende spaces',
      value: '9 van 12',
      delta: '2',
      good: true,
      rising: true,
      against: 't.o.v. gisteren',
    },
    {
      label: 'Builds',
      value: '23',
      delta: '8%',
      good: true,
      rising: true,
      against: 't.o.v. gisteren',
    },
    {
      label: 'Gem. bouwtijd',
      value: '1 m 42 s',
      delta: '11 s',
      good: true,
      rising: false,
      against: 't.o.v. gisteren',
    },
    {
      label: 'Mislukte starts',
      value: '2',
      delta: '1',
      good: false,
      rising: true,
      against: 't.o.v. gisteren',
    },
  ],
  '7': [
    {
      label: 'Draaiende spaces',
      value: '9 van 12',
      delta: '3',
      good: true,
      rising: true,
      against: 't.o.v. vorige week',
    },
    {
      label: 'Builds',
      value: '148',
      delta: '12%',
      good: true,
      rising: true,
      against: 't.o.v. vorige week',
    },
    {
      label: 'Gem. bouwtijd',
      value: '1 m 51 s',
      delta: '6 s',
      good: true,
      rising: false,
      against: 't.o.v. vorige week',
    },
    {
      label: 'Mislukte starts',
      value: '7',
      delta: '3',
      good: true,
      rising: false,
      against: 't.o.v. vorige week',
    },
  ],
  '30': [
    {
      label: 'Draaiende spaces',
      value: '9 van 12',
      delta: '4',
      good: true,
      rising: true,
      against: 't.o.v. september',
    },
    {
      label: 'Builds',
      value: '612',
      delta: '21%',
      good: true,
      rising: true,
      against: 't.o.v. september',
    },
    {
      label: 'Gem. bouwtijd',
      value: '1 m 58 s',
      delta: '14 s',
      good: false,
      rising: true,
      against: 't.o.v. september',
    },
    {
      label: 'Mislukte starts',
      value: '31',
      delta: '9',
      good: true,
      rising: false,
      against: 't.o.v. september',
    },
  ],
}

const WEEKDAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'] as const

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
    'Gem. bouwtijd': [113, 108, 110, 104, 101, 106, 99, 102],
    'Mislukte starts': [0, 0, 0, 1, 0, 0, 1, 2],
  },
  '7': {
    'Draaiende spaces': [6, 7, 7, 8, 8, 9, 9],
    'Gem. bouwtijd': [118, 112, 109, 121, 104, 99, 111],
    'Mislukte starts': [2, 1, 0, 2, 1, 1, 0],
  },
  '30': {
    'Draaiende spaces': [5, 5, 6, 6, 7, 7, 8, 8, 9, 9],
    'Gem. bouwtijd': [104, 108, 111, 106, 113, 117, 115, 119, 121, 118],
    'Mislukte starts': [6, 5, 4, 5, 3, 4, 2, 1, 1, 0],
  },
}

/** A made-up series of builds, per hour, day or day of the month, with the failed ones on top. */
function builds(period: Period): ChartPoint[] {
  const count = period === '1' ? 24 : period === '7' ? 7 : 30
  return Array.from({ length: count }, (_, index) => {
    const label =
      period === '1'
        ? `${String(index).padStart(2, '0')}:00`
        : period === '7'
          ? (WEEKDAYS[index] ?? '')
          : `${index + 1} okt`
    const quiet = period === '1' ? index < 7 || index > 20 : period === '30' && index % 7 >= 5
    const wave = Math.sin(index / 1.7) * 5 + Math.cos(index / 3.1) * 4
    const base = period === '1' ? 2 : period === '7' ? 22 : 20
    const value = Math.max(0, Math.round((quiet ? base * 0.25 : base) + wave))
    const failed = index % 5 === 3 ? Math.max(1, Math.round(value / 8)) : 0
    return { label, values: [value, failed] }
  })
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
  const trail = (figure: Figure): Figure => ({
    ...figure,
    trail:
      figure.label === 'Builds'
        ? points.map((point) => point.values.reduce<number>((sum, value) => sum + (value ?? 0), 0))
        : (TRAILS[period][figure.label] ?? []),
  })
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
              </>
            }
          />
          <Banner
            tone="attention"
            action={
              <Button variant="secondary" size="sm">
                Logboek
              </Button>
            }
          >
            De space betaling-ideal start niet: poort 5173 is al bezet.
          </Banner>
          <div className="grid grid-cols-2 gap-3 @5xl:grid-cols-4">
            {KPIS[period].map((kpi) => (
              <KpiTile key={kpi.label} figure={trail(kpi)} period={PERIOD_TEXT[period]} />
            ))}
          </div>
          <Panel
            title="Builds"
            meta={period === '1' ? 'per uur' : 'per dag'}
            actions={
              <Button variant="ghost" size="sm">
                Alle builds
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
              empty="Nog geen builds in deze periode"
            />
          </Panel>
          <div className="grid grid-cols-1 gap-5 @4xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Panel title="Spaces" meta="6 van 12" flush>
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
