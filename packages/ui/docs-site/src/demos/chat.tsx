import { type ReactNode, useEffect, useRef, useState } from 'react'
import {
  ChatMessage,
  Composer,
  CopyButton,
  DropdownMenu,
  Icon,
  IconButton,
  List,
  ListGroup,
  PickerPill,
  Pill,
  ProjectMark,
  Prose,
  type RunStatusKind,
  ScrollArea,
  type SearchListItem,
  Shimmer,
  StackedRow,
  StackedRowBranch,
  StatusLine,
  StatusShape,
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

/** One conversation in the column: where it works and what it waits for. */
interface Conversation {
  id: string
  title: string
  project: string
  branch: string
  worktree: boolean
  time: string
  status?: [RunStatusKind, string]
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
        changes: '+84 −12',
      },
      {
        id: 'cadeaubon',
        title: 'Cadeaubon ook als pdf versturen',
        project: 'webwinkel',
        branch: 'nt/cadeaubon-pdf',
        worktree: true,
        time: '25 min',
        status: ['attention', 'Wacht op jou'],
        changes: '+46 −3',
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
        time: '14:02',
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
  /** The hour of a question, the model and the time an answer took. */
  time?: string
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
  '| Bedrag incl. | Tarief | Btw |',
  '| --- | --- | --- |',
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
  { id: 2, role: 'assistant', text: ANSWER, meta: 'Opus 5.5 · 12 s' },
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
      label="Opus 5.5"
      meta={message.meta}
      actions={
        <>
          <CopyButton text={message.text} {...galleryLabels.copy} />
          <IconButton icon="rotate-ccw" size="sm" label="Opnieuw" />
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
    <div className="hidden w-72 shrink-0 flex-col bg-frame @4xl:flex">
      <div className="flex h-12 shrink-0 items-center gap-2 px-4">
        <h2 className="m-0 flex-1 font-medium text-[13px] text-fg">Gesprekken</h2>
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
                      label={`${row.title}, ${row.project}${row.status ? `, ${row.status[1]}` : ''}, ${row.branch}, ${row.time}`}
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
                      {...(row.changes === undefined
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
  }

  const send = () => {
    const text = draft.trim()
    if (text === '' || thinking) return
    setMessages((now) => [...now, { id: now.length + 1, role: 'user', text, time: '14:06' }])
    setDraft('')
    setThinking(true)
    timer.current = setTimeout(() => {
      setThinking(false)
      setMessages((now) => [
        ...now,
        {
          id: now.length + 1,
          role: 'assistant',
          text: 'Dit is een demo zonder netwerk, dus hier komt altijd hetzelfde antwoord. In Orbit stroomt de tekst hier binnen.',
          meta: 'Opus 5.5 · 1 s',
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
            <span className="hidden min-w-0 items-center gap-2 text-[12px] text-muted @2xl:flex">
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
          <div className="min-h-0 flex-1">
            <ScrollArea>
              <div
                ref={column}
                className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-6 @3xl:px-8"
              >
                {messages.slice(0, 1).map((message) => (
                  <Message key={message.id} message={message} />
                ))}
                <StatusLine tone="success" meta="2 bestanden">
                  Las src/btw.ts en src/prijs.ts
                </StatusLine>
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
                  <IconButton icon="plus" shape="round" outlined size="sm" label="Bijlage" />
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
                  <span className="hidden @xl:inline-flex">
                    <Pill icon="shield">Bewerkingen</Pill>
                  </span>
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
  title: 'Assistent',
  description:
    'Het gesprek van Orbit: links de gesprekken met wat op jou wacht bovenaan, rechts één gesprek met code, een tabel en het invoerkader. Een nieuw bericht krijgt een vast antwoord.',
  icon: 'messages-square',
  product: 'orbit',
  Screen: Chat,
} satisfies DemoModule
