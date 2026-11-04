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
  StatusShape,
  Tooltip,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import type { DemoModule, DemoScreenProps } from '../demo-kit/types'
import { AppFrame } from './parts/AppFrame'

/** The models the picker offers. */
const MODELS: SearchListItem[] = [
  { id: 'opus', label: 'Opus 5.5', detail: 'Grondig, voor lastig werk' },
  { id: 'sonnet', label: 'Sonnet 5', detail: 'Snel en precies' },
  { id: 'haiku', label: 'Haiku 5', detail: 'Kort en goedkoop' },
]

/**
 * What the agent may do in this conversation. The pill shows the whole name, a state rather than a
 * verb ("Mag bewerken", not "Bewerken", which reads as "edit this message").
 */
const ACCESS: SearchListItem[] = [
  { id: 'read', label: 'Alleen lezen', detail: 'Leest bestanden, verandert niets' },
  { id: 'edit', label: 'Mag bewerken', detail: 'Bewerkt bestanden, vraagt voor commando’s' },
  { id: 'full', label: 'Volledige toegang', detail: 'Bewerkt en voert commando’s uit' },
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
        id: 'korting',
        title: 'Kortingscodes in september',
        project: 'webwinkel',
        branch: 'main',
        worktree: false,
        time: '11:02',
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
  /** What the agent did before it answered, as one quiet line that belongs to the answer. */
  step?: ReactNode
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
  '3. Zet de functie in `src/btw.ts`, naast de andere rekenhulpjes.',
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
    step: (
      <>
        Las <Path>src/btw.ts</Path> en <Path>src/prijs.ts</Path>
      </>
    ),
    time: '14:03',
    meta: '14:03 · Opus 5.5 · klaar in 12 s',
  },
]

/** Questions and short answers of a long morning in the web shop, for the long thread. */
const LONG_TURNS: [string, string, string][] = [
  [
    '09:02',
    'Waar wordt de verzendprijs berekend?',
    'In `src/verzending.ts`, in `verzendkosten()`. Boven € 50,00 is verzenden gratis.',
  ],
  [
    '09:10',
    'Kan die grens in de instellingen?',
    'Ja. Ik heb `GRATIS_VANAF` naar `config/winkel.ts` verplaatst; de standaard blijft € 50,00.',
  ],
  [
    '09:24',
    'Draai de tests van de kassa.',
    'Alle 48 tests van `src/kassa` slagen. De langzaamste duurt 1,2 s.',
  ],
  [
    '09:31',
    'Waarom is die ene zo traag?',
    'Hij maakt per test een nieuwe database aan. Met één database per bestand gaat hij naar 0,2 s.',
  ],
  [
    '09:40',
    'Doe dat maar.',
    'Gedaan: `src/kassa/betalen.test.ts` deelt nu één database. Alles slaagt nog.',
  ],
  [
    '10:05',
    'Hoeveel bestellingen hadden een kortingscode in september?',
    '312 van de 1.840 bestellingen, 17%. De meest gebruikte code was `HERFST10`.',
  ],
  [
    '10:12',
    'Zet dat in een tabel per week.',
    '| Week | Bestellingen | Met code |\n| ---: | ---: | ---: |\n| 36 | 402 | 61 |\n| 37 | 455 | 70 |\n| 38 | 488 | 95 |\n| 39 | 495 | 86 |',
  ],
  [
    '10:30',
    'Is week 38 een uitschieter?',
    'Ja, die week liep de nieuwsbrief met `HERFST10`. Zonder die actie ligt het aandeel rond de 15%.',
  ],
  [
    '10:44',
    'Schrijf een korte samenvatting voor het team.',
    'In september gebruikte 17% van de bestellingen een kortingscode, met een piek in week 38 door de nieuwsbrief.',
  ],
  [
    '11:02',
    'Dank je, zet het gesprek op klaar.',
    'Staat op klaar. De wijzigingen staan op `main`; er is niets meer open.',
  ],
]

const LONG: Message[] = LONG_TURNS.flatMap(([time, question, answer], index) => [
  { id: index * 2 + 1, role: 'user' as const, text: question, time },
  {
    id: index * 2 + 2,
    role: 'assistant' as const,
    text: answer,
    time,
    meta: `${time} · Opus 5.5 · klaar in ${3 + ((index * 5) % 11)} s`,
  },
])

