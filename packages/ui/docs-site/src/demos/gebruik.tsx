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
  PlanCard,
  PropertyList,
  ScrollArea,
  StatusMark,
  type StatusMarkKind,
  Timeline,
  TimelineItem,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import type { DemoModule, DemoScreenProps } from '../demo-kit/types'
import { AppFrame } from './parts/AppFrame'
import { type Figure, KpiTile } from './parts/KpiTile'
import { Panel } from './parts/Panel'

/** Agent hours per day of October so far, made up: quiet in the weekends. 182 in all. */
const DAILY = [11, 12, 2, 1, 13, 12, 14, 11, 10, 2, 3, 14, 13, 12, 15, 12, 2, 1, 13, 9]

/** The agent hours of the plan per month, and the days of October. */
const PLAN_HOURS = 250
const DAYS = 31

/** What the workspace used this month, against the same 20 days of September. */
const KPIS: Figure[] = [
  {
    label: 'Agent-uren',
    value: '182 u',
    delta: '14%',
    // More hours is not good news on its own: at this pace the month ends over the plan.
    tone: 'neutral',
    rising: true,
    against: 'tegenover 1–20 sep',
    // The first 20 days of each month, so the line compares the same stretch as the delta.
    trail: [131, 138, 129, 146, 152, 149, 160, 182],
  },
  {
    label: 'Reviews',
    value: '46',
    delta: '9',
    // Every chip stays neutral: the change is news, whether it is good depends on the reader.
    tone: 'neutral',
    rising: true,
    against: 'tegenover 1–20 sep',
    trail: [31, 34, 29, 38, 35, 41, 37, 46],
  },
  {
    label: 'Opnames',
    value: '128',
    delta: '31',
    tone: 'neutral',
    rising: false,
    against: 'tegenover 1–20 sep',
    trail: [204, 196, 188, 181, 172, 166, 159, 128],
  },
  {
    label: 'Opslag',
    value: '18,4 GB',
    delta: '2,1 GB',
    // Normal growth at 37% of the limit: no alarm until it nears the 50 GB.
    tone: 'neutral',
    rising: true,
    against: 'tegenover 20 sep',
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
/** What an agent hour above the plan costs, in cents, excluding VAT. */
const EXTRA_HOUR = 80
/** The plan of six members and the expected hours above it, in cents, excluding VAT. */
const PLAN_NET = 6 * 2_400
const EXTRA_NET = (PROJECTED - PLAN_HOURS) * EXTRA_HOUR

/** The open invoice of September: six members, incl. VAT, in cents. */
const OPEN_GROSS = Math.round(6 * 2_400 * 1.21)

/** A number and its unit, kept on one line. */
const unit = (value: number, name: string) => `${value.toLocaleString('nl-NL')}\u00a0${name}`

type InvoiceStatus = 'paid' | 'failed'

/** The status of an invoice as the flat mark with its glow and a word, as every status here. */
const STATUS: Record<InvoiceStatus, { label: string; kind: StatusMarkKind }> = {
  paid: { label: 'Betaald', kind: 'running' },
  failed: { label: 'Mislukt', kind: 'fault' },
}

/**
 * The mark and the word of an invoice's status. Paid is the norm of the column, so its mark is the
 * quiet size; the failed one keeps the full mark and stands out alone (Von Restorff).
 */
function InvoiceState({ status }: { status: InvoiceStatus }): ReactNode {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-secondary">
      <StatusMark kind={STATUS[status].kind} size={status === 'paid' ? 'sm' : 'md'} />
      {STATUS[status].label}
    </span>
  )
}

/** One step in the life of an invoice. */
interface Step {
  icon: IconName
  label: string
  at: string
  note?: string
  tone?: 'danger' | 'muted'
  /** The step the reader can take here instead of waiting: the one pay action of the page. */
  pay?: boolean
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
        note: 'Onvoldoende saldo op de rekening',
        tone: 'danger',
      },
      {
        icon: 'rotate-cw',
        label: 'Nieuwe poging',
        at: '24 okt',
        tone: 'muted',
        pay: true,
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
      cell: (invoice) => <InvoiceState status={invoice.status} />,
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
          onClick={(event) => event.stopPropagation()}
        />
      ),
    },
  ]
}

