import { type ReactNode, useState } from 'react'
import {
  Avatar,
  Banner,
  BrandIcon,
  Button,
  Icon,
  IconButton,
  List,
  ListRow,
  PathLabel,
  PierreDiff,
  PierreFileIcon,
  ProgressMeter,
  ScrollArea,
  Select,
  StatusMark,
  StepChips,
  Switch,
} from '../../../src'
import type { DemoModule, DemoScreenProps } from '../demo-kit/types'
import { AppFrame } from './parts/AppFrame'
import { Panel } from './parts/Panel'
import { type Finding, ReviewFindings } from './parts/ReviewFindings'
import { ReviewSeen } from './parts/ReviewSeen'

/** The pull request under review, made up: a web shop that learns to take iDEAL. */
const PULL = {
  number: 42,
  title: 'iDEAL als betaalmethode',
  author: 'Daan Velthuis',
  from: 'feat/ideal',
  into: 'main',
  commits: 7,
}

/** One changed file: where it is, how much changed, and the patch when the screen shows it. */
interface ChangedFile {
  path: string
  kind: 'add' | 'delete' | 'modify'
  added: number
  removed: number
  seen: boolean
  diff?: string
}

/** A stack: the files Claude grouped under one subject, with why they belong together. */
interface Stack {
  id: string
  title: string
  explanation: string
  files: ChangedFile[]
}

