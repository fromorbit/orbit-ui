import { type ReactNode, useEffect, useState } from 'react'
import {
  Banner,
  Button,
  type CardValue,
  Chart,
  type ChartPoint,
  CopyButton,
  CreditCardField,
  DataTable,
  type DataTableColumn,
  Form,
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
import type { DemoModule, DemoScreenProps } from '../demo-kit/types'
import { AppFrame } from './parts/AppFrame'
import { type Figure, KpiTile } from './parts/KpiTile'
import { Panel } from './parts/Panel'
import { UsagePlanCard } from './parts/UsagePlanCard'

/** Agent hours per day of October so far, made up: quiet in the weekends. 182 in all. */
const DAILY = [11, 12, 2, 1, 13, 12, 14, 11, 10, 2, 3, 14, 13, 12, 15, 12, 2, 1, 13, 9]

/** The agent hours of the plan per month, and the days of October. */
const PLAN_HOURS = 250
const DAYS = 31

/** What the workspace used this month, against September. */
const KPIS: Figure[] = [
  {
    label: 'Agent-uren',
    value: '182 u',
    delta: '14%',
    // More hours is not good news on its own: at this pace the month ends over the plan.
    tone: 'neutral',
    rising: true,
    against: 't.o.v. september',
    trail: [131, 138, 129, 146, 152, 149, 160, 182],
  },
  {
    label: 'Reviews',
    value: '46',
    delta: '9',
    tone: 'good',
    rising: true,
    against: 't.o.v. september',
    trail: [31, 34, 29, 38, 35, 41, 37, 46],
  },
  {
    label: 'Opnames',
    value: '128',
    delta: '31',
    tone: 'neutral',
    rising: false,
    against: 't.o.v. september',
    trail: [204, 196, 188, 181, 172, 166, 159, 128],
  },
  {
    label: 'Opslag',
    value: '18,4 GB',
    delta: '2,1 GB',
    // Normal growth at 37% of the limit: no alarm until it nears the 50 GB.
    tone: 'neutral',
    rising: true,
    against: 'erbij',
    meter: { value: 18.4, max: 50, text: '18,4 van 50 GB', note: '37% van 50 GB' },
  },
]

/**
 * The agent hours of October added up per day, against the pace that ends the month at the plan's
 * 250: the days to come have no use yet, the pace runs on to the 31st.
 */
const HOURS: ChartPoint[] = Array.from({ length: DAYS }, (_, index) => ({
  label: `${index + 1} okt`,
  title: `${index + 1} oktober`,
  values: [
    index < DAILY.length ? DAILY.slice(0, index + 1).reduce((sum, hours) => sum + hours, 0) : null,
    Math.round((PLAN_HOURS * (index + 1)) / DAYS),
  ],
}))

/** Where the month ends at this pace: 182 hours in 20 days is about 282 by the 31st. */
const USED = DAILY.reduce((sum, hours) => sum + hours, 0)
const PROJECTED = Math.round((USED / DAILY.length) * DAYS)

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
function InvoiceDetail({
  invoice,
  toPayment,
}: {
  invoice: Invoice
  toPayment: () => void
}): ReactNode {
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
          <span className="font-heading text-[20px] text-fg leading-none tabular-nums">
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
            <Button variant="secondary" size="sm" onClick={toPayment}>
              Betaalwijze wijzigen
            </Button>
          </div>
        ) : null}
      </div>
    </Panel>
  )
}

/** Where the panel of the payment method is, for the button of a failed invoice. */
const PAYMENT_ID = 'betaalwijze'

/** A card being entered after the failed direct debit: number and expiry typed, the code not yet. */
const NEW_CARD: CardValue = {
  number: '4242424242424242',
  expiry: '0829',
  cvc: '',
  name: 'Iris Kamphorst',
}

/**
 * The payment method: what pays now, and a card to pay with instead. The picture of the card fills
 * in as it is typed and turns over for the code.
 */
