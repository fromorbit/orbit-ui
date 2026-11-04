import { type ReactNode, useState } from 'react'
import {
  Avatar,
  Button,
  DatePicker,
  Icon,
  IconButton,
  Input,
  List,
  ListGroup,
  ListRow,
  PanelTabHeader,
  ProgressMeter,
  PropertyList,
  Prose,
  type RunStatusKind,
  ScrollArea,
  SegmentedControl,
  StackedRowBranch,
  StatusMark,
  Tag,
  Textarea,
  Timeline,
  TimelineItem,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import type { DemoModule } from '../demo-kit/types'
import { AppFrame, ME } from './parts/AppFrame'

/** Where a spec is in its life; `building` only while an agent works on it. */
type State = 'review' | 'building' | 'approved' | 'draft' | 'done'

/** The words and the status shape of every state. */
const STATES: Record<State, { label: string; kind: RunStatusKind }> = {
  review: { label: 'Wacht op review', kind: 'attention' },
  building: { label: 'In uitvoering', kind: 'running' },
  approved: { label: 'Goedgekeurd', kind: 'queued' },
  draft: { label: 'Concept', kind: 'queued' },
  done: { label: 'Klaar', kind: 'done' },
}

/** One spec of the made-up web shop. */
interface Spec {
  id: string
  title: string
  state: State
  owner: string
  /** The reviewer it waits for, when that is someone. */
  reviewer?: string
  branch: string
  /** Criteria of "Klaar als" met and in all. */
  criteria: [number, number]
  summary: string
  done: string
}

const SPECS: Spec[] = [
  {
    id: 'SPEC-21',
    title: 'Afrekenen met een cadeaubon',
    state: 'review',
    owner: 'Daan Velthuis',
    reviewer: ME,
    branch: 'nt/cadeaubon-afrekenen',
    criteria: [0, 4],
    summary:
      'Klanten van de webwinkel kunnen bij het afrekenen een cadeaubon inwisselen. Is de bon minder waard dan de mand, dan betalen ze de rest met iDEAL; het restant van een bon blijft een jaar geldig.',
    done: [
      '- [ ] Een bon van € 25 op een mand van € 40 laat € 15 te betalen',
      '- [ ] Een verlopen bon geeft een melding in gewone taal',
      '- [ ] Het restant staat op de bon na de bestelling',
      '- [ ] De betaling staat in `/work/webwinkel/src/kassa/bon.ts` met tests',
    ].join('\n'),
  },
  {
    id: 'SPEC-19',
    title: 'iDEAL als betaalmethode',
    state: 'building',
    owner: 'Mila Terhorst',
    branch: 'nt/ideal',
    criteria: [3, 5],
    summary: 'iDEAL naast creditcard en achteraf betalen.',
    done: '- [x] Bankkeuze\n- [x] Terugkeer na betalen\n- [x] Mislukte betaling\n- [ ] Webhook\n- [ ] Tests',
  },
  {
    id: 'SPEC-22',
    title: 'Zoekfilter op de server',
    state: 'building',
    owner: 'Sem Oudeweg',
    branch: 'nt/zoekfilter-server',
    criteria: [1, 3],
    summary: 'Filteren op maat en kleur zonder de hele catalogus te laden.',
    done: '- [x] Index\n- [ ] Filters\n- [ ] Tests',
  },
  {
    id: 'SPEC-18',
    title: 'Retourformulier in twee stappen',
    state: 'review',
    owner: 'Fenna Brouwsma',
    reviewer: 'Joris Lindeboom',
    branch: 'nt/retour-kort',
    criteria: [0, 3],
    summary: 'Van vijf stappen naar twee.',
    done: '- [ ] Stap 1\n- [ ] Stap 2\n- [ ] Tests',
  },
  {
    id: 'SPEC-25',
    title: 'Productfoto’s als WebP',
    state: 'review',
    owner: 'Sem Oudeweg',
    reviewer: ME,
    branch: 'nt/webp',
    criteria: [0, 3],
    summary: 'Kleinere foto’s, dezelfde kwaliteit; oude browsers krijgen JPEG.',
    done: '- [ ] Omzetten bij upload\n- [ ] Terugval\n- [ ] Tests',
  },
  {
    id: 'SPEC-20',
    title: 'Verzendkosten per land',
    state: 'building',
    owner: ME,
    branch: 'nt/verzendkosten',
    criteria: [2, 4],
    summary: 'België en Duitsland krijgen hun eigen tarief.',
    done: '- [x] Tabel\n- [x] Kassa\n- [ ] Factuur\n- [ ] Tests',
  },
  {
    id: 'SPEC-23',
    title: 'Openingstijden feestdagen',
    state: 'approved',
    owner: ME,
    branch: 'nt/feestdagen',
    criteria: [0, 2],
    summary: 'Afwijkende tijden per dag, vooraf in te plannen.',
    done: '- [ ] Beheer\n- [ ] Weergave',
  },
  {
    id: 'SPEC-24',
    title: 'Nieuwsbrief na de eerste bestelling',
    state: 'draft',
    owner: 'Fenna Brouwsma',
    branch: 'main',
    criteria: [0, 0],
    summary: 'Nog uit te werken.',
    done: '',
  },
  {
    id: 'SPEC-16',
    title: 'Koppeling met de boekhouding',
    state: 'done',
    owner: 'Joris Lindeboom',
    branch: 'nt/boekhouding',
    criteria: [4, 4],
    summary: 'Facturen gaan elke nacht mee.',
    done: '- [x] Export\n- [x] Planning\n- [x] Fouten\n- [x] Tests',
  },
]

/** The groups of the list per view: "Voor jou" holds what waits for you and what you own. */
type View = 'mine' | 'open'

const GROUPS: { heading: string; states: State[] }[] = [
  { heading: 'Wacht op review', states: ['review'] },
  { heading: 'In uitvoering', states: ['building'] },
  { heading: 'Gepland', states: ['approved', 'draft'] },
  { heading: 'Klaar', states: ['done'] },
]

/** What happened on the chosen spec, oldest first. */
const ACTIVITY = [
  { icon: 'plus', text: 'Daan Velthuis schreef de spec', when: '3 d' },
  { icon: 'sparkles', text: 'De agent vulde Keuzes en Risico’s aan', when: '2 d' },
  { icon: 'user', text: `Review gevraagd aan ${ME}`, when: '5 u' },
] as const

/** The status mark of a row: the glowing circle only while an agent works, the shape otherwise. */
function rowStatus(spec: Spec) {
  const state = STATES[spec.state]
  return spec.state === 'building'
    ? { marker: <StatusMark kind="running" size="sm" />, status: state.label }
    : { kind: state.kind, status: state.label }
}

/** The detail of one spec beside the list: the gate, what it says, and what happened on it. */
function Detail({ spec, onClose }: { spec: Spec; onClose(): void }): ReactNode {
  const [deadline, setDeadline] = useState<string | null>('2026-10-31')
  const state = STATES[spec.state]
  const [met, all] = spec.criteria
  return (
    <div className="hidden w-[420px] shrink-0 flex-col border-border border-l bg-bg @5xl:flex">
      <PanelTabHeader
        title={<span className="font-mono text-[12px] text-muted">{spec.id}</span>}
        actions={
          <>
            <IconButton icon="copy" size="sm" label="Kopieer link" />
            <IconButton icon="x" size="sm" label="Sluit spec" onClick={onClose} />
          </>
        }
      />
      <ScrollArea>
        <div className="flex flex-col gap-5 px-5 pt-4 pb-6">
          <div className="flex flex-col gap-2">
            <h2 className="m-0 font-heading text-[20px] text-fg leading-snug tracking-[-0.01em]">
              {spec.title}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <Tag {...(spec.state === 'review' ? { tone: 'attention' as const } : {})}>
                {state.label}
              </Tag>
              <Tag>Betalen</Tag>
            </div>
          </div>
          {spec.reviewer === ME ? (
            <div className="flex flex-col gap-3 rounded-lg bg-attention-subtle p-4">
              <p className="m-0 text-[13px] text-fg leading-relaxed">
                Deze spec wacht op jouw akkoord. Na goedkeuren kan een agent hem uitvoeren op een
                eigen branch.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm">
                  Goedkeuren en uitvoeren
                </Button>
                <Button variant="secondary" size="sm">
                  Goedkeuren
                </Button>
                <Button variant="ghost" size="sm">
                  Opmerking
                </Button>
              </div>
            </div>
          ) : null}
          <PropertyList
            label="Eigenschappen"
            groups={[
              [
                {
                  label: 'Eigenaar',
                  value: (
                    <span className="flex items-center gap-2">
                      <Avatar name={spec.owner} size="sm" />
                      {spec.owner}
                    </span>
                  ),
                },
                {
                  label: 'Branch',
                  value: (
                    <span className="flex min-w-0 items-center gap-1.5 font-mono">
                      <StackedRowBranch name={spec.branch} worktree />
                    </span>
                  ),
                },
                {
                  label: 'Klaar als',
                  value: (
                    <ProgressMeter
                      value={met}
                      max={Math.max(all, 1)}
                      label="Criteria gehaald"
                      valueText={galleryLabels.progress}
                    />
                  ),
                },
                {
                  label: 'Deadline',
                  value: (
                    <DatePicker
                      label="Deadline"
                      placeholder="Kies een datum"
                      labels={{ previousMonth: 'Vorige maand', nextMonth: 'Volgende maand' }}
                      today="2026-10-28"
                      value={deadline}
                      onValueChange={setDeadline}
                      size="sm"
                    />
                  ),
                },
              ],
            ]}
          />
          <section className="flex flex-col gap-1.5">
            <h3 className="m-0 font-medium text-[12px] text-muted">In het kort</h3>
            <p className="m-0 text-[13px] text-fg leading-relaxed">{spec.summary}</p>
          </section>
          {spec.done === '' ? null : (
            <section className="flex flex-col gap-1.5">
              <h3 className="m-0 font-medium text-[12px] text-muted">{`Klaar als · ${all} criteria`}</h3>
              <Prose labels={galleryLabels.prose} markdown={spec.done} />
            </section>
          )}
          <section className="flex flex-col gap-3">
            <h3 className="m-0 font-medium text-[12px] text-muted">Activiteit</h3>
            <Timeline label="Activiteit">
              {ACTIVITY.map((entry) => (
                <TimelineItem
                  key={entry.text}
                  marker={<Icon name={entry.icon} size="sm" tone="faint" />}
                  time={entry.when}
                >
                  {entry.text}
                </TimelineItem>
              ))}
              <TimelineItem marker={<Avatar name="Sem Oudeweg" size="sm" />} time="2 u">
                <span className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg bg-surface px-3 py-2">
                  <span className="font-medium text-fg">Sem Oudeweg</span>
                  <span className="text-fg leading-relaxed">
                    Moet het restant ook in het account van de klant zichtbaar zijn?
                  </span>
                </span>
              </TimelineItem>
            </Timeline>
          </section>
          <div className="flex flex-col gap-2">
            <Textarea label="Reactie" placeholder="Schrijf een reactie…" minRows={2} />
            <div className="flex justify-end">
              <Button variant="secondary" size="sm">
                Reageer
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

/**
 * Orbit's specs: what waits for your review on top, what an agent is building now, and what is
 * planned; the chosen spec beside the list with its gate, criteria and activity.
 */
function Specs(): ReactNode {
  const [chosen, setChosen] = useState<string | null>('SPEC-21')
  const [view, setView] = useState<View>('mine')
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const shown = SPECS.filter((spec) =>
    view === 'open'
      ? spec.state !== 'done'
      : spec.owner === ME ||
        spec.reviewer === ME ||
        spec.state === 'building' ||
        spec.state === 'done',
  )
  const spec = SPECS.find((entry) => entry.id === chosen)
  return (
    <AppFrame product="orbit" current="taken">
      <div className="flex h-12 shrink-0 items-center gap-3 border-border border-b px-4">
        <h1 className="m-0 font-medium text-[13px] text-fg">Specs</h1>
        <SegmentedControl<View>
          label="Weergave"
          size="sm"
          value={view}
          options={[
            { value: 'mine', label: 'Voor jou' },
            { value: 'open', label: 'Open' },
          ]}
          onValueChange={setView}
        />
        <div className="flex-1" />
        <div className="hidden w-52 @3xl:block">
          <Input label="Zoek specs" placeholder="Zoek…" icon="search" size="sm" />
        </div>
        <Button variant="secondary" size="sm">
          Nieuwe spec
        </Button>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <ScrollArea>
            <div className="mx-auto max-w-5xl px-3 py-3 @3xl:px-5">
              <List label="Specs">
                {GROUPS.map((group) => {
                  const rows = shown.filter((entry) => group.states.includes(entry.state))
                  if (rows.length === 0) return null
                  return (
                    <ListGroup
                      key={group.heading}
                      heading={group.heading}
                      count={rows.length}
                      label={`${group.heading}, ${rows.length} specs`}
                      open={open[group.heading] ?? true}
                      onOpenChange={(next) => setOpen((now) => ({ ...now, [group.heading]: next }))}
                    >
                      {rows.map((entry) => (
                        <ListRow
                          key={entry.id}
                          title={entry.title}
                          {...rowStatus(entry)}
                          current={entry.id === chosen}
                          emphasis="strong"
                          onClick={() => setChosen(entry.id)}
                          meta={
                            <span className="flex items-center gap-3">
                              {entry.criteria[1] > 0 ? (
                                <span className="hidden @2xl:inline-flex">
                                  <ProgressMeter
                                    value={entry.criteria[0]}
                                    max={entry.criteria[1]}
                                    label={`Criteria van ${entry.id}`}
                                    valueText={galleryLabels.progress}
                                  />
                                </span>
                              ) : null}
                              <span className="hidden w-16 font-mono text-[11px] text-muted @xl:inline">
                                {entry.id}
                              </span>
                              <Avatar name={entry.owner} size="sm" />
                            </span>
                          }
                        />
                      ))}
                    </ListGroup>
                  )
                })}
              </List>
            </div>
          </ScrollArea>
        </div>
        {spec ? <Detail key={spec.id} spec={spec} onClose={() => setChosen(null)} /> : null}
      </div>
    </AppFrame>
  )
}

export default {
  title: 'Specs',
  description:
    'De specs van Orbit: bovenaan wat op jouw review wacht, dan wat een agent nu bouwt en wat gepland is. Naast de lijst de gekozen spec met zijn akkoord, criteria en activiteit.',
  icon: 'clipboard-list',
  product: 'orbit',
  Screen: Specs,
} satisfies DemoModule
