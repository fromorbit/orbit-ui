import { type ReactNode, useEffect, useRef, useState } from 'react'
import {
  Avatar,
  CopyButton,
  DropdownMenu,
  Icon,
  IconButton,
  Input,
  List,
  ListGroup,
  ListRow,
  PickerPill,
  Prose,
  RelativeTime,
  ScrollArea,
  type SearchListItem,
  Shimmer,
  Textarea,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import { Missing } from '../demo-kit/Missing'
import type { DemoModule } from '../demo-kit/types'
import { AppFrame, DAY, HOUR, ME, MINUTE, NOW } from './parts/AppFrame'

/** Made-up models of a made-up assistant. */
const MODELS: SearchListItem[] = [
  { id: 'atlas-3', label: 'Atlas 3', detail: 'Snel en precies' },
  { id: 'atlas-3-mini', label: 'Atlas 3 Mini', detail: 'Goedkoop, korte antwoorden' },
  { id: 'nova-lang', label: 'Nova Lang', detail: 'Lange documenten' },
]

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
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
  '3. Zet de functie in `/work/winkel/src/btw.ts`, naast de andere rekenhulpjes.',
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
  },
  { id: 2, role: 'assistant', text: ANSWER },
]

/** One message, in the frame of the component that is missing for it. */
function Bubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <Missing name="ChatMessage" note="Bericht van de gebruiker">
        <div className="flex items-start justify-end gap-2">
          <p className="m-0 max-w-[80%] rounded-lg bg-bubble px-3 py-2 text-[13px] text-fg">
            {message.text}
          </p>
          <Avatar name={ME} size="sm" />
        </div>
      </Missing>
    )
  }
  return (
    <Missing name="ChatMessage" note="Antwoord met acties">
      <Prose labels={galleryLabels.prose} markdown={message.text} settled />
      <div className="flex items-center gap-1">
        <CopyButton text={message.text} {...galleryLabels.copy} />
        <IconButton icon="rotate-ccw" size="sm" label="Opnieuw" />
      </div>
    </Missing>
  )
}

/** An assistant: the conversations, one conversation with code, and the field to answer in. */
function Chat(): ReactNode {
  const [messages, setMessages] = useState<Message[]>(START)
  const [draft, setDraft] = useState('')
  const [model, setModel] = useState('atlas-3')
  const [thinking, setThinking] = useState(false)
  const [groups, setGroups] = useState({ today: true, week: true })
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const send = () => {
    const text = draft.trim()
    if (text === '' || thinking) return
    setMessages((now) => [...now, { id: now.length + 1, role: 'user', text }])
    setDraft('')
    setThinking(true)
    timer.current = setTimeout(() => {
      setThinking(false)
      setMessages((now) => [
        ...now,
        {
          id: now.length + 1,
          role: 'assistant',
          text: 'Dit is een demo zonder netwerk, dus hier komt altijd hetzelfde antwoord. In een echte app stroomt de tekst hier binnen.',
        },
      ])
    }, 1200)
  }

  return (
    <AppFrame current="chat">
      <div className="flex min-h-0 flex-1">
        <div className="flex w-64 shrink-0 flex-col border-border border-r bg-bg">
          <div className="flex h-12 shrink-0 items-center gap-1 px-2">
            <div className="min-w-0 flex-1">
              <Input label="Zoek gesprekken" placeholder="Zoek…" icon="search" size="sm" />
            </div>
            <IconButton icon="square-pen" size="sm" label="Nieuw gesprek" />
          </div>
          <div className="min-h-0 flex-1 px-2">
            <ScrollArea>
              <List label="Gesprekken">
                <ListGroup
                  heading="Vandaag"
                  label="Vandaag, 3 gesprekken"
                  count={3}
                  open={groups.today}
                  onOpenChange={(today) => setGroups((now) => ({ ...now, today }))}
                >
                  <ListRow
                    title="Btw uit een bedrag halen"
                    current
                    meta={
                      <RelativeTime labels={galleryLabels.time} at={NOW - 4 * MINUTE} now={NOW} />
                    }
                  />
                  <ListRow
                    title="Tekst voor de nieuwsbrief"
                    meta={
                      <RelativeTime labels={galleryLabels.time} at={NOW - 2 * HOUR} now={NOW} />
                    }
                  />
                  <ListRow
                    title="Retourbeleid samenvatten"
                    meta={
                      <RelativeTime labels={galleryLabels.time} at={NOW - 5 * HOUR} now={NOW} />
                    }
                  />
                </ListGroup>
                <ListGroup
                  heading="Deze week"
                  label="Deze week, 3 gesprekken"
                  count={3}
                  open={groups.week}
                  onOpenChange={(week) => setGroups((now) => ({ ...now, week }))}
                >
                  <ListRow
                    title="SQL voor de omzet per maand"
                    meta={<RelativeTime labels={galleryLabels.time} at={NOW - 2 * DAY} now={NOW} />}
                  />
                  <ListRow
                    title="Productteksten zomercollectie"
                    meta={<RelativeTime labels={galleryLabels.time} at={NOW - 3 * DAY} now={NOW} />}
                  />
                  <ListRow
                    title="Planning voor de verhuizing"
                    meta={<RelativeTime labels={galleryLabels.time} at={NOW - 5 * DAY} now={NOW} />}
                  />
                </ListGroup>
              </List>
            </ScrollArea>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 shrink-0 items-center gap-2 border-border border-b px-4">
            <h1 className="m-0 min-w-0 flex-1 truncate text-[14px] font-medium text-fg">
              Btw uit een bedrag halen
            </h1>
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
              <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-6">
                {messages.map((message) => (
                  <Bubble key={message.id} message={message} />
                ))}
                {thinking ? (
                  <p className="m-0 flex items-center gap-2 text-[13px] text-muted">
                    <Icon name="sparkles" size="sm" tone="faint" />
                    <Shimmer active>Aan het nadenken…</Shimmer>
                  </p>
                ) : null}
              </div>
            </ScrollArea>
          </div>
          <div className="mx-auto w-full max-w-2xl px-6 pb-5">
            <Missing name="Composer" note="Tekstvak en werkbalk als één kader">
              <Textarea
                label="Bericht"
                variant="bare"
                placeholder="Vraag iets…"
                maxRows={8}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    send()
                  }
                }}
              />
              <div className="flex items-center gap-1">
                <IconButton icon="paperclip" size="sm" label="Bijlage toevoegen" />
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
                <div className="flex-1" />
                <IconButton
                  icon="arrow-up"
                  label="Verstuur"
                  variant={draft.trim() === '' ? 'idle' : 'primary'}
                  shape="round"
                  size="sm"
                  onClick={send}
                />
              </div>
            </Missing>
          </div>
        </div>
      </div>
    </AppFrame>
  )
}

export default { title: 'AI-chat', icon: 'sparkles', Screen: Chat } satisfies DemoModule