/**
 * One invoice as a row of two lines, for a narrow table: number and month at the start, amount and
 * status at the end, the download after it, so nothing scrolls sideways on a phone.
 */
function InvoiceCard({
  invoice,
  current,
  onSelect,
}: {
  invoice: Invoice
  current: boolean
  onSelect(number: string): void
}): ReactNode {
  return (
    <div className={`flex items-center gap-2 py-2 pr-2 pl-4 ${current ? 'bg-row-active' : ''}`}>
      <button
        type="button"
        onClick={() => onSelect(invoice.number)}
        {...(current ? { 'aria-current': 'true' as const } : {})}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-sm text-left outline-focus focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-mono text-[12px] text-fg">{invoice.number}</span>
          <span className="truncate text-[12px] text-muted">{invoice.period}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end">
          <span className="text-[13px] text-fg tabular-nums">{euro(gross(invoice))}</span>
          <InvoiceState status={invoice.status} />
        </span>
      </button>
      <IconButton icon="arrow-down" size="sm" label={`Download ${invoice.number} als pdf`} />
    </div>
  )
}

/** The invoices as a table, the newest first; a row opens beside it. Narrow, a list of rows. */
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
        card={(invoice) => (
          <InvoiceCard
            invoice={invoice}
            current={invoice.number === selected}
            onSelect={onSelect}
          />
        )}
      />
    </div>
  )
}

/** The one way to pay the open invoice now, named the same wherever it stands. */
const PAY_NOW = 'Nu betalen met iDEAL'

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
            {step.pay ? (
              <span className="mt-2 flex">
                <Button variant="secondary" size="sm">
                  {PAY_NOW}
                </Button>
              </span>
            ) : null}
          </span>
        </TimelineItem>
      ))}
    </Timeline>
  )
}

/** One invoice in full: the amount, its parts, the reference and its history. */
function InvoiceDetail({ invoice }: { invoice: Invoice }): ReactNode {
  return (
    <Panel
      headingLevel={2}
      title={invoice.number}
      meta={invoice.period}
      actions={<IconButton icon="arrow-down" size="sm" label="Download als pdf" />}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="font-heading text-[20px] text-fg leading-none tabular-nums">
            {euro(gross(invoice))}
          </span>
          <InvoiceState status={invoice.status} />
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
      </div>
    </Panel>
  )
}

/** Where the panel of the payment method is, for the variant that opens the page there. */
const PAYMENT_ID = 'betaalwijze'

/** A card not yet entered: the form waits for one. */
const NO_CARD: CardValue = { number: '', expiry: '', cvc: '', name: '' }

/**
 * The payment method: first what pays now and why to change it, then a card to add instead. No
 * picture of a card: the one method in sight is the one in use (Prägnanz).
 */
function PaymentMethod(): ReactNode {
  const [card, setCard] = useState<CardValue>(NO_CARD)
  const [submitted, setSubmitted] = useState(false)
  return (
    <section id={PAYMENT_ID} className="scroll-mt-4">
      <Panel headingLevel={2} title="Betaalwijze" meta="hoe Zilverberg betaalt">
        <div className="flex max-w-xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <PropertyList
              label="Nu"
              groups={[
                [
                  { label: 'Betaalwijze', value: 'SEPA-incasso' },
                  { label: 'Rekening', value: 'NL •••• 4021' },
                  { label: 'Op naam van', value: 'Zilverberg B.V.' },
                  {
                    label: 'Laatste poging',
                    value: (
                      <span className="inline-flex items-center gap-1.5">
                        <StatusMark kind="fault" />
                        Mislukt op 3 oktober
                      </span>
                    ),
                  },
                ],
              ]}
            />
            <p className="m-0 text-[12px] text-muted leading-relaxed">
              Met een kaart gaan de volgende facturen voortaan van de kaart af en stopt de incasso.
              De open factuur van september schrijven we dan meteen af.
            </p>
          </div>
          <section aria-labelledby="eenmalig-ideal" className="flex flex-col gap-2">
            <h3 id="eenmalig-ideal" className="m-0 font-medium text-[13px] text-fg">
              Eenmalig met iDEAL
            </h3>
            <p className="m-0 text-[12px] text-muted leading-relaxed">
              Betaal de open factuur van september ({euro(OPEN_GROSS)}) nu via je eigen bank. De
              incasso blijft voor de volgende facturen.
            </p>
            <span className="flex">
              <Button variant="secondary" size="sm">
                {PAY_NOW}
              </Button>
            </span>
          </section>
          <section aria-labelledby="kaart-toevoegen" className="flex max-w-md flex-col gap-3">
            <h3 id="kaart-toevoegen" className="m-0 font-medium text-[13px] text-fg">
              Kaart toevoegen
            </h3>
            <Form
              label="Kaart toevoegen"
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
                hideCard
              />
            </Form>
          </section>
        </div>
      </Panel>
    </section>
  )
}

