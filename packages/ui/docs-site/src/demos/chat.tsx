import { type ReactNode, useEffect, useRef, useState } from 'react'
import {
  ChatLog,
  ChatMessage,
  Composer,
  CopyButton,
  DropdownMenu,
  Icon,
  IconButton,
  List,
  ListGroup,
  PickerPill,
  ProjectMark,
  Prose,
  type RunStatusKind,
  ScrollArea,
  type SearchListItem,
  Shimmer,
  StackedRow,
  StackedRowBranch,
  StatusMark,
  StatusShape,
  Tooltip,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import type { DemoModule } from '../demo-kit/types'
import { AppFrame } from './parts/AppFrame'

/** The models the picker offers. */
const MODELS: SearchListItem[] = [
  { id: 'opus', label: 'Opus 5.5', detail: 'Grondig, voor lastig werk' },
  { id: 'sonnet', label: 'Sonnet 5', detail: 'Snel en precies' },
  { id: 'haiku', label: 'Haiku 5', detail: 'Kort en goedkoop' },
]

/** What the agent may do in this conversation: the whole name in the list, a short word in the pill. */
const ACCESS: (SearchListItem & { short: string })[] = [
  { id: 'read', label: 'Alleen lezen', short: 'Lezen', detail: 'Leest bestanden, verandert niets' },
  {
    id: 'edit',
    label: 'Mag bewerken',
    short: 'Bewerken',
    detail: 'Bewerkt bestanden, vraagt voor commando’s',
  },
  {
    id: 'full',
    label: 'Volledige toegang',
    short: 'Alles',
    detail: 'Bewerkt en voert commando’s uit',
  },
]

/** One conversation in the column: where it works and what it waits for. */
interface Conversation {
  id: string
  title: string
  project: string
  branch: string
  worktree: boolean
  time: string
  status?: [RunStatusKind, string]
  /** What a conversation that waits for you asks, in a word or three. */
  asks?: string
  seen?: boolean
  changes?: string
}

/** The column, in its groups: what waits for you first, then the rest of today. */
const GROUPS: { heading: string; rows: Conversation[] }[] = [
  {
    heading: 'Wacht op jou',
    rows: [
      {
        id: 'facturen',
        title: 'Facturen importeren uit de boekhouding',
        project: 'webwinkel',
        branch: 'nt/import-facturen',
        worktree: true,
        time: '8 min',
        status: ['attention', 'Wacht op jou'],
        asks: 'Vraagt toestemming',
      },
      {
        id: 'cadeaubon',
        title: 'Cadeaubon ook als pdf versturen',
        project: 'webwinkel',
        branch: 'nt/cadeaubon-pdf',
        worktree: true,
        time: '25 min',
        status: ['attention', 'Wacht op jou'],
        asks: 'Heeft een vraag',
      },
    ],
  },
  {
    heading: 'Vandaag',
    rows: [
      {
        id: 'zoeken',
        title: 'Zoekfilter herbouwen',
        project: 'webwinkel',
        branch: 'nt/zoekfilter-server',
        worktree: true,
        time: '2 min',
        status: ['running', 'In uitvoering'],
      },
      {
        id: 'btw',
        title: 'Btw uit een bedrag halen',
        project: 'webwinkel',
        branch: 'main',
        worktree: false,
        time: '14:03',
        status: ['done', 'Klaar'],
      },
      {
        id: 'retour',
        title: 'Retourbeleid samenvatten',
        project: 'beheer',
        branch: 'main',
        worktree: false,
        time: '11:40',
        seen: true,
      },
      {
        id: 'sql',
        title: 'SQL voor de omzet per maand',
        project: 'beheer',
        branch: 'nt/omzet-rapport',
        worktree: true,
        time: '09:15',
        seen: true,
        changes: '+31 −4',
      },
    ],
  },
]

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
  /** The hour of the message; an answer is named by it, so a list of articles tells them apart. */
  time: string
  /** The hour, the model and the time an answer took: the same hour as the answer's name. */
  meta?: string
}

const ANSWER = [
  'Hier is een functie die het btw-bedrag uit een bedrag **inclusief** btw haalt:',
  '',
  '```ts',
  'export function btwUit(inclusief: number, tarief = 0.21): number {',
  '  const exclusief = inclusief / (1 + tarief)',
  '  return Math.round((inclusief - exclusief) * 100) / 100',
  '}',
  '```',
  '',
  'Een paar dingen om op te letten:',
  '',
  '1. Rond pas **aan het eind** af, anders loopt het verschil per regel op.',
  '2. Voor het lage tarief geef je `0.09` mee.',
  '3. Zet de functie in `/work/webwinkel/src/btw.ts`, naast de andere rekenhulpjes.',
  '',
  '| Bedrag incl. btw | Tarief | Btw |',
  '| ---: | ---: | ---: |',
  '| € 121,00 | 21% | € 21,00 |',
  '| € 109,00 | 9% | € 9,00 |',
].join('\n')

