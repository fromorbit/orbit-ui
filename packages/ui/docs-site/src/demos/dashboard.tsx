import { type ReactNode, useState } from 'react'
import {
  Banner,
  Button,
  List,
  ListRow,
  PageHeader,
  ProgressMeter,
  RelativeTime,
  ScrollArea,
  SectionHeading,
  SegmentedControl,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import { Missing } from '../demo-kit/Missing'
import type { DemoModule } from '../demo-kit/types'
import { AppFrame, HOUR, MINUTE, NOW } from './parts/AppFrame'
import { type Figure, StatTileSketch } from './parts/StatTileSketch'

type Period = '7' | '30' | '90'

const PERIODS = [
  { value: '7', label: '7 dagen' },
  { value: '30', label: '30 dagen' },
  { value: '90', label: '90 dagen' },
] as const

/** Made-up figures per period: label, value and change against the period before. */
const KPIS: Record<Period, Figure[]> = {
  '7': [
    { label: 'Omzet', value: '€ 12.480', delta: '8,1%', up: true },
    { label: 'Bestellingen', value: '312', delta: '3,4%', up: true },
    { label: 'Nieuwe klanten', value: '48', delta: '2,0%', up: false },
    { label: 'Conversie', value: '3,2%', delta: '0,4%', up: true },
  ],
  '30': [
    { label: 'Omzet', value: '€ 48.210', delta: '12,4%', up: true },
    { label: 'Bestellingen', value: '1.204', delta: '6,8%', up: true },
    { label: 'Nieuwe klanten', value: '196', delta: '4,1%', up: true },
    { label: 'Conversie', value: '3,0%', delta: '0,2%', up: false },
  ],
  '90': [
    { label: 'Omzet', value: '€ 139.950', delta: '18,9%', up: true },
    { label: 'Bestellingen', value: '3.517', delta: '9,3%', up: true },
    { label: 'Nieuwe klanten', value: '601', delta: '1,2%', up: false },
    { label: 'Conversie', value: '2,9%', delta: '0,1%', up: true },
  ],
}

/** A made-up series of daily revenue, as a share of the best day. */
function series(period: Period): number[] {
  const count = period === '7' ? 7 : period === '30' ? 30 : 45
  return Array.from({ length: count }, (_, day) => {
    const wave = Math.sin(day / 2.3) * 18 + Math.cos(day / 5.1) * 12
    return Math.round(55 + wave + (day % 7 === 5 ? -20 : 0) + day * 0.4)
  })
}

const PAGES = [
  { title: '/winkel/zomercollectie', views: 8420 },
  { title: '/blog/tien-tips-voor-de-tuin', views: 6115 },
  { title: '/winkel/cadeaubonnen', views: 4380 },
  { title: '/over-ons', views: 2210 },
  { title: '/contact', views: 1480 },
]

/** The usual first screen: figures, one chart, what happened lately and what is read most. */
function Dashboard(): ReactNode {
  const [period, setPeriod] = useState<Period>('30')
  const bars = series(period)
  const top = PAGES[0]?.views ?? 1
  return (
    <AppFrame current="dashboard">
      <ScrollArea>
        <div className="flex flex-col gap-6 px-8 py-6">
          <PageHeader
            title="Overzicht"
            meta="Bijgewerkt om 14:00"
            actions={
              <>
                <SegmentedControl<Period>
                  label="Periode"
                  size="sm"
                  value={period}
                  options={PERIODS}
                  onValueChange={setPeriod}
                />
                <Button variant="secondary" size="sm">
                  Exporteren
                </Button>
              </>
            }
          />
          <Banner
            tone="attention"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => (location.hash = '#/demo/betalingen')}
              >
                Bekijk
              </Button>
            }
          >
            Twee betalingen zijn sinds gisteren mislukt.
          </Banner>
          <div className="grid grid-cols-4 gap-3">
            {KPIS[period].map((kpi) => (
              <StatTileSketch key={kpi.label} figure={kpi} />
            ))}
          </div>
          <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
            <SectionHeading level={2}>Omzet per dag</SectionHeading>
            <Missing name="Chart" note="Vlakgrafiek met as, raster en tooltip per dag">
              <div aria-hidden="true" className="flex h-44 items-end gap-1">
                {bars.map((height, index) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: a sketch of fixed bars, never reordered
                    key={index}
                    className="min-w-0 flex-1 rounded-t-sm bg-accent/50"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </Missing>
          </section>
          <div className="grid grid-cols-2 gap-6">
            <section className="flex flex-col gap-2">
              <SectionHeading level={2}>Recente activiteit</SectionHeading>
              <List label="Recente activiteit">
                <ListRow
                  title="Bestelling #4821 betaald"
                  kind="done"
                  status="Betaald"
                  meta={
                    <RelativeTime labels={galleryLabels.time} at={NOW - 4 * MINUTE} now={NOW} />
                  }
                />
                <ListRow
                  title="Betaling van Fenna Brouwsma mislukt"
                  kind="failed"
                  status="Mislukt"
                  meta={
                    <RelativeTime labels={galleryLabels.time} at={NOW - 38 * MINUTE} now={NOW} />
                  }
                />
                <ListRow
                  title="Artikel ‘Tien tips voor de tuin’ gepland"
                  kind="queued"
                  status="Gepland"
                  meta={<RelativeTime labels={galleryLabels.time} at={NOW - 2 * HOUR} now={NOW} />}
                />
                <ListRow
                  title="Voorraad cadeaubonnen bijna op"
                  kind="attention"
                  status="Let op"
                  meta={<RelativeTime labels={galleryLabels.time} at={NOW - 5 * HOUR} now={NOW} />}
                />
                <ListRow
                  title="Import van productfoto’s loopt"
                  kind="running"
                  status="Bezig"
                  meta={<RelativeTime labels={galleryLabels.time} at={NOW - 9 * HOUR} now={NOW} />}
                />
              </List>
            </section>
            <section className="flex flex-col gap-2">
              <SectionHeading level={2}>Meest bekeken</SectionHeading>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {PAGES.map((page) => (
                  <li key={page.title} className="flex items-center gap-3">
                    <span className="w-52 shrink-0 truncate font-mono text-[12px] text-secondary">
                      {page.title}
                    </span>
                    <ProgressMeter
                      value={page.views}
                      max={top}
                      label={`Weergaven van ${page.title}`}
                      valueText={(value) => `${value.toLocaleString('nl-NL')} weergaven`}
                      width="fill"
                      count={false}
                    />
                    <span className="w-14 text-right text-[12px] text-muted tabular-nums">
                      {page.views.toLocaleString('nl-NL')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </ScrollArea>
    </AppFrame>
  )
}

export default { title: 'Dashboard', icon: 'columns', Screen: Dashboard } satisfies DemoModule
