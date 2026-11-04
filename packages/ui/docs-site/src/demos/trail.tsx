import { type ReactNode, useEffect, useState } from 'react'
import {
  adjacentMarker,
  Button,
  DataTable,
  type DataTableColumn,
  Icon,
  IconButton,
  type IconName,
  List,
  PageHeader,
  PropertyList,
  RoomyListRow,
  ScrollArea,
  Scrubber,
  SegmentedControl,
  Tabs,
  Tag,
  Timeline,
  TimelineItem,
} from '../../../src'
import type { DemoModule } from '../demo-kit/types'
import { AppFrame } from './parts/AppFrame'
import { Panel } from './parts/Panel'
import {
  CONSOLE,
  type ConsoleLine,
  clock,
  DURATION,
  ERRORS,
  EVENTS,
  MARKERS,
  NETWORK,
  type NetworkRequest,
  POSITION,
  RECORDINGS,
  stamp,
  TRAIL_KINDS,
  type TrailEventKind,
} from './parts/TrailData'
import { TrailReplay } from './parts/TrailReplay'

type Speed = '1' | '2' | '4'

const SPEEDS = [
  { value: '1', label: '1×' },
  { value: '2', label: '2×' },
  { value: '4', label: '4×' },
] as const

/** The glyph and tone of a line of the events, per kind. */
const EVENT_LOOK: Record<TrailEventKind, { icon: IconName; word: string }> = {
  klik: { icon: 'mouse-pointer-click', word: 'Klik' },
  navigatie: { icon: 'globe', word: 'Navigatie' },
  fout: { icon: 'octagon-alert', word: 'Fout' },
  verzoek: { icon: 'alert-triangle', word: 'Mislukt verzoek' },
}

/** The glyph and tone of a console line, per level. */
const LEVEL_LOOK: Record<ConsoleLine['level'], { icon: IconName; row: string; text: string }> = {
  info: { icon: 'info', row: '', text: 'text-secondary' },
  warn: { icon: 'alert-triangle', row: 'bg-attention-subtle', text: 'text-attention' },
  error: { icon: 'octagon-alert', row: 'bg-danger-subtle', text: 'text-danger' },
}

/** How close, in seconds, the playhead must be to count as standing on an event. */
const ON = 0.05

/**
 * What happened in the recording, as a timeline that follows the playhead: what went wrong in
 * red, the last event the player passed in full strength, and what it has not reached yet as a
 * dashed round.
 */
function Events({ position }: { position: number }): ReactNode {
  const passed = EVENTS.filter((event) => event.at <= position + ON)
  const last = passed.at(-1)
  return (
    <div className="px-4 py-4">
      <Timeline label="Gebeurtenissen">
        {EVENTS.map((event) => {
          const look = EVENT_LOOK[event.kind]
          const here = event === last
          const ahead = event.at > position + ON
          const wrong = event.kind === 'fout' || event.kind === 'verzoek'
          return (
            <TimelineItem
              key={`${event.kind}-${event.at}`}
              marker={<Icon name={look.icon} size="sm" />}
              tone={ahead ? 'pending' : wrong ? 'danger' : 'default'}
              time={<span className="tabular-nums">{clock(event.at)}</span>}
            >
              <span className="min-w-0 truncate">
                <span className={here ? 'font-medium text-fg' : ahead ? 'text-muted' : 'text-fg'}>
                  {event.title}
                </span>
                {event.detail === undefined ? null : (
                  <span className="text-muted">{` · ${event.detail}`}</span>
                )}
                <span className="sr-only">{` (${look.word})`}</span>
              </span>
            </TimelineItem>
          )
        })}
      </Timeline>
    </div>
  )
}