const START: Message[] = [
  {
    id: 1,
    role: 'user',
    text: 'Kun je een functie schrijven die de btw uit een bedrag inclusief btw haalt?',
    time: '14:02',
  },
  {
    id: 2,
    role: 'assistant',
    text: ANSWER,
    time: '14:03',
    meta: '14:03 · Opus 5.5 · klaar in 12 s',
  },
]

/** One message: the user's in a bubble at the right, the assistant's as plain text with actions. */
function Message({ message }: { message: Message }): ReactNode {
  if (message.role === 'user') {
    return (
      <ChatMessage
        from="user"
        label="Jij"
        meta={message.time}
        actions={<CopyButton text={message.text} {...galleryLabels.copy} />}
      >
        {message.text}
      </ChatMessage>
    )
  }
  return (
    <ChatMessage
      from="assistant"
      label={`Opus 5.5, ${message.time}`}
      meta={message.meta}
      actions={
        <>
          <CopyButton text={message.text} {...galleryLabels.copy} />
          {/* Its own glyph and name: "Opnieuw proberen" (rotate-ccw) is the way on after an error. */}
          <Tooltip label="Opnieuw genereren">
            <IconButton icon="repeat" size="sm" label="Opnieuw genereren" />
          </Tooltip>
        </>
      }
    >
      <Prose labels={galleryLabels.prose} markdown={message.text} settled />
    </ChatMessage>
  )
}