function PaymentMethod(): ReactNode {
  const [card, setCard] = useState<CardValue>(NEW_CARD)
  const [submitted, setSubmitted] = useState(false)
  return (
    <section id={PAYMENT_ID} className="scroll-mt-4">
      <Panel title="Betaalwijze" meta="wat Zilverberg betaalt">
        <div className="grid grid-cols-1 gap-8 @4xl:grid-cols-[20rem_minmax(0,1fr)]">
          <Form
            label="Betalen met een kaart"
            onSubmit={() => setSubmitted(true)}
            actions={
              <Button type="submit" variant="secondary">
                Kaart gebruiken
              </Button>
            }
          >
            <CreditCardField
              value={card}
              onValueChange={setCard}
              labels={galleryLabels.creditCard}
              showErrors={submitted}
              now={new Date(2026, 9, 20)}
            />
          </Form>
          <div className="flex flex-col gap-4">
            <PropertyList
              label="Nu"
              groups={[
                [
                  { label: 'Betaalwijze', value: 'SEPA-incasso' },
                  { label: 'Rekening', value: 'NL·· ···· 4021' },
                  { label: 'Op naam van', value: 'Zilverberg B.V.' },
                  { label: 'Laatste poging', value: 'mislukt op 3 oktober' },
                ],
              ]}
            />
            <p className="m-0 max-w-md text-[12px] text-muted leading-relaxed">
              Met een kaart gaan de volgende facturen van de kaart af. De incasso stopt dan, en de
              open factuur van september betaalt de kaart meteen.
            </p>
          </div>
        </div>
      </Panel>
    </section>
  )
}

/** The plan, what of it was used this month, and the invoices with one opened beside them. */
function Usage({ variant }: DemoScreenProps): ReactNode {
  const [selected, setSelected] = useState('ZB-2026-0098')
  const invoice = INVOICES.find((entry) => entry.number === selected) ?? INVOICES[0]
  const toPayment = () => {
    const field = document.getElementById(PAYMENT_ID)
    field?.scrollIntoView({ block: 'start' })
    field?.querySelector<HTMLInputElement>('input[autocomplete="cc-number"]')?.focus({
      preventScroll: true,
    })
  }
  // The variant "Betaalwijze" opens the page at the card; only the scroll area moves, not the page.
  useEffect(() => {
    if (variant !== 'betaalwijze') return
    const panel = document.getElementById(PAYMENT_ID)
    const viewport = panel?.closest<HTMLElement>('[data-radix-scroll-area-viewport]')
    if (!panel || !viewport) return
    viewport.scrollTop +=
      panel.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 16
  }, [variant])
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
              <KpiTile key={kpi.label} figure={kpi} period="per maand, de afgelopen 8 maanden" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 @5xl:grid-cols-[minmax(17rem,1fr)_minmax(0,2fr)]">
            <UsagePlanCard />
            <Panel title="Agent-uren" meta="opgeteld, deze maand">
              <div className="flex flex-col gap-3">
                <Chart
                  kind="line"
                  label="Agent-uren in oktober, opgeteld per dag"
                  series={[
                    { id: 'used', label: 'Gebruikt' },
                    { id: 'pace', label: `Op koers voor ${PLAN_HOURS} u`, reference: true },
                  ]}
                  points={HOURS}
                  limit={{ value: PLAN_HOURS, label: `Plan ${PLAN_HOURS} u` }}
                  format={(value) => `${value.toLocaleString('nl-NL')} u`}
                  none="nog geen waarde"
                />
                <p className="m-0 text-[12px] text-muted">
                  Op dit tempo kom je eind oktober rond {PROJECTED} u uit, {PROJECTED - PLAN_HOURS}{' '}
                  u boven je plan.
                </p>
              </div>
            </Panel>
          </div>
          <div className="grid grid-cols-1 items-start gap-5 @5xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Panel title="Facturen" meta={`${INVOICES.length} van 11`} flush>
              <InvoiceTable selected={selected} onSelect={setSelected} />
            </Panel>
            {invoice ? <InvoiceDetail invoice={invoice} toPayment={toPayment} /> : null}
          </div>
          <PaymentMethod />
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
  variants: [
    { value: 'overzicht', label: 'Overzicht' },
    { value: 'betaalwijze', label: 'Betaalwijze' },
  ],
  Screen: Usage,
} satisfies DemoModule