const STACKS: Stack[] = [
  {
    id: 'ideal',
    title: 'iDEAL als betaalmethode',
    explanation:
      'De kassa krijgt iDEAL naast de creditcard. De klant kiest eerst een bank; daarna stuurt de kassa een betaling naar de nieuwe route en wacht op de terugkeer van de bank. Begin bij betaalmethoden.ts: daar staat welke methoden de kassa kent.',
    files: [
      {
        path: 'src/kassa/betaalmethoden.ts',
        kind: 'modify',
        added: 9,
        removed: 2,
        seen: true,
        diff: [
          '@@ -1,8 +1,15 @@',
          " import type { Bestelling } from '../winkelmand/bestelling'",
          '',
          "-export type Betaalmethode = 'creditcard'",
          "+export type Betaalmethode = 'creditcard' | 'ideal'",
          '',
          ' export const METHODEN: Betaalmethode[] = [',
          "-  'creditcard',",
          "+  'ideal',",
          "+  'creditcard',",
          ' ]',
          '+',
          '+/** iDEAL kan alleen in euro en tot vijftigduizend euro per betaling. */',
          '+export function kanIdeal(bestelling: Bestelling): boolean {',
          "+  return bestelling.valuta === 'EUR' && bestelling.totaal <= 50_000",
          '+}',
        ].join('\n'),
      },
      {
        path: 'src/kassa/IdealKeuze.tsx',
        kind: 'add',
        added: 14,
        removed: 0,
        seen: false,
        diff: [
          '@@ -0,0 +1,14 @@',
          "+import { BANKEN } from './banken'",
          '+',
          '+export function IdealKeuze({ onKies }: { onKies(bank: string): void }) {',
          '+  return (',
          '+    <select onChange={(event) => onKies(event.target.value)}>',
          '+      <option value="">Kies je bank</option>',
          '+      {BANKEN.map((bank) => (',
          '+        <option key={bank.id} value={bank.id}>',
          '+          {bank.naam}',
          '+        </option>',
          '+      ))}',
          '+    </select>',
          '+  )',
          '+}',
        ].join('\n'),
      },
      {
        path: 'src/api/betalingen.ts',
        kind: 'modify',
        added: 12,
        removed: 3,
        seen: true,
        diff: [
          '@@ -14,9 +14,18 @@ export async function startBetaling(bestelling: Bestelling) {',
          "   const antwoord = await fetch('/api/betalingen', {",
          "     method: 'POST',",
          '-    body: JSON.stringify({ bedrag: bestelling.totaal }),',
          '+    body: JSON.stringify({',
          '+      bedrag: bestelling.totaal,',
          '+      methode: bestelling.methode,',
          '+      bank: bestelling.bank,',
          '+    }),',
          '   })',
          '-  if (!antwoord.ok) throw new Error(antwoord.statusText)',
          '-  return antwoord.json()',
          '+  if (!antwoord.ok) {',
          "+    throw new BetaalFout('betaling_mislukt', antwoord.status)",
          '+  }',
          '+  const { terugUrl } = await antwoord.json()',
          '+  window.location.assign(terugUrl)',
          ' }',
        ].join('\n'),
      },
      { path: 'src/kassa/banken.ts', kind: 'add', added: 22, removed: 0, seen: false },
      { path: 'src/kassa/Kassa.tsx', kind: 'modify', added: 18, removed: 6, seen: false },
    ],
  },
  {
    id: 'tests',
    title: 'Tests',
    explanation:
      'Nieuwe tests voor de bankkeuze en de betaalroute, en twee bestaande tests die nu ook iDEAL proberen. De test van een mislukte betaling controleert de foutmelding op de kassa.',
    files: [
      {
        path: 'src/kassa/IdealKeuze.test.tsx',
        kind: 'add',
        added: 11,
        removed: 0,
        seen: true,
        diff: [
          '@@ -0,0 +1,11 @@',
          "+import { render, screen } from '@testing-library/react'",
          "+import userEvent from '@testing-library/user-event'",
          "+import { IdealKeuze } from './IdealKeuze'",
          '+',
          "+test('meldt de gekozen bank', async () => {",
          '+  const onKies = vi.fn()',
          '+  render(<IdealKeuze onKies={onKies} />)',
          "+  await userEvent.selectOptions(screen.getByRole('combobox'), 'rabo')",
          "+  expect(onKies).toHaveBeenCalledWith('rabo')",
          '+})',
          '+',
        ].join('\n'),
      },
      { path: 'src/api/betalingen.test.ts', kind: 'modify', added: 34, removed: 4, seen: true },
      { path: 'src/kassa/Kassa.test.tsx', kind: 'modify', added: 19, removed: 2, seen: true },
      { path: 'e2e/afrekenen.spec.ts', kind: 'modify', added: 27, removed: 8, seen: true },
      { path: 'e2e/ideal.spec.ts', kind: 'add', added: 41, removed: 0, seen: true },
      { path: 'src/test/banken.ts', kind: 'add', added: 12, removed: 0, seen: true },
      { path: 'src/test/server.ts', kind: 'modify', added: 9, removed: 1, seen: false },
      { path: 'vitest.config.ts', kind: 'modify', added: 1, removed: 1, seen: false },
    ],
  },
  {
    id: 'opruimen',
    title: 'Opruimen',
    explanation:
      'De oude betaalknop en zijn stijl gaan weg; de kassa gebruikt nu één knop voor elke methode. Niets hiervan verandert wat de klant ziet.',
    files: [
      {
        path: 'src/kassa/CreditcardKnop.tsx',
        kind: 'delete',
        added: 0,
        removed: 6,
        seen: true,
        diff: [
          '@@ -1,6 +0,0 @@',
          "-import './creditcard-knop.css'",
          '-',
          '-export function CreditcardKnop({ onBetaal }: { onBetaal(): void }) {',
          '-  return <button className="creditcard-knop" onClick={onBetaal}>Betaal</button>',
          '-}',
          '-',
        ].join('\n'),
      },
      { path: 'src/kassa/creditcard-knop.css', kind: 'delete', added: 0, removed: 31, seen: true },
      { path: 'src/kassa/BetaalKnop.tsx', kind: 'modify', added: 8, removed: 11, seen: true },
      { path: 'src/kassa/index.ts', kind: 'modify', added: 1, removed: 1, seen: true },
      { path: 'src/stijl/kassa.css', kind: 'modify', added: 4, removed: 17, seen: false },
      { path: 'src/kassa/oud/README.md', kind: 'delete', added: 0, removed: 12, seen: false },
    ],
  },
  {
    id: 'overig',
    title: 'Overig',
    explanation:
      'Wat nergens anders bij hoort: vertalingen, een nieuwe omgevingsvariabele en de bijgewerkte afhankelijkheden.',
    files: [
      { path: 'src/teksten/nl.json', kind: 'modify', added: 14, removed: 1, seen: false },
      { path: 'src/teksten/en.json', kind: 'modify', added: 14, removed: 1, seen: false },
      { path: '.env.example', kind: 'modify', added: 2, removed: 0, seen: false },
      { path: 'package.json', kind: 'modify', added: 2, removed: 1, seen: false },
      { path: 'bun.lock', kind: 'modify', added: 48, removed: 12, seen: false },
      { path: 'src/config.ts', kind: 'modify', added: 5, removed: 0, seen: false },
      { path: 'README.md', kind: 'modify', added: 9, removed: 2, seen: false },
      { path: 'docs/betalen.md', kind: 'add', added: 38, removed: 0, seen: false },
      { path: 'src/winkelmand/bestelling.ts', kind: 'modify', added: 3, removed: 1, seen: false },
      { path: 'src/api/types.ts', kind: 'modify', added: 7, removed: 0, seen: false },
      { path: 'src/kassa/Bedankt.tsx', kind: 'modify', added: 6, removed: 2, seen: false },
      { path: 'public/banken/ideal.svg', kind: 'add', added: 1, removed: 0, seen: false },
    ],
  },
]