/** The column of conversations, as Orbit's sidebar of chats draws it. */
function Conversations(): ReactNode {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  return (
    <div className="hidden w-72 shrink-0 flex-col bg-frame shadow-frame-edge @4xl:flex">
      <div className="flex h-12 shrink-0 items-center gap-2 px-4">
        {/* A title, not a heading: the list below is named "Gesprekken" already, and the demo's own
            heading says the same word. */}
        <span className="flex-1 font-medium text-[13px] text-fg">Gesprekken</span>
        <IconButton icon="search" size="sm" label="Zoek gesprekken" />
        <IconButton icon="square-pen" size="sm" label="Nieuw gesprek" />
      </div>
      <div className="min-h-0 flex-1">
        <ScrollArea>
          <div className="px-2 pb-3">
            <List label="Gesprekken">
              {GROUPS.map((group) => (
                <ListGroup
                  key={group.heading}
                  heading={group.heading}
                  count={group.rows.length}
                  label={`${group.heading}, ${group.rows.length} gesprekken`}
                  open={open[group.heading] ?? true}
                  onOpenChange={(next) => setOpen((now) => ({ ...now, [group.heading]: next }))}
                >
                  {group.rows.map((row) => (
                    <StackedRow
                      key={row.id}
                      label={`${row.title}, ${row.project}${row.status ? `, ${row.status[1]}` : ''}${row.asks ? `, ${row.asks}` : ''}, ${row.branch}, ${row.time}`}
                      meta={
                        <>
                          <ProjectMark name={row.project} />
                          <span className="truncate">{row.project}</span>
                        </>
                      }
                      trailingMeta={row.time}
                      title={row.title}
                      status={
                        row.status ? (
                          <StatusShape kind={row.status[0]} label={row.status[1]} />
                        ) : null
                      }
                      detail={<StackedRowBranch name={row.branch} worktree={row.worktree} />}
                      {...(row.asks !== undefined
                        ? {
                            // What it asks, in words beside the branch: the triangle says that it
                            // waits, this says for what.
                            trailingDetail: <span className="text-secondary">{row.asks}</span>,
                          }
                        : row.changes === undefined
                          ? {}
                          : {
                              trailingDetail: (
                                <span className="font-mono tabular-nums">{row.changes}</span>
                              ),
                            })}
                      current={row.id === 'btw'}
                      seen={row.seen ?? false}
                    />
                  ))}
                </ListGroup>
              ))}
            </List>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

/**
 * Orbit's chat: the conversations in a quiet column, what waits for you on top, and one
 * conversation with code, a table and the composer under it. A sent message gets a canned answer.
 */
function Chat(): ReactNode {
  const [messages, setMessages] = useState<Message[]>(START)
  const [draft, setDraft] = useState('')
  const [model, setModel] = useState('opus')
  const [thinking, setThinking] = useState(false)
  const [access, setAccess] = useState('edit')
  // Said once through a polite status, never token by token: thinking, complete, stopped.
  const [said, setSaid] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  // A new turn scrolls the conversation to its end, as a chat does; only the conversation's own
  // viewport moves, never the page around the demo.
  const column = useRef<HTMLDivElement>(null)
  const turns = messages.length
  useEffect(() => {
    if (turns === START.length && !thinking) return
    const viewport = column.current?.closest('[data-radix-scroll-area-viewport]')
    viewport?.scrollTo({ top: viewport.scrollHeight })
  }, [turns, thinking])

  const stop = () => {
    clearTimeout(timer.current)
    setThinking(false)
    setSaid('Gestopt')
  }

  const send = () => {
    const text = draft.trim()
    if (text === '' || thinking) return
    setMessages((now) => [...now, { id: now.length + 1, role: 'user', text, time: '14:06' }])
    setDraft('')
    setThinking(true)
    setSaid('Opus 5.5 is aan het nadenken')
    timer.current = setTimeout(() => {
      setThinking(false)
      setSaid('Antwoord compleet')
      setMessages((now) => [
        ...now,
        {
          id: now.length + 1,
          role: 'assistant',
          text: 'Dit is een demo zonder netwerk, dus hier komt altijd hetzelfde antwoord. In Orbit stroomt de tekst hier binnen.',
          time: '14:06',
          meta: '14:06 · Opus 5.5 · klaar in 1 s',
        },
      ])
    }, 1200)
  }

  return (
    <AppFrame product="orbit" current="chat">
      <div className="flex min-h-0 flex-1">
        <Conversations />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 shrink-0 items-center gap-3 px-4 @3xl:px-6">
            <h1 className="m-0 min-w-0 truncate font-medium text-[13px] text-fg">
              Btw uit een bedrag halen
            </h1>
            {/* Where this conversation works and where it writes: the project and the branch, on a
                phone too; the title gives way first. */}
            <span className="flex min-w-0 shrink-0 items-center gap-2 text-[12px] text-muted">
              <ProjectMark name="webwinkel" />
              webwinkel
              <StackedRowBranch name="main" />
            </span>
            <div className="flex-1" />
            <DropdownMenu
              trigger={<IconButton icon="more-horizontal" size="sm" label="Gesprek" />}
              label="Gesprek"
              align="end"
              items={[
                { id: 'rename', label: 'Hernoemen', icon: 'pencil' },
                { id: 'pin', label: 'Vastzetten', icon: 'pin' },
                { id: 'archive', label: 'Archiveren', icon: 'archive' },
                { id: 'delete', label: 'Verwijderen', tone: 'danger', separated: true },
              ]}
            />
          </div>
          {/* Short fades in the pane's tint at both ends of the conversation: 24px under the header
              and 40px above the composer, so a turn slides out of sight instead of being cut. */}
          <div className="relative min-h-0 flex-1 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-6 before:bg-linear-to-b before:from-canvas before:to-transparent after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-10 after:h-10 after:bg-linear-to-t after:from-canvas after:to-transparent">
            <ScrollArea>
              <div ref={column} className="mx-auto w-full max-w-[720px] px-4 py-6 @3xl:px-8">
                <ChatLog label="Gesprek">
                  {messages.slice(0, 1).map((message) => (
                    <Message key={message.id} message={message} />
                  ))}
                  {/* A step of the agent: a quiet label under the question, its mark flat with a
                      soft glow, so the answer below stays what the eye reads. */}
                  <p className="m-0 flex items-center gap-2 text-[12px] text-muted [&_.nt-status-mark-body]:size-2">
                    <StatusMark kind="running" />
                    Las src/btw.ts en src/prijs.ts
                  </p>
                  {messages.slice(1).map((message) => (
                    <Message key={message.id} message={message} />
                  ))}
                  {thinking ? (
                    <ChatMessage from="assistant" label="Opus 5.5" streaming>
                      <p className="m-0 flex items-center gap-2 text-muted">
                        <Icon name="sparkles" size="sm" tone="faint" />
                        <Shimmer active>Aan het nadenken…</Shimmer>
                      </p>
                    </ChatMessage>
                  ) : null}
                </ChatLog>
                <p role="status" className="sr-only">
                  {said}
                </p>
              </div>
            </ScrollArea>
          </div>
          <div className="mx-auto w-full max-w-[720px] px-4 pb-4 @3xl:px-8 @3xl:pb-6">
            <Composer
              labels={galleryLabels.composer}
              placeholder="Vraag iets of geef een opdracht…"
              value={draft}
              onValueChange={setDraft}
              onSend={send}
              running={thinking}
              onStop={stop}
              tools={
                <>
                  <IconButton icon="plus" shape="round" size="sm" label="Bijlage toevoegen" />
                  <PickerPill
                    listLabels={galleryLabels.list}
                    label="Model"
                    icon="sparkles"
                    value={MODELS.find((item) => item.id === model)?.label ?? ''}
                    items={MODELS}
                    selectedId={model}
                    onSelect={setModel}
                    searchable={false}
                  />
                  {/* A short word at every width: a bare shield would not say whether the agent may
                      only read or may change files. */}
                  <PickerPill
                    listLabels={galleryLabels.list}
                    label="Toegang"
                    icon="shield"
                    value={ACCESS.find((item) => item.id === access)?.short ?? ''}
                    items={ACCESS}
                    selectedId={access}
                    onSelect={setAccess}
                    searchable={false}
                  />
                </>
              }
            />
          </div>
        </div>
      </div>
    </AppFrame>
  )
}

export default {
  title: 'Gesprekken',
  description:
    'De gesprekken van Orbit: links de lijst met wat op jou wacht bovenaan, rechts één gesprek met code, een tabel en het invoerkader. Een nieuw bericht krijgt een vast antwoord.',
  icon: 'messages-square',
  product: 'orbit',
  Screen: Chat,
} satisfies DemoModule