/** The browser's console during the recording, warnings and errors on their own plane. */
function Console(): ReactNode {
  return (
    <ol className="m-0 flex list-none flex-col p-2 font-mono text-[12px]">
      {CONSOLE.map((line) => {
        const look = LEVEL_LOOK[line.level]
        return (
          <li
            key={`${line.level}-${line.at}`}
            className={`flex items-start gap-3 rounded-md px-2.5 py-1.5 ${look.row}`}
          >
            <span className="w-12 shrink-0 text-muted tabular-nums">{stamp(line.at)}</span>
            <span className={`mt-px ${look.text}`}>
              <Icon name={look.icon} size="sm" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={`break-words ${line.level === 'info' ? 'text-fg' : look.text}`}>
                {line.text}
              </span>
              {line.source === undefined ? null : <span className="text-muted">{line.source}</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Whether a request failed: its path and status turn red. */
const failed = (request: NetworkRequest) => request.status >= 400

/** The columns of the requests; the waterfall runs over the whole recording. */
function networkColumns(longest: number): DataTableColumn<NetworkRequest>[] {
  return [
    {
      id: 'method',
      header: 'Methode',
      sortValue: (request) => request.method,
      cell: (request) => (
        <span className="font-mono text-[11px] text-secondary">{request.method}</span>
      ),
    },
    {
      id: 'path',
      header: 'Pad',
      sortValue: (request) => request.path,
      cell: (request) => (
        <span className={`font-mono text-[11px] ${failed(request) ? 'text-danger' : 'text-fg'}`}>
          {request.path}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      align: 'end',
      sortValue: (request) => request.status,
      cell: (request) => (
        <span className={failed(request) ? 'font-medium text-danger' : 'text-secondary'}>
          {request.status}
        </span>
      ),
    },
    {
      id: 'time',
      header: 'Tijd',
      align: 'end',
      hideBelow: 'md',
      sortValue: (request) => request.ms,
      cell: (request) => (
        <span className={request.ms > 1000 ? 'text-attention' : 'text-secondary'}>
          {`${request.ms.toLocaleString('nl-NL')} ms`}
        </span>
      ),
    },
    {
      id: 'size',
      header: 'Grootte',
      align: 'end',
      hideBelow: 'md',
      cell: (request) => <span className="text-muted">{request.size}</span>,
    },
    {
      id: 'waterfall',
      header: 'Verloop',
      hideBelow: 'lg',
      cell: (request) => (
        <span className="relative block h-1.5 w-40 rounded-full bg-mark">
          <span
            className={`absolute inset-y-0 min-w-1 rounded-full ${failed(request) ? 'bg-danger' : request.ms > 1000 ? 'bg-attention' : 'bg-secondary'}`}
            style={{
              left: `${((request.at * 1000) / longest) * 100}%`,
              width: `${(request.ms / longest) * 100}%`,
            }}
          />
        </span>
      ),
    },
  ]
}

/** The requests of the page as a table with a waterfall, the failed ones in red. */
function Network(): ReactNode {
  const longest = Math.max(...NETWORK.map((request) => request.at * 1000 + request.ms))
  return (
    <div className="p-2 text-[12px]">
      <DataTable
        label="Netwerk"
        columns={networkColumns(longest)}
        rows={NETWORK}
        rowKey={(request) => `${request.method}-${request.at}`}
        labels={{ selectAll: 'Alles selecteren', selectRow: (name) => `Selecteer ${name}` }}
      />
    </div>
  )
}

/** The words of a recording's trigger, as a tag: an error is the only one that is red. */
function TriggerTag({ trigger }: { trigger: string }): ReactNode {
  return <Tag tone={trigger === 'Fout' ? 'danger' : 'neutral'}>{trigger}</Tag>
}

/**
 * Halo's trail: a recording of a browser session around an error, replayed with its timeline,
 * what happened, the console and the network, and the other recordings of the app beside it.
 */
function Trail(): ReactNode {
  const [speed, setSpeed] = useState<Speed>('1')
  const [tab, setTab] = useState('gebeurtenissen')
  const [current, setCurrent] = useState('r1')
  const [position, setPosition] = useState(POSITION)
  const [playing, setPlaying] = useState(false)
  const errors = ERRORS.length
  const reached = ERRORS.filter((at) => at <= position + ON).length
  const previous = adjacentMarker(MARKERS, position, 'previous', ['fout'], ON)
  const next = adjacentMarker(MARKERS, position, 'next', ['fout'], ON)
  const seek = (seconds: number) => setPosition(Math.min(Math.max(seconds, 0), DURATION))
  useEffect(() => {
    if (!playing) return
    const tick = window.setInterval(() => {
      setPosition((now) => {
        const later = Math.min(now + 0.1 * Number(speed), DURATION)
        if (later >= DURATION) setPlaying(false)
        return later
      })
    }, 100)
    return () => window.clearInterval(tick)
  }, [playing, speed])
  return (
    <AppFrame product="halo" current="trail">
      <ScrollArea>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 @3xl:px-8 @3xl:py-8">
          <PageHeader
            title="Kassa betaalt niet"
            meta="webwinkel · main · bewaard tot 3 nov"
            actions={
              <>
                <div className="hidden @xl:block">
                  <Button variant="ghost" size="sm">
                    Ook op Orbit
                  </Button>
                </div>
                <Button variant="secondary" size="sm">
                  Deel opname
                </Button>
              </>
            }
          />
          <div className="grid grid-cols-1 gap-6 @5xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="flex min-w-0 flex-col gap-6">
              <section
                aria-label="Speler"
                className="flex flex-col gap-4 rounded-lg bg-overlay p-3 @3xl:p-4"
              >
                <TrailReplay position={position} />
                <div className="flex flex-col gap-2">
                  <Scrubber
                    label="Afspeelpositie"
                    duration={DURATION}
                    value={position}
                    step={0.5}
                    onValueChange={(seconds) => {
                      setPlaying(false)
                      seek(seconds)
                    }}
                    markers={MARKERS}
                    kinds={TRAIL_KINDS}
                    formatTime={clock}
                    valueText={(seconds) => `${clock(seconds)} van ${clock(DURATION)}`}
                    legendLabel="Markeringen"
                  />
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                    <IconButton
                      icon="rotate-ccw"
                      size="sm"
                      label="5 seconden terug"
                      onClick={() => seek(position - 5)}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (!playing && position >= DURATION) seek(0)
                        setPlaying(!playing)
                      }}
                    >
                      {playing ? 'Pauzeren' : 'Afspelen'}
                    </Button>
                    <IconButton
                      icon="rotate-cw"
                      size="sm"
                      label="5 seconden vooruit"
                      onClick={() => seek(position + 5)}
                    />
                    <span className="px-1 font-mono text-[12px] text-secondary tabular-nums">
                      {`${clock(position)} / ${clock(DURATION)}`}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <SegmentedControl<Speed>
                        label="Snelheid"
                        size="sm"
                        value={speed}
                        options={SPEEDS}
                        onValueChange={setSpeed}
                      />
                      <div className="flex items-center">
                        <IconButton
                          icon="chevron-left"
                          size="sm"
                          label="Vorige fout"
                          disabled={previous === undefined}
                          onClick={() => previous && seek(previous.at)}
                        />
                        <span className="min-w-20 text-center text-[12px] text-secondary tabular-nums">
                          {reached === 0 ? `${errors} fouten` : `Fout ${reached} van ${errors}`}
                        </span>
                        <IconButton
                          icon="chevron-right"
                          size="sm"
                          label="Volgende fout"
                          disabled={next === undefined}
                          onClick={() => next && seek(next.at)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <section
                aria-label="Wat er gebeurde"
                className="flex flex-col overflow-hidden rounded-lg bg-overlay"
              >
                <Tabs
                  label="Wat er gebeurde"
                  orientation="horizontal"
                  value={tab}
                  onTabChange={setTab}
                  tabs={[
                    {
                      id: 'gebeurtenissen',
                      label: 'Gebeurtenissen',
                      count: EVENTS.length,
                      content: <Events position={position} />,
                    },
                    {
                      id: 'console',
                      label: 'Console',
                      count: CONSOLE.length,
                      content: <Console />,
                    },
                    {
                      id: 'netwerk',
                      label: 'Netwerk',
                      count: NETWORK.length,
                      content: <Network />,
                    },
                  ]}
                />
              </section>
            </div>
            <aside className="flex min-w-0 flex-col gap-6">
              <Panel title="Details">
                <PropertyList
                  label="Details van de opname"
                  groups={[
                    [
                      { label: 'Bron', value: 'Halo-server' },
                      {
                        label: 'Aanleiding',
                        value: (
                          <span className="inline-flex">
                            <TriggerTag trigger="Fout" />
                          </span>
                        ),
                      },
                      { label: 'Gestart', value: 'vandaag 13:52' },
                      { label: 'Duur', value: clock(DURATION) },
                      {
                        label: 'Fouten',
                        value: <span className="text-danger">{`${errors} fouten`}</span>,
                      },
                    ],
                    [
                      { label: 'Browser', value: 'Firefox 144 · 1440 × 900' },
                      {
                        label: 'Pagina',
                        value: <span className="font-mono text-[12px]">/kassa</span>,
                      },
                    ],
                  ]}
                />
              </Panel>
              <Panel title="Opnames" meta="van webwinkel" flush>
                <div className="px-2 pb-2">
                  <List label="Opnames">
                    {RECORDINGS.map((recording) => (
                      <RoomyListRow
                        key={recording.id}
                        title={recording.title}
                        meta={recording.duration}
                        note={`${recording.trigger} · ${recording.when}${recording.errors > 0 ? ` · ${recording.errors === 1 ? '1 fout' : `${recording.errors} fouten`}` : ''}`}
                        {...(recording.errors > 0
                          ? { kind: 'failed' as const, status: 'Met fouten' }
                          : { kind: 'done' as const, status: 'Zonder fouten' })}
                        aria-current={recording.id === current ? 'true' : undefined}
                        onClick={() => setCurrent(recording.id)}
                      />
                    ))}
                  </List>
                </div>
              </Panel>
            </aside>
          </div>
        </div>
      </ScrollArea>
    </AppFrame>
  )
}

export default {
  title: 'Opname afspelen',
  description:
    'Trail in Halo: een opname van een browsersessie rond een fout. De pagina speelt opnieuw af, met een tijdlijn vol markeringen en daaronder wat er gebeurde, de console en het netwerk.',
  icon: 'camera',
  product: 'halo',
  Screen: Trail,
} satisfies DemoModule