/** The report of the review agent, which tried the shop of this pull request in a browser. */
const PHASES = [
  { id: 'ophalen', label: 'Ophalen', state: 'done', stateLabel: 'klaar' },
  { id: 'installeren', label: 'Installeren', state: 'done', stateLabel: 'klaar' },
  { id: 'starten', label: 'Starten', state: 'done', stateLabel: 'klaar' },
  { id: 'reviewen', label: 'Beoordelen', state: 'done', stateLabel: 'klaar' },
] as const

const SUMMARY =
  'De kassa toont iDEAL netjes als eerste methode en de bankkeuze werkt. Afrekenen met iDEAL lukt alleen niet: na het kiezen van een bank geeft de server een fout en blijft de klant op de kassa staan. Met de creditcard gaat alles goed.'

const FINDINGS: Finding[] = [
  {
    severity: 'blocking',
    title: 'Betalen met iDEAL loopt vast',
    detail:
      'Na het kiezen van een bank blijft de kassa op ‘Bezig met betalen…’ staan en verschijnt na twintig seconden ‘Er ging iets mis’. POST /api/betalingen antwoordt met 500.',
    url: '/kassa',
    step: 14,
    screenshot: 'fout',
  },
  {
    severity: 'problem',
    title: 'Totaalbedrag is te klein om te lezen',
    detail:
      'Het totaal onder de bankkeuze staat in 10 px; elders op de kassa is het 16 px. Op een telefoon is het nauwelijks te lezen.',
    url: '/kassa',
    step: 9,
    screenshot: 'klein',
  },
  {
    severity: 'problem',
    title: 'Bankkeuze heeft geen label',
    detail:
      'Het keuzemenu voor de bank heeft geen zichtbaar label; een schermlezer noemt het alleen ‘keuzelijst’.',
    url: '/kassa',
    step: 8,
  },
  {
    severity: 'note',
    title: 'Spelling van iDEAL',
    detail: 'De knop zegt ‘Betaal met iDeal’; de merknaam is ‘iDEAL’, in hoofdletters.',
    step: 6,
  },
]

