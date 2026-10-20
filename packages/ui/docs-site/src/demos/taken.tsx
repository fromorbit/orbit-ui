import { type ReactNode, useState } from 'react'
import {
  Avatar,
  Button,
  DropdownMenu,
  Icon,
  IconButton,
  LevelBars,
  List,
  ListGroup,
  ListRow,
  PanelTabHeader,
  PropertyList,
  Prose,
  type RunStatusKind,
  ScrollArea,
  SegmentedControl,
  StatusShape,
  Tag,
  Textarea,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import { Missing } from '../demo-kit/Missing'
import type { DemoModule } from '../demo-kit/types'
import { AppFrame } from './parts/AppFrame'

type State = 'doing' | 'review' | 'todo' | 'done'

/** The groups in their order, with the status shape each draws. */
const STATES: { id: State; label: string; kind: RunStatusKind }[] = [
  { id: 'doing', label: 'Bezig', kind: 'running' },
  { id: 'review', label: 'Wacht op review', kind: 'attention' },
  { id: 'todo', label: 'Te doen', kind: 'queued' },
  { id: 'done', label: 'Klaar', kind: 'done' },
]

const PRIORITY = ['Geen', 'Laag', 'Middel', 'Hoog'] as const

interface Task {
  id: string
  title: string
  state: State
  priority: 0 | 1 | 2 | 3
  owner: string
  label: string
  body: string
}

const TASKS: Task[] = [
  {
    id: 'ZIL-142',
    title: 'Betaalpagina toont verkeerde btw bij 9%',
    state: 'doing',
    priority: 3,
    owner: 'Daan Velthuis',
    label: 'Bug',
    body: 'Bij producten met het lage tarief rekent de betaalpagina 21% btw. Zie `/work/winkel/src/btw.ts`.\n\n- [x] Fout nagespeeld\n- [ ] Test toegevoegd\n- [ ] Fix uitgerold',
  },
  {
    id: 'ZIL-139',
    title: 'Zomercollectie: nieuwe productfoto’s',
    state: 'doing',
    priority: 2,
    owner: 'Mila Terhorst',
    label: 'Inhoud',
    body: 'Twaalf producten krijgen nieuwe foto’s; de oude gaan naar het archief.',
  },
  {
    id: 'ZIL-137',
    title: 'Nieuwsbrief oktober schrijven',
    state: 'review',
    priority: 2,
    owner: 'Fenna Brouwsma',
    label: 'Marketing',
    body: 'Concept staat klaar, graag een blik op de onderwerpregel.',
  },
  {
    id: 'ZIL-145',
    title: 'Retourformulier vereenvoudigen',
    state: 'todo',
    priority: 1,
    owner: 'Sem Oudeweg',
    label: 'Verbetering',
    body: 'Van vijf stappen naar twee.',
  },
  {
    id: 'ZIL-146',
    title: 'Cadeaubon ook als pdf versturen',
    state: 'todo',
    priority: 2,
    owner: 'Daan Velthuis',
    label: 'Verbetering',
    body: 'Klanten vragen om een printbare versie.',
  },
  {
    id: 'ZIL-147',
    title: 'Openingstijden feestdagen op de site',
    state: 'todo',
    priority: 0,
    owner: 'Iris Kamphorst',
    label: 'Inhoud',
    body: 'Voor 1 december online.',
  },
  {
    id: 'ZIL-131',
    title: 'Koppeling met de boekhouding',
    state: 'done',
    priority: 3,
    owner: 'Joris Lindeboom',
    label: 'Koppeling',
    body: 'Facturen gaan nu elke nacht mee.',
  },
  {
    id: 'ZIL-128',
    title: 'Zoekfunctie in de winkel',
    state: 'done',
    priority: 1,
    owner: 'Sem Oudeweg',
    label: 'Verbetering',
    body: 'Live sinds 12 oktober.',
  },
]

/** The detail of one task beside the list: what, its properties and what happened on it. */
function Detail({
  task,
  onChange,
  onClose,
}: {
  task: Task
  onChange(next: Task): void
  onClose(): void
}) {
  const state = STATES.find((entry) => entry.id === task.state) ?? STATES[0]
  return (
    <div className="flex w-[400px] shrink-0 flex-col border-border border-l bg-bg">
      <PanelTabHeader
        title={<span className="font-mono text-[12px] text-muted">{task.id}</span>}
        actions={
          <>
            <IconButton icon="copy" size="sm" label="Kopieer link" />
            <IconButton icon="x" size="sm" label="Sluit taak" onClick={onClose} />
          </>
        }
      />
      <ScrollArea>
        <div className="flex flex-col gap-5 p-4">
          <h2 className="m-0 text-[16px] font-medium text-fg">{task.title}</h2>
          <PropertyList
            label="Eigenschappen"
            groups={[
              [
                {
                  label: 'Status',
                  value: (
                    <div className="flex">
                      <DropdownMenu
                        trigger={
                          <Button variant="ghost" size="xs">
                            <span className="flex items-center gap-1.5 text-fg">
                              <StatusShape kind={state?.kind ?? 'queued'} />
                              {state?.label}
                            </span>
                          </Button>
                        }
                        label="Status"
                        items={STATES.map((entry) => ({
                          id: entry.id,
                          label: entry.label,
                          kind: 'radio' as const,
                          checked: entry.id === task.state,
                          onSelect: () => onChange({ ...task, state: entry.id }),
                        }))}
                      />
                    </div>
                  ),
                },
                {
                  label: 'Prioriteit',
                  value: (
                    <div className="flex">
                      <DropdownMenu
                        trigger={
                          <Button variant="ghost" size="xs">
                            <span className="flex items-center gap-1.5 text-fg">
                              <LevelBars level={task.priority} of={3} />
                              {PRIORITY[task.priority]}
                            </span>
                          </Button>
                        }
                        label="Prioriteit"
                        items={PRIORITY.map((label, level) => ({
                          id: label,
                          label,
                          kind: 'radio' as const,
                          checked: level === task.priority,
                          onSelect: () =>
                            onChange({ ...task, priority: level as Task['priority'] }),
                        }))}
                      />
                    </div>
                  ),
                },
                {
                  label: 'Toegewezen',
                  value: (
                    <span className="flex items-center gap-2">
                      <Avatar name={task.owner} size="sm" />
                      {task.owner}
                    </span>
                  ),
                },
              ],
              [
                {
                  label: 'Label',
                  value: (
                    <div className="flex">
                      <Tag>{task.label}</Tag>
                    </div>
                  ),
                },
                {
                  label: 'Deadline',
                  value: (
                    <div className="flex">
                      <Missing name="DatePicker" inline>
                        <span className="text-[12px] text-fg">31 okt 2026</span>
                      </Missing>
                    </div>
                  ),
                },
              ],
            ]}
          />
          <Prose labels={galleryLabels.prose} markdown={task.body} />
          <Missing name="Timeline" note="Activiteit en reacties op de taak">
            <ol className="m-0 flex list-none flex-col gap-3 p-0 text-[12px]">
              <li className="flex items-center gap-2 text-muted">
                <Icon name="plus" size="xs" tone="faint" /> Iris Kamphorst maakte de taak aan · 3 d
              </li>
              <li className="flex items-center gap-2 text-muted">
                <Icon name="user" size="xs" tone="faint" /> Toegewezen aan {task.owner} · 2 d
              </li>
              <li className="flex items-start gap-2">
                <Avatar name="Sem Oudeweg" size="sm" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-muted">Sem Oudeweg · 5 u</span>
                  <span className="text-fg">Kan dit nog mee in de release van vrijdag?</span>
                </span>
              </li>
            </ol>
          </Missing>
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

type View = 'active' | 'all'

/** Tasks as Linear lists them: grouped by status, priority and owner on the row, a detail beside. */
function Tasks(): ReactNode {
  const [tasks, setTasks] = useState(TASKS)
  const [chosen, setChosen] = useState<string | null>('ZIL-142')
  const [view, setView] = useState<View>('active')
  const [open, setOpen] = useState<Record<State, boolean>>({
    doing: true,
    review: true,
    todo: true,
    done: false,
  })
  const task = tasks.find((entry) => entry.id === chosen)
  const groups = STATES.filter((state) => view === 'all' || state.id !== 'done')
  return (
    <AppFrame current="taken">
      <div className="flex h-12 shrink-0 items-center gap-3 border-border border-b px-4">
        <h1 className="m-0 text-[14px] font-medium text-fg">Taken</h1>
        <SegmentedControl<View>
          label="Weergave"
          size="sm"
          value={view}
          options={[
            { value: 'active', label: 'Actief' },
            { value: 'all', label: 'Alles' },
          ]}
          onValueChange={setView}
        />
        <div className="flex-1" />
        <Button variant="primary" size="sm">
          Nieuwe taak
        </Button>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <ScrollArea>
            <div className="px-3 py-2">
              <List label="Taken">
                {groups.map((state) => {
                  const rows = tasks.filter((entry) => entry.state === state.id)
                  return (
                    <ListGroup
                      key={state.id}
                      heading={state.label}
                      count={rows.length}
                      label={`${state.label}, ${rows.length} taken`}
                      open={open[state.id]}
                      onOpenChange={(next) => setOpen((now) => ({ ...now, [state.id]: next }))}
                    >
                      {rows.map((entry) => (
                        <ListRow
                          key={entry.id}
                          title={entry.title}
                          kind={state.kind}
                          status={state.label}
                          current={entry.id === chosen}
                          emphasis="strong"
                          onClick={() => setChosen(entry.id)}
                          meta={
                            <span className="flex items-center gap-3">
                              <Tag>{entry.label}</Tag>
                              <LevelBars level={entry.priority} of={3} />
                              <span className="w-16 font-mono text-[11px] text-muted">
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
        {task ? (
          <Detail
            key={task.id}
            task={task}
            onClose={() => setChosen(null)}
            onChange={(next) =>
              setTasks((now) => now.map((entry) => (entry.id === next.id ? next : entry)))
            }
          />
        ) : null}
      </div>
    </AppFrame>
  )
}

export default { title: 'Taken', icon: 'list-checks', Screen: Tasks } satisfies DemoModule
