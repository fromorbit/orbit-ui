import { type ReactNode, useState } from 'react'
import {
  Button,
  ConfirmDialog,
  CopyButton,
  Icon,
  IconButton,
  Input,
  PageHeader,
  PanelTabHeader,
  PropertyList,
  ScrollArea,
  SegmentedControl,
  Tag,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import { Missing } from '../demo-kit/Missing'
import type { DemoModule } from '../demo-kit/types'
import { AppFrame } from './parts/AppFrame'
import { type Figure, StatTileSketch } from './parts/StatTileSketch'

type Status = 'paid' | 'open' | 'failed' | 'refunded'
type Filter = 'all' | Status

const STATUS: Record<
  Status,
  { label: string; tone: 'success' | 'neutral' | 'attention' | 'danger' }
> = {
  paid: { label: 'Betaald', tone: 'success' },
  open: { label: 'Openstaand', tone: 'attention' },
  failed: { label: 'Mislukt', tone: 'danger' },
  refunded: { label: 'Terugbetaald', tone: 'neutral' },
}

interface Payment {
  id: string
  customer: string
  amount: number
  status: Status
  method: string
  date: string
  time: string
}

const PAYMENTS: Payment[] = [
  {
    id: 'tr_8Hk2Lq',
    customer: 'Fenna Brouwsma',
    amount: 129.95,
    status: 'failed',
    method: 'iDEAL',
    date: '20 okt',
    time: '13:22',
  },
  {
    id: 'tr_7Pw4Za',
    customer: 'Joris Lindeboom',
    amount: 48.5,
    status: 'paid',
    method: 'iDEAL',
    date: '20 okt',
    time: '11:05',
  },
  {
    id: 'tr_6Qm9Rt',
    customer: 'Groenhof Voorbeeld BV',
    amount: 1240.0,
    status: 'open',
    method: 'Factuur',
    date: '19 okt',
    time: '16:40',
  },
  {
    id: 'tr_5Nb1Xc',
    customer: 'Sem Oudeweg',
    amount: 15.0,
    status: 'paid',
    method: 'Creditcard',
    date: '19 okt',
    time: '09:12',
  },
  {
    id: 'tr_4Lc8Vu',
    customer: 'Mila Terhorst',
    amount: 89.0,
    status: 'refunded',
    method: 'iDEAL',
    date: '18 okt',
    time: '20:31',
  },
  {
    id: 'tr_3Kd5Ws',
    customer: 'Studio Voorbeeld',
    amount: 312.4,
    status: 'paid',
    method: 'SEPA-incasso',
    date: '18 okt',
    time: '08:00',
  },
  {
    id: 'tr_2Jf7Yp',
    customer: 'Daan Velthuis',
    amount: 64.99,
    status: 'failed',
    method: 'Creditcard',
    date: '17 okt',
    time: '22:47',
  },
  {
    id: 'tr_1Hg3Bn',
    customer: 'Noa Rietveld',
    amount: 210.0,
    status: 'paid',
    method: 'iDEAL',
    date: '17 okt',
    time: '14:15',
  },
]

const FILTERS = [
  { value: 'all', label: 'Alles' },
  { value: 'paid', label: 'Betaald' },
  { value: 'open', label: 'Openstaand' },
  { value: 'failed', label: 'Mislukt' },
  { value: 'refunded', label: 'Terugbetaald' },
] as const

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })

const TILES: Figure[] = [
  { label: 'Ontvangen', value: '€ 48.210,40', delta: '12,4%', up: true },
  { label: 'Openstaand', value: '€ 3.120,00', delta: '4,0%', up: false },
  { label: 'Terugbetaald', value: '€ 640,00', delta: '1,1%', up: false },
]

/** The detail of one payment beside the list: its facts, its history and what can be done. */
function Detail({
  payment,
  onClose,
  onRefund,
}: {
  payment: Payment
  onClose(): void
  onRefund(): void
}) {
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="flex w-80 shrink-0 flex-col border-border border-l bg-bg">
      <PanelTabHeader
        title={<span className="font-mono text-[12px]">{payment.id}</span>}
        actions={<IconButton icon="x" size="sm" label="Sluit detail" onClick={onClose} />}
      />
      <ScrollArea>
        <div className="flex flex-col gap-5 p-4">
          <div className="flex flex-col gap-1">
            <span className="text-[24px] font-medium text-fg tabular-nums">
              {euro.format(payment.amount)}
            </span>
            <span>
              <Tag tone={STATUS[payment.status].tone}>{STATUS[payment.status].label}</Tag>
            </span>
          </div>
          <PropertyList
            label="Gegevens"
            groups={[
              [
                { label: 'Klant', value: payment.customer },
                { label: 'Methode', value: payment.method },
                { label: 'Datum', value: `${payment.date} 2026, ${payment.time}` },
              ],
              [
                {
                  label: 'Referentie',
                  value: (
                    <span className="flex items-center gap-1 font-mono text-[12px]">
                      {payment.id}
                      <CopyButton text={payment.id} {...galleryLabels.copy} />
                    </span>
                  ),
                },
                { label: 'Omschrijving', value: 'Bestelling via webwinkel' },
              ],
            ]}
          />
          <Missing name="Timeline" note="Het verloop van de betaling">
            <ol className="m-0 flex list-none flex-col gap-2 p-0 text-[12px]">
              <li className="flex items-center gap-2 text-secondary">
                <Icon name="plus" size="xs" tone="faint" /> Aangemaakt · {payment.time}
              </li>
              <li className="flex items-center gap-2 text-secondary">
                <Icon name="arrow-right" size="xs" tone="faint" /> Doorgestuurd naar{' '}
                {payment.method}
              </li>
              <li className="flex items-center gap-2 text-secondary">
                <Icon
                  name={payment.status === 'failed' ? 'x' : 'check'}
                  size="xs"
                  tone={payment.status === 'failed' ? 'danger' : 'faint'}
                />
                {STATUS[payment.status].label}
              </li>
            </ol>
          </Missing>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={payment.status !== 'paid'}
              onClick={() => setConfirm(true)}
            >
              Terugbetalen
            </Button>
            <Button variant="ghost" size="sm">
              Bon versturen
            </Button>
          </div>
        </div>
      </ScrollArea>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`${euro.format(payment.amount)} terugbetalen?`}
        body={`${payment.customer} krijgt het bedrag binnen enkele dagen terug. Dit kun je niet ongedaan maken.`}
        confirmLabel="Terugbetalen"
        cancelLabel="Annuleren"
        tone="danger"
        onConfirm={onRefund}
      />
    </div>
  )
}