/** The whole stacks screen counts over every file of the pull request. */
function countSeen(stacks: Stack[], seen: ReadonlySet<string>): { seen: number; total: number } {
  const files = stacks.flatMap((stack) => stack.files)
  return { seen: files.filter((file) => seen.has(file.path)).length, total: files.length }
}

/** The view of a stacked diff, as the review shows every patch. */
const VIEW = { style: 'stacked', wordWrap: false, ignoreWhitespace: false } as const

/** One changed file as a card: its name and counts, "Gezien", and the patch while unseen. */
function FileCard({
  file,
  seen,
  onSeen,
}: {
  file: ChangedFile
  seen: boolean
  onSeen(seen: boolean): void
}): ReactNode {
  const [open, setOpen] = useState(file.diff !== undefined && !seen)
  return (
    <section aria-label={file.path} className="overflow-hidden rounded-lg bg-overlay">
      <header className="flex min-h-11 items-center gap-2 py-1 pr-3 pl-2">
        <IconButton
          icon={open ? 'chevron-down' : 'chevron-right'}
          size="sm"
          label={open ? 'Verberg wijziging' : 'Toon wijziging'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        />
        <PierreFileIcon path={file.path} />
        <span className="min-w-0 flex-1 truncate font-mono text-[12px]">
          <PathLabel path={file.path} emphasis={file.kind === 'delete' ? 'gone' : 'name'} />
        </span>
        <span className="hidden shrink-0 font-mono text-[12px] tabular-nums @lg:inline">
          {file.added > 0 ? <span className="text-success">{`+${file.added}`}</span> : null}{' '}
          {file.removed > 0 ? <span className="text-danger">{`−${file.removed}`}</span> : null}
        </span>
        <ReviewSeen
          checked={seen}
          onCheckedChange={(next) => {
            onSeen(next)
            if (next) setOpen(false)
          }}
        />
      </header>
      {open ? (
        <div className="border-border border-t">
          {file.diff === undefined ? (
            <p className="m-0 px-4 py-3 text-[12px] text-muted">
              Deze wijziging is te groot om hier te tonen.
            </p>
          ) : (
            <PierreDiff
              diff={file.diff}
              path={`/work/webwinkel/${file.path}`}
              kind={file.kind}
              view={VIEW}
              emptyLabel="Geen wijziging"
            />
          )}
        </div>
      ) : null}
    </section>
  )
}

/** The stacks: the subjects on the left, the chosen one's story and files on the right. */
function Stacks(): ReactNode {
  const [current, setCurrent] = useState('ideal')
  const [seen, setSeen] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        STACKS.flatMap((stack) => stack.files.filter((file) => file.seen).map((f) => f.path)),
      ),
  )
  const stack = STACKS.find((entry) => entry.id === current) ?? STACKS[0]
  if (!stack) return null
  const total = countSeen(STACKS, seen)
  const mark = (path: string, value: boolean) =>
    setSeen((before) => {
      const next = new Set(before)
      if (value) next.add(path)
      else next.delete(path)
      return next
    })
  const stackSeen = stack.files.filter((file) => seen.has(file.path)).length
  return (
    <div className="flex flex-col gap-5">
      <Banner
        tone="attention"
        action={
          <Button variant="secondary" size="sm">
            Opnieuw indelen
          </Button>
        }
      >
        Nieuwe commits sinds deze indeling.
      </Banner>
      <div className="grid grid-cols-1 gap-5 @4xl:grid-cols-[19rem_minmax(0,1fr)]">
        <div className="@4xl:hidden">
          <Select<string>
            label="Stapel"
            value={current}
            options={STACKS.map((entry) => ({ value: entry.id, label: entry.title }))}
            onValueChange={setCurrent}
          />
        </div>
        <aside className="hidden @4xl:block">
          <Panel title="Stapels" meta={`${total.seen} van ${total.total} gezien`} flush>
            <div className="px-2 pb-2">
              <List label="Stapels">
                {STACKS.map((entry) => {
                  const done = entry.files.filter((file) => seen.has(file.path)).length
                  return (
                    <ListRow
                      key={entry.id}
                      title={entry.title}
                      current={entry.id === current}
                      onClick={() => setCurrent(entry.id)}
                      meta={
                        <ProgressMeter
                          value={done}
                          max={entry.files.length}
                          label={`Gezien in ${entry.title}`}
                          valueText={(value, max) => `${value} van ${max} gezien`}
                        />
                      }
                    />
                  )
                })}
              </List>
            </div>
          </Panel>
        </aside>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
            <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1.5">
              <h2 className="m-0 font-heading text-[15px] text-fg">{stack.title}</h2>
              <p className="m-0 max-w-2xl text-[13px] text-secondary leading-relaxed">
                {stack.explanation}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-muted tabular-nums">
                {`${stackSeen} van ${stack.files.length} gezien`}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  for (const file of stack.files) mark(file.path, true)
                }}
              >
                Alles gezien
              </Button>
            </div>
          </div>
          {stack.files.map((file) => (
            <FileCard
              key={file.path}
              file={file}
              seen={seen.has(file.path)}
              onSeen={(value) => mark(file.path, value)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * The verdict that goes to GitHub, and the one filled button of the report. A region by its
 * tint, no frame: danger while it asks for changes, quiet as a remark.
 */
function Verdict(): ReactNode {
  const [asComment, setAsComment] = useState(false)
  return (
    <Panel title="Oordeel">
      <div className="flex flex-col gap-4">
        <div
          className={`flex items-start gap-2.5 rounded-md px-3 py-2.5 ${asComment ? 'bg-surface' : 'bg-danger-subtle'}`}
        >
          <span className={`flex h-5 items-center ${asComment ? 'text-muted' : 'text-danger'}`}>
            <Icon name={asComment ? 'message-square' : 'octagon-alert'} size="sm" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium text-[13px] text-fg leading-5">
              {asComment ? 'Alleen een opmerking' : 'Vraagt om wijzigingen'}
            </span>
            <span className="text-[12px] text-secondary leading-4">
              {asComment
                ? 'Het verslag komt als opmerking; de pull request blijft open voor samenvoegen.'
                : 'Er is een blokkade. Orbit Review keurt nooit zelf goed; dat doe jij.'}
            </span>
          </div>
        </div>
        <div className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 flex-col gap-0.5" aria-hidden="true">
            <span className="text-[13px] text-fg leading-5">Alleen als opmerking</span>
            <span className="text-[12px] text-muted leading-4">
              Plaatst het verslag zonder om wijzigingen te vragen.
            </span>
          </span>
          <span className="flex h-5 items-center">
            <Switch
              label="Alleen als opmerking: plaatst het verslag zonder om wijzigingen te vragen"
              checked={asComment}
              onCheckedChange={setAsComment}
            />
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="primary">
            <BrandIcon brand="github" size="sm" />
            Verslag op GitHub plaatsen
          </Button>
          <span className="text-center text-[12px] text-muted">2 schermafbeeldingen gaan mee</span>
        </div>
      </div>
    </Panel>
  )
}

/**
 * The report of the review agent: its phases, the summary, the verdict, the findings and the
 * earlier runs. In that order in the source, which is the order of a narrow screen, so the verdict
 * and its one action stand above the findings there; on a wide one the verdict takes a column of
 * its own and stays in sight while the findings scroll.
 */
function Report(): ReactNode {
  return (
    <div className="grid grid-cols-1 gap-6 @5xl:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="flex min-w-0 flex-col gap-2 @5xl:col-start-1">
        <StepChips
          label="Fases van de review"
          steps={PHASES}
          selected="reviewen"
          onSelect={() => {}}
        />
        <span className="text-[12px] text-muted">6 min · 23 stappen · 2 schermafbeeldingen</span>
      </div>
      <div className="min-w-0 @5xl:col-start-1">
        <Panel title="Samenvatting">
          <p className="m-0 text-[13px] text-fg leading-5">{SUMMARY}</p>
        </Panel>
      </div>
      <aside
        aria-label="Oordeel"
        className="min-w-0 self-start @5xl:sticky @5xl:top-5 @5xl:col-start-2 @5xl:row-span-4 @5xl:row-start-1"
      >
        <Verdict />
      </aside>
      <div className="min-w-0 @5xl:col-start-1">
        <ReviewFindings findings={FINDINGS} />
      </div>
      <div className="min-w-0 @5xl:col-start-1">
        <Panel title="Eerdere reviews" flush>
          <div className="px-2 pb-2">
            <List label="Eerdere reviews">
              <ListRow
                title="Gisteren, 16:40"
                marker={<StatusMark kind="fault" />}
                status="Mislukt"
                meta="Docker startte niet"
              />
              <ListRow
                title="Maandag, 10:12"
                marker={<StatusMark kind="running" />}
                status="Klaar"
                meta="3 bevindingen"
              />
            </List>
          </div>
        </Panel>
      </div>
    </div>
  )
}

/**
 * Orbit Review on a pull request: the changes grouped into stacks by subject, with "Gezien" per
 * file, or the report of the agent that tried the shop of the branch in a browser.
 */
function CodeReview({ variant = 'stapels' }: DemoScreenProps): ReactNode {
  const total = countSeen(
    STACKS,
    new Set(STACKS.flatMap((stack) => stack.files.filter((file) => file.seen).map((f) => f.path))),
  )
  return (
    <AppFrame product="orbit" current="review">
      <ScrollArea>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 @3xl:px-8 @3xl:py-7">
          <header className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1.5">
              <h1 className="m-0 flex items-baseline gap-2 font-heading text-[20px] text-fg leading-tight tracking-[-0.01em]">
                <span className="font-normal text-muted">{`#${PULL.number}`}</span>
                {PULL.title}
              </h1>
              <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-secondary">
                <Avatar name={PULL.author} size="sm" />
                <span className="text-fg">{PULL.author}</span>
                wil
                <code className="rounded-md bg-surface-active px-1.5 py-px font-mono text-[11px] text-fg">
                  {PULL.from}
                </code>
                samenvoegen in
                <code className="rounded-md bg-surface-active px-1.5 py-px font-mono text-[11px] text-fg">
                  {PULL.into}
                </code>
                <span className="text-muted">{`· ${PULL.commits} commits`}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex w-44 flex-col gap-1">
                <span className="text-[12px] text-muted tabular-nums">
                  {`${total.seen} van ${total.total} bestanden gezien`}
                </span>
                <ProgressMeter
                  value={total.seen}
                  max={total.total}
                  label="Bestanden gezien"
                  valueText={(value, max) => `${value} van ${max} gezien`}
                  width="fill"
                  count={false}
                />
              </span>
              {/* One finishing step per view: your own pass over the stacks here; on the report,
                  placing it on GitHub, in the verdict, is the only one. */}
              {variant === 'verslag' ? null : (
                <Button variant="primary" size="sm">
                  Mijn review afronden
                </Button>
              )}
            </div>
          </header>
          {variant === 'verslag' ? <Report /> : <Stacks />}
        </div>
      </ScrollArea>
    </AppFrame>
  )
}

export default {
  title: 'Code review',
  description:
    'Orbit Review deelt een pull request op in stapels per onderwerp, met per bestand een vinkje ‘Gezien’. Het verslag toont wat de review-agent in de browser vond, en het oordeel dat naar GitHub gaat.',
  icon: 'scan-search',
  product: 'orbit',
  variants: [
    { value: 'stapels', label: 'Stapels' },
    { value: 'verslag', label: 'Verslag' },
  ],
  Screen: CodeReview,
} satisfies DemoModule