/** "≈" as the eye reads it and "ongeveer" as a voice says it: some voices skip the sign. */
function About({ children }: { children: ReactNode }): ReactNode {
  return (
    <>
      <span aria-hidden="true">≈</span>
      <span className="sr-only">ongeveer</span> {children}
    </>
  )
}

/**
 * What the next invoice will be at this pace: the plan, the hours above it, and the total with VAT,
 * the figures in a column at the end like the use of the plan above it.
 */
function NextInvoice(): ReactNode {
  const net = PLAN_NET + EXTRA_NET
  const total = Math.round(net * 1.21)
  const rows: { label: string; value: ReactNode; sum?: boolean }[] = [
    { label: 'Plan, 6 leden', value: euro(PLAN_NET) },
    {
      label: `${unit(PROJECTED - PLAN_HOURS, 'u')} boven je plan`,
      value: <About>{euro(EXTRA_NET)}</About>,
    },
    { label: 'Excl. btw', value: <About>{euro(net)}</About>, sum: true },
    { label: 'Btw 21%', value: <About>{euro(total - net)}</About> },
  ]
  return (
    <section aria-labelledby="volgende-factuur" className="flex flex-col gap-2">
      <h3 id="volgende-factuur" className="m-0 font-normal text-[12px] text-muted">
        Volgende factuur, 1 november
      </h3>
      <dl className="m-0 flex flex-col gap-2 text-[13px] leading-5">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`flex items-baseline justify-between gap-3 ${row.sum ? 'border-border border-t pt-2' : ''}`}
          >
            <dt className="text-secondary">{row.label}</dt>
            <dd className="m-0 text-secondary tabular-nums">{row.value}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3">
          <dt className="font-medium text-fg">Verwacht, incl. btw</dt>
          <dd className="m-0 font-medium text-fg tabular-nums">
            <About>{euro(total)}</About>
          </dd>
        </div>
      </dl>
    </section>
  )
}