/** Payments: totals, a filter on status and period, the transactions, and the detail of one. */
function Payments(): ReactNode {
  const [payments, setPayments] = useState(PAYMENTS)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [chosen, setChosen] = useState<string | null>('tr_8Hk2Lq')
  const rows = payments.filter(
    (payment) =>
      (filter === 'all' || payment.status === filter) &&
      payment.customer.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const detail = payments.find((payment) => payment.id === chosen)
  return (
    <AppFrame current="betalingen">
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <ScrollArea>
            <div className="flex flex-col gap-5 px-8 py-6">
              <PageHeader
                title="Betalingen"
                meta="Bedragen in euro, inclusief btw"
                actions={
                  <>
                    <Missing
                      name="DateRangePicker"
                      inline
                      note="Periode met kalender en voorkeuzes"
                    >
                      <span className="flex items-center gap-1 text-[12px] text-fg">
                        1 – 20 okt 2026 <Icon name="chevron-down" size="xs" tone="faint" />
                      </span>
                    </Missing>
                    <Button variant="secondary" size="sm">
                      Exporteren
                    </Button>
                  </>
                }
              />
              <div className="grid grid-cols-3 gap-3">
                {TILES.map((tile) => (
                  <StatTileSketch key={tile.label} figure={tile} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-60">
                  <Input
                    label="Zoek op klant"
                    placeholder="Zoek op klant…"
                    icon="search"
                    size="sm"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    clearLabel="Wissen"
                    onClear={() => setQuery('')}
                  />
                </div>
                <SegmentedControl<Filter>
                  label="Status"
                  size="sm"
                  value={filter}
                  options={FILTERS}
                  onValueChange={setFilter}
                />
              </div>
              <Missing
                name="DataTable"
                note="Rechts uitgelijnde bedragen, sorteren op datum en bedrag"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_110px_110px_100px] gap-x-3 border-border border-b px-3 pb-1.5 text-[11px] text-muted">
                  <span>Klant</span>
                  <span>Status</span>
                  <span>Datum</span>
                  <span className="text-right">Bedrag</span>
                </div>
                {rows.map((payment) => (
                  <div
                    key={payment.id}
                    className={
                      payment.id === chosen ? 'rounded-md bg-surface-active' : 'rounded-md'
                    }
                  >
                    <Button
                      variant="plain"
                      block
                      aria-pressed={payment.id === chosen}
                      onClick={() => setChosen(payment.id)}
                    >
                      <span className="grid w-full grid-cols-[minmax(0,1fr)_110px_110px_100px] items-center gap-x-3 font-normal">
                        <span className="truncate text-[13px] text-fg">{payment.customer}</span>
                        <span>
                          <Tag tone={STATUS[payment.status].tone}>
                            {STATUS[payment.status].label}
                          </Tag>
                        </span>
                        <span className="text-[12px] text-muted tabular-nums">
                          {payment.date}, {payment.time}
                        </span>
                        <span className="text-right text-[13px] text-fg tabular-nums">
                          {euro.format(payment.amount)}
                        </span>
                      </span>
                    </Button>
                  </div>
                ))}
              </Missing>
              <Missing name="Pagination">
                <div className="flex items-center justify-end gap-2 text-[12px] text-muted">
                  <span className="tabular-nums">1–{rows.length} van 1.204</span>
                  <IconButton icon="chevron-left" size="sm" label="Vorige pagina" disabled />
                  <IconButton icon="chevron-right" size="sm" label="Volgende pagina" />
                </div>
              </Missing>
            </div>
          </ScrollArea>
        </div>
        {detail ? (
          <Detail
            key={detail.id}
            payment={detail}
            onClose={() => setChosen(null)}
            onRefund={() =>
              setPayments((now) =>
                now.map((payment) =>
                  payment.id === detail.id ? { ...payment, status: 'refunded' } : payment,
                ),
              )
            }
          />
        ) : null}
      </div>
    </AppFrame>
  )
}

export default { title: 'Betalingen', icon: 'repeat', Screen: Payments } satisfies DemoModule