/** A path in a quiet line, in the same code style as the paths in the answer. */
function Path({ children }: { children: string }): ReactNode {
  return <code className="rounded-sm bg-surface px-1 py-px font-mono text-[11px]">{children}</code>
}

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
  const answer = (
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
  if (message.step === undefined) return answer
  // The step and its answer are one group, 8px apart, while the turns stand 24px apart: the step
  // belongs to what follows, not to the question above it (Proximity). Its mark is the quiet
  // StatusShape of the chat list, 12px, so the answer stays what the eye reads.
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="m-0 flex min-h-5 items-center gap-2 text-[12px] text-muted leading-5 [&>svg]:size-3">
        <StatusShape kind="done" />
        <span className="min-w-0">{message.step}</span>
      </p>
      {answer}
    </div>
  )
}

/**
 * The column of conversations, as Orbit's sidebar of chats draws it. From the 3-column width on it
 * stands beside the conversation; below it, it is the root view of the screen (`shown`) and a row
 * pushes the conversation on top of it, as a phone's list and detail do.
 */
function Conversations({
  shown,
  current,
  onOpen,
}: {
  shown: boolean
  /** The conversation that is open; none while a new one is. */
  current: string | null
  onOpen(): void
}): ReactNode {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  return (
    <div
      className={`${shown ? 'flex w-full' : 'hidden'} shrink-0 flex-col bg-frame shadow-frame-edge @4xl:flex @4xl:w-72`}
    >
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
                      label={`${row.title}, ${row.project}${row.status ? `, ${row.status[1]}` : ''}${row.asks ? `, ${row.asks}` : ''}, ${row.branch}${row.changes ? `, ${changesInWords(row.changes)}` : ''}, ${row.time}`}
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
                                <span
                                  title={changesInWords(row.changes)}
                                  className="font-mono tabular-nums"
                                >
                                  {row.changes}
                                </span>
                              ),
                            })}
                      current={row.id === current}
                      seen={row.seen ?? false}
                      onClick={onOpen}
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

/** "+31 −4" in words, for the ear and the hover: "31 regels erbij, 4 eraf". */
function changesInWords(changes: string): string {
  const [added = '', removed = ''] = changes.split(' ')
  return `${added.slice(1)} regels erbij, ${removed.slice(1)} eraf`
}

/** The column every part of the conversation shares, so the header, the turns and the composer
 * start on one edge. */
const COLUMN = 'mx-auto w-full max-w-[720px] px-4 @3xl:px-8'

/** The demo's states: one conversation, a new and empty one, and a long morning of turns. */
type ChatState = 'gesprek' | 'leeg' | 'lang'

function Chat({ variant }: DemoScreenProps): ReactNode {
  const state: ChatState = variant === 'leeg' || variant === 'lang' ? variant : 'gesprek'
  // A state of its own starts afresh: a draft or a sent message does not carry over.
  return <ChatScreen key={state} state={state} />
}

/**
 * Orbit's chat: the conversations in a quiet column, what waits for you on top, and one
 * conversation with code, a table and the composer under it. A sent message gets a canned answer.
 */