/** The plan, what of it was used this month, and the invoices with one opened beside them. */
function Usage({ variant }: DemoScreenProps): ReactNode {
  const [selected, setSelected] = useState('ZB-2026-0098')
  const invoice = INVOICES.find((entry) => entry.number === selected) ?? INVOICES[0]
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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 @3xl:px-8 @3xl:py-7">
          <PageHeader
            title="Gebruik en facturen"
            meta="Zilverberg · 1–20 oktober"
            actions={
              <Button variant="quiet" size="sm">
                Factuurgegevens
              </Button>
            }
          />
          <Banner
            tone="danger"
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="quiet" size="sm" onClick={() => setSelected('ZB-2026-0098')}>
                  Factuur bekijken
                </Button>
                <Button variant="primary" size="sm">
                  {PAY_NOW}
                </Button>
              </div>
            }
          >
            De incasso van {euro(OPEN_GROSS)} voor september is mislukt: onvoldoende saldo. We
            proberen het op 24 oktober opnieuw.
          </Banner>
          <div className="grid grid-cols-2 gap-3 @5xl:grid-cols-4">
            {KPIS.map((kpi) => (
              <KpiTile
                key={kpi.label}
                figure={kpi}
                period="de eerste 20 dagen van elke maand, de afgelopen 8 maanden"
              />
            ))}
          </div>
          {/* The plan beside the chart once both have room; each card keeps its own height. Stacked,
              the plan keeps the width of a card (30rem), so its figures stay near their lines. */}
          <div className="grid grid-cols-1 items-start gap-6 @5xl:grid-cols-[minmax(20rem,1fr)_minmax(0,2fr)]">
            {/* The one plan of the page: on the plane of every card beside it, no tag, as there
                is nothing to compare it to. */}
            <div className="w-full max-w-[30rem] @5xl:max-w-none">
              <PlanCard
                name="Team"
                price="€ 24"
                period="per lid per maand, excl. btw"
                description="Het plan van Zilverberg, voor 6 leden."
                headingLevel={2}
                features={[
                  'Onbeperkt gesprekken en specs',
                  {
                    label: `${unit(PLAN_HOURS, 'agent-uren')} per maand`,
                    detail: `${USED.toLocaleString('nl-NL')} van ${unit(PLAN_HOURS, 'u')}`,
                  },
                  { label: 'Orbit Review op 10 repositories', detail: '7 van 10' },
                  { label: '50 GB opslag voor opnames', detail: '18,4 van 50\u00a0GB' },
                ]}
                action={
                  <Button variant="secondary" size="sm">
                    Plan wijzigen
                  </Button>
                }
              >
                <NextInvoice />
              </PlanCard>
            </div>
            <Panel headingLevel={2} title="Agent-uren" meta="opgeteld, deze maand">
              <div className="flex flex-col gap-3">
                <Chart
                  kind="line"
                  label="Agent-uren in oktober, opgeteld per dag"
                  series={[
                    { id: 'used', label: 'Gebruikt' },
                    {
                      id: 'pace',
                      label: `Op koers voor ${unit(PLAN_HOURS, 'u')}`,
                      reference: true,
                    },
                  ]}
                  points={HOURS}
                  limit={{ value: PLAN_HOURS, label: `Plan ${unit(PLAN_HOURS, 'u')}` }}
                  forecast={{
                    series: 'used',
                    value: PROJECTED,
                    label: `Verwacht ≈\u00a0${unit(PROJECTED, 'u')}`,
                    text: `verwacht eind oktober: ${unit(PROJECTED, 'u')}`,
                  }}
                  format={(value) => unit(value, 'u')}
                  none="nog niet bekend"
                  keys="Pijltjes links en rechts om de dagen te lezen, Home en End voor de eerste en de laatste"
                  roleDescription="grafiek"
                />
                <p className="m-0 text-[12px] text-muted leading-relaxed">
                  Op dit tempo kom je eind oktober rond {unit(PROJECTED, 'u')} uit,{' '}
                  {unit(PROJECTED - PLAN_HOURS, 'u')} boven je plan. Elk uur daarboven kost{' '}
                  {euro(EXTRA_HOUR)}, excl. btw.
                </p>
              </div>
            </Panel>
          </div>
          {/* Wide, the list and the payment method stand in the first column and the opened invoice
              beside both, so neither column ends in an empty field; narrow, the invoice follows
              its list. */}
          <div className="grid grid-cols-1 items-start gap-6 @5xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] @5xl:grid-rows-[auto_1fr]">
            <Panel
              headingLevel={2}
              title="Facturen"
              meta={`${INVOICES.length} van 10`}
              actions={
                <Button variant="quiet" size="sm">
                  Alle facturen
                </Button>
              }
              flush
            >
              <InvoiceTable selected={selected} onSelect={setSelected} />
            </Panel>
            {invoice ? (
              <div className="min-w-0 @5xl:sticky @5xl:top-4 @5xl:col-start-2 @5xl:row-span-2 @5xl:row-start-1">
                <InvoiceDetail invoice={invoice} />
              </div>
            ) : null}
            <div className="min-w-0 @5xl:col-start-1 @5xl:row-start-2">
              <PaymentMethod />
            </div>
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
  variants: [
    { value: 'overzicht', label: 'Overzicht' },
    { value: 'betaalwijze', label: 'Betaalwijze' },
  ],
  Screen: Usage,
} satisfies DemoModule
