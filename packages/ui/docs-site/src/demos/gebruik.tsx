import { type ReactNode, useState } from 'react'
import {
  Banner,
  Button,
  CopyButton,
  DataTable,
  type DataTableColumn,
  Icon,
  IconButton,
  type IconName,
  PageHeader,
  PropertyList,
  ScrollArea,
  Tag,
  Timeline,
  TimelineItem,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import type { DemoModule } from '../demo-kit/types'
import { AppFrame } from './parts/AppFrame'
import { type Bar, ChartSketch } from './parts/ChartSketch'
import { type Figure, KpiTile } from './parts/KpiTile'
import { Panel } from './parts/Panel'
import { UsagePlanCard } from './parts/UsagePlanCard'

/** What the workspace used this month, against September. */
const KPIS: Figure[] = [
  {
    label: 'Agent-uren',
    value: '182 u',
    delta: '14%',
    good: true,
    rising: true,
    against: 't.o.v. september',
  },
  {
    label: 'Reviews',
    value: '46',
    delta: '9',
    good: true,
    rising: true,
    against: 't.o.v. september',
  },
  {
    label: 'Opnames',
    value: '128',
    delta: '31',
    good: true,
    rising: false,
    against: 't.o.v. september',
  },
  {
    label: 'Opslag',
    value: '18,4 GB',
    delta: '2,1 GB',
    good: false,
    rising: true,
    against: 'van 50 GB',
  },
]

/** Agent hours per day of October so far, made up: quiet in the weekends. */
const HOURS: Bar[] = Array.from({ length: 20 }, (_, index) => {
  const day = index + 1
  const weekend = [3, 4, 10, 11, 17, 18].includes(day)
  const value = weekend ? 1 + (day % 3) : Math.round(9 + Math.sin(day / 1.8) * 3 + (day % 4))
  return { label: `${day} okt`, value }
})

type InvoiceStatus = 'open' | 'paid' | 'failed'

const STATUS: Record<InvoiceStatus, { label: string; tone: 'neutral' | 'success' | 'danger' }> = {
  open: { label: 'Open', tone: 'neutral' },
  paid: { label: 'Betaald', tone: 'success' },
  failed: { label: 'Mislukt', tone: 'danger' },
}

/** One step in the life of an invoice. */
interface Step {
  icon: IconName
  label: string
  at: string
  note?: string
  tone?: 'danger' | 'muted'
}

/** One invoice of the made-up workspace. */
interface Invoice {
  number: string
  period: string
  date: string
  members: number
  /** Amount excluding VAT, in cents. */
  net: number
  status: InvoiceStatus
  method: string
  reference: string
  steps: readonly Step[]
}

const INVOICES: readonly Invoice[] = [
  {
    number: 'ZB-2026-0110',
    period: 'oktober 2026',
    date: '1 nov 2026',
    members: 6,
    net: 14_400,
    status: 'open',
    method: 'SEPA-incasso',
    reference: 'inc_7Qm2Lx9TfK',
    steps: [
      {
        icon: 'clock',
        label: 'Wordt aangemaakt',
        at: '1 nov',
        note: 'Op basis van 6 leden',
        tone: 'muted',
      },
    ],
  },
  {
    number: 'ZB-2026-0098',
    period: 'september 2026',
    date: '1 okt 2026',
    members: 6,
    net: 14_400,
    status: 'failed',
    method: 'SEPA-incasso',
    reference: 'inc_4Hd8Rw1PzA',
    steps: [
      { icon: 'file-text', label: 'Aangemaakt', at: '1 okt, 06:00' },
      { icon: 'at-sign', label: 'Verstuurd naar facturen@zilverberg.example', at: '1 okt, 06:02' },
      {
        icon: 'x',
        label: 'Incasso mislukt',
        at: '3 okt, 09:14',
        note: 'Onvoldoende saldo (AM04)',
        tone: 'danger',
      },
      {
        icon: 'rotate-cw',
        label: 'Nieuwe poging',
        at: '24 okt',
        note: 'Of betaal nu met iDEAL',
        tone: 'muted',
      },
    ],
  },
  {
    number: 'ZB-2026-0087',
    period: 'augustus 2026',
    date: '1 sep 2026',
    members: 5,
    net: 12_000,
    status: 'paid',
    method: 'SEPA-incasso',
    reference: 'inc_9Kt3Vb6NcE',
    steps: [
      { icon: 'file-text', label: 'Aangemaakt', at: '1 sep, 06:00' },
      { icon: 'at-sign', label: 'Verstuurd naar facturen@zilverberg.example', at: '1 sep, 06:01' },
      { icon: 'check', label: 'Betaald', at: '4 sep, 11:30' },
    ],
  },
  {
    number: 'ZB-2026-0071',
    period: 'juli 2026',
    date: '1 aug 2026',
    members: 5,
    net: 12_000,
    status: 'paid',
    method: 'iDEAL',
    reference: 'tr_2Wp7Gy5QsM',
    steps: [
      { icon: 'file-text', label: 'Aangemaakt', at: '1 aug, 06:00' },
      { icon: 'check', label: 'Betaald met iDEAL', at: '1 aug, 09:48' },
    ],
  },
  {
    number: 'ZB-2026-0059',
    period: 'juni 2026',
    date: '1 jul 2026',
    members: 4,
    net: 9_600,
    status: 'paid',
    method: 'iDEAL',
    reference: 'tr_8Lc1Hn4XdR',
    steps: [
      { icon: 'file-text', label: 'Aangemaakt', at: '1 jul, 06:00' },
      { icon: 'check', label: 'Betaald met iDEAL', at: '2 jul, 14:05' },
    ],
  },
]

/** Cents as Dutch euros: € 1.240,00. */
function euro(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

/** The total of an invoice: the net amount plus 21% VAT. */
function gross(invoice: Invoice): number {
  return Math.round(invoice.net * 1.21)
}

/** The columns of the invoices; the amount aligns to the end, narrow the date steps aside. */
function invoiceColumns(onSelect: (number: string) => void): DataTableColumn<Invoice>[] {
  return [
    {
      id: 'invoice',
      header: 'Factuur',
      sortValue: (invoice) => invoice.number,
      cell: (invoice) => (
        <button
          type="button"
          onClick={() => onSelect(invoice.number)}
          className="flex min-w-0 flex-col rounded-sm text-left outline-focus focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span className="truncate font-mono text-[12px] text-fg">{invoice.number}</span>
          <span className="truncate text-[12px] text-muted">{invoice.period}</span>
        </button>
      ),
    },
    {
      id: 'date',
      header: 'Datum',
      hideBelow: 'md',
      sortValue: (invoice) => invoice.number,
      cell: (invoice) => <span className="text-secondary">{invoice.date}</span>,
    },
    {
      id: 'amount',
      header: 'Bedrag',
      align: 'end',
      sortValue: (invoice) => gross(invoice),
      cell: (invoice) => euro(gross(invoice)),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (invoice) => (
        <Tag tone={STATUS[invoice.status].tone}>{STATUS[invoice.status].label}</Tag>
      ),
    },
    {
      id: 'download',
      header: 'Downloaden',
      headerHidden: true,
      align: 'end',
      cell: (invoice) => (
        <IconButton
          icon="arrow-down"
          size="sm"
          label={`Download ${invoice.number} als pdf`}
          disabled={invoice.status === 'open'}
          onClick={(event) => event.stopPropagation()}
        />
      ),
    },
  ]
}

/** The invoices as a table, the newest first; a row opens beside it. */
function InvoiceTable({
  selected,
  onSelect,
}: {
  selected: string
  onSelect(number: string): void
}): ReactNode {
  return (
    <div className="border-border border-t">
      <DataTable
        label="Facturen"
        columns={invoiceColumns(onSelect)}
        rows={INVOICES}
        rowKey={(invoice) => invoice.number}
        labels={{ selectAll: 'Alles selecteren', selectRow: (name) => `Selecteer ${name}` }}
        defaultSort={{ column: 'date', direction: 'descending' }}
        current={selected}
        onRowClick={(invoice) => onSelect(invoice.number)}
      />
    </div>
  )
}

/** What happened to an invoice, step by step. */
function InvoiceTimeline({ steps }: { steps: readonly Step[] }): ReactNode {
  return (
    <Timeline label="Verloop">
      {steps.map((step) => (
        <TimelineItem
          key={`${step.label}-${step.at}`}
          marker={<Icon name={step.icon} size="sm" />}
          tone={step.tone === 'danger' ? 'danger' : step.tone === 'muted' ? 'pending' : 'default'}
        >
          <span className="flex min-w-0 flex-col">
            <span className={`text-[13px] ${step.tone === 'muted' ? 'text-secondary' : 'text-fg'}`}>
              {step.label}
            </span>
            <span className="text-[12px] text-muted">
              {step.note === undefined ? step.at : `${step.at} · ${step.note}`}
            </span>
          </span>
        </TimelineItem>
      ))}
    </Timeline>
  )
}

/** One invoice in full: the amount, its parts, the reference and its history. */
function InvoiceDetail({ invoice }: { invoice: Invoice }): ReactNode {
  const status = STATUS[invoice.status]
  return (
    <Panel
      title={invoice.number}
      meta={invoice.period}
      actions={
        <IconButton
          icon="arrow-down"
          size="sm"
          label="Download als pdf"
          disabled={invoice.status === 'open'}
        />
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="font-heading text-[28px] text-fg leading-none tabular-nums tracking-[-0.02em]">
            {euro(gross(invoice))}
          </span>
          <Tag tone={status.tone}>{status.label}</Tag>
        </div>
        <PropertyList
          label="Factuur"
          groups={[
            [
              { label: 'Plan', value: `Team · ${invoice.members} leden` },
              { label: 'Excl. btw', value: euro(invoice.net) },
              { label: 'Btw 21%', value: euro(gross(invoice) - invoice.net) },
            ],
            [
              { label: 'Betaalwijze', value: invoice.method },
              {
                label: 'Referentie',
                value: (
                  <span className="flex items-center gap-1">
                    <span className="font-mono text-[12px]">{invoice.reference}</span>
                    <CopyButton text={invoice.reference} {...galleryLabels.copy} />
                  </span>
                ),
              },
            ],
          ]}
        />
        <InvoiceTimeline steps={invoice.steps} />
        {invoice.status === 'failed' ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm">
              Nu betalen met iDEAL
            </Button>
            <Button variant="secondary" size="sm">
              Betaalwijze wijzigen
            </Button>
          </div>
        ) : null}
      </div>
    </Panel>
  )
}

/** The plan, what of it was used this month, and the invoices with one opened beside them. */
function Usage(): ReactNode {
  const [selected, setSelected] = useState('ZB-2026-0098')
  const invoice = INVOICES.find((entry) => entry.number === selected) ?? INVOICES[0]
  return (
    <AppFrame product="orbit" current="gebruik">
      <ScrollArea>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 @3xl:px-8 @3xl:py-7">
          <PageHeader
            title="Gebruik en facturen"
            meta="Zilverberg · oktober tot en met de 20e"
            actions={
              <Button variant="secondary" size="sm">
                Factuurgegevens
              </Button>
            }
          />
          <Banner
            tone="danger"
            action={
              <Button variant="secondary" size="sm" onClick={() => setSelected('ZB-2026-0098')}>
                Bekijk factuur
              </Button>
            }
          >
            De incasso van september is mislukt. We proberen het op 24 oktober opnieuw.
          </Banner>
          <div className="grid grid-cols-2 gap-3 @5xl:grid-cols-4">
            {KPIS.map((kpi) => (
              <KpiTile key={kpi.label} figure={kpi} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <UsagePlanCard />
            <Panel title="Agent-uren" meta="per dag, deze maand">
              <ChartSketch
                bars={HOURS}
                legend={{ value: 'Agent-uren' }}
                unit="uur"
                note="Staafgrafiek met as, raster en tooltip per dag"
              />
            </Panel>
          </div>
          <div className="grid grid-cols-1 items-start gap-5 @5xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Panel title="Facturen" meta={`${INVOICES.length} van 11`} flush>
              <InvoiceTable selected={selected} onSelect={setSelected} />
            </Panel>
            {invoice ? <InvoiceDetail invoice={invoice} /> : null}
          </div>
        </div>
      </ScrollArea>
    </AppFrame>
  )
}

export default {
  title: 'Gebruik en facturen',
  description:
    'Wat de werkruimte deze maand van Orbit gebruikte, het plan en de facturen. Een mislukte incasso staat bovenaan, met het verloop ernaast.',
  icon: 'sliders-horizontal',
  product: 'orbit',
  Screen: Usage,
} satisfies DemoModule