function ChatScreen({ state }: { state: ChatState }): ReactNode {
  const [messages, setMessages] = useState<Message[]>(
    state === 'leeg' ? [] : state === 'lang' ? LONG : START,
  )
  const [draft, setDraft] = useState('')
  const [model, setModel] = useState('opus')
  const [thinking, setThinking] = useState(false)
  const [access, setAccess] = useState('edit')
  // Below the 3-column width: the list, or the conversation pushed on top of it.
  const [listView, setListView] = useState(false)
  // Said once through a polite status, never token by token: thinking, complete, stopped.
  const [said, setSaid] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  // A new turn scrolls the conversation to its end, as a chat does, and so does opening a long
  // one; only the conversation's own viewport moves, never the page around the demo.
  const column = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  const turns = messages.length
  useEffect(() => {
    const opening = first.current
    first.current = false
    if (opening && state !== 'lang') return
    if (turns === 0 && !thinking) return
    const viewport = column.current?.closest('[data-radix-scroll-area-viewport]')
    viewport?.scrollTo({ top: viewport.scrollHeight })
  }, [turns, thinking, state])

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

  const empty = messages.length === 0 && !thinking
  const title = empty
    ? 'Nieuw gesprek'
    : state === 'lang'
      ? 'Kortingscodes in september'
      : 'Btw uit een bedrag halen'

  const composer = (
    <Composer
      labels={galleryLabels.composer}
      placeholder="Vraag iets of geef een opdracht…"
      value={draft}
      onValueChange={setDraft}
      onSend={send}
      running={thinking}
      onStop={stop}
      {...(empty
        ? {
            minRows: 3,
            footer: (
              <>
                Start op een nieuwe branch vanaf
                <StackedRowBranch name="main" />
              </>
            ),
          }
        : {})}
      tools={
        <>
          <IconButton icon="plus" shape="round" size="sm" label="Bijlage toevoegen" />
          {/* Both pickers put their detail under the label, where it wraps: the detail is what
              explains the choice, so it is never cut off, and the two menus read as one family. */}
          <PickerPill
            listLabels={galleryLabels.list}
            label="Model"
            icon="sparkles"
            value={MODELS.find((item) => item.id === model)?.label ?? ''}
            items={MODELS}
            selectedId={model}
            onSelect={setModel}
            collapse
            searchable={false}
            layout="stacked"
          />
          {/* The whole name of the level at every width: a state ("Mag bewerken"), never a bare
              shield or a verb. On a narrow toolbar the model gives way to its icon instead: what
              the agent may do is the riskier setting, so it keeps its words. */}
          <PickerPill
            listLabels={galleryLabels.list}
            label="Toegang"
            icon="shield"
            value={ACCESS.find((item) => item.id === access)?.label ?? ''}
            items={ACCESS}
            selectedId={access}
            onSelect={setAccess}
            searchable={false}
            layout="stacked"
          />
        </>
      }
    />
  )

  return (
    <AppFrame product="orbit" current="chat">
      <div className="flex min-h-0 flex-1">
        <Conversations
          shown={listView}
          current={state === 'leeg' ? null : state === 'lang' ? 'korting' : 'btw'}
          onOpen={() => setListView(false)}
        />
        <div className={`${listView ? 'hidden @4xl:flex' : 'flex'} min-w-0 flex-1 flex-col`}>
          {/* The header shares the column of the turns, so the title starts on the edge of the
              bubble, the answer and the composer. */}
          <div className="shrink-0">
            <div className={`${COLUMN} flex min-h-12 items-center gap-2 py-2`}>
              <span className="-ml-1.5 flex @4xl:hidden">
                <IconButton
                  icon="chevron-left"
                  size="sm"
                  label="Terug naar gesprekken"
                  onClick={() => setListView(true)}
                />
              </span>
              {/* On a phone the title takes the whole row and where it works moves to a quiet
                  line under it: the title is the one emphasis and gives way to nothing. */}
              <div className="flex min-w-0 flex-1 flex-col @lg:flex-row @lg:items-center @lg:gap-3">
                <h1 className="m-0 min-w-0 truncate font-medium text-[13px] text-fg leading-5">
                  {title}
                </h1>
                <span className="flex min-w-0 items-center gap-2 text-[12px] text-muted leading-4 @lg:shrink-0">
                  <ProjectMark name="webwinkel" />
                  webwinkel
                  {empty ? null : <StackedRowBranch name="main" />}
                </span>
              </div>
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
          </div>
          {empty ? (
            // A new conversation: the composer is the screen, three rows high, under one line that
            // says where the work lands.
            <div className="flex min-h-0 flex-1 flex-col justify-center pb-10">
              <div className={`${COLUMN} flex flex-col gap-6`}>
                <h2 className="m-0 font-medium text-[15px] text-fg leading-6">
                  Waar gaan we aan werken?
                </h2>
                {composer}
              </div>
            </div>
          ) : (
            <>
              {/* Short fades in the pane's tint at both ends of the conversation: 24px under the
                  header and 40px above the composer, so a turn slides out of sight instead of
                  being cut. The column keeps 48px under the last turn, so its meta line and
                  actions clear that fade. */}
              <div className="relative min-h-0 flex-1 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-6 before:bg-linear-to-b before:from-canvas before:to-transparent after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-10 after:h-10 after:bg-linear-to-t after:from-canvas after:to-transparent">
                <ScrollArea>
                  <div ref={column} className={`${COLUMN} pt-6 pb-12`}>
                    <ChatLog label="Gesprek">
                      {messages.map((message) => (
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
                  </div>
                </ScrollArea>
              </div>
              <div className={`${COLUMN} pb-4 @3xl:pb-6`}>{composer}</div>
            </>
          )}
          <p role="status" className="sr-only">
            {said}
          </p>
        </div>
      </div>
    </AppFrame>
  )
}

export default {
  title: 'Gesprekken',
  description:
    'De gesprekken van Orbit: links de lijst met wat op jou wacht bovenaan, rechts één gesprek met code, een tabel en het invoerkader. Een nieuw bericht krijgt een vast antwoord. Op een telefoon is de lijst het begin en schuift het gesprek eroverheen.',
  icon: 'messages-square',
  product: 'orbit',
  variants: [
    { value: 'gesprek', label: 'Gesprek' },
    { value: 'leeg', label: 'Leeg' },
    { value: 'lang', label: 'Lang' },
  ],
  Screen: Chat,
} satisfies DemoModule
