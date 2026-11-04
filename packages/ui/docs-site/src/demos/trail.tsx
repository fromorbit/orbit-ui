import { Fragment, type ReactNode, useEffect, useState } from 'react'
import {
  adjacentMarker,
  Button,
  DataTable,
  type DataTableColumn,
  DropdownMenu,
  Icon,
  IconButton,
  type IconName,
  List,
  PageHeader,
  PropertyList,
  RoomyListRow,
  ScrollArea,
  Scrubber,
  type ScrubberMarker,
  Tabs,
  Tag,
  Timeline,
  TimelineItem,
  Tooltip,
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

const SPEEDS: readonly Speed[] = ['1', '2', '4']

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
 * red, the last event the player passed in full strength (the current step), and what it has not
 * reached yet as a dashed round; the current step also lies on a tint, so "you are here" holds at a
 * glance. Each event is a button that seeks the player there, so the
 * keyboard reaches every moment, not only the errors. The detail (a status, a file and line) is a
 * unit of its own that wraps under the title on a narrow screen and is never cut off.
 */
function Events({
  position,
  onSeek,
}: {
  position: number
  onSeek(seconds: number): void
}): ReactNode {
  const passed = EVENTS.filter((event) => event.at <= position + ON)
  const last = passed.at(-1)
  return (
    <div className="px-3 py-4 @3xl:px-4">
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
              <button
                type="button"
                aria-current={here ? 'step' : undefined}
                onClick={() => onSeek(event.at)}
                className={`-mx-1.5 flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 rounded-sm px-1.5 py-0.5 text-left outline-focus focus-visible:outline-2 focus-visible:outline-offset-1 ${here ? 'bg-surface-active' : 'hover:bg-surface'}`}
              >
                <span className={here ? 'font-medium text-fg' : ahead ? 'text-muted' : 'text-fg'}>
                  {event.title}
                </span>
                {event.detail === undefined ? null : (
                  <span className="whitespace-nowrap text-[12px] text-muted">{event.detail}</span>
                )}
                <span className="sr-only">{` (${look.word})`}</span>
              </button>
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

/** A path that may wrap after each slash and before its query, never inside a word. */
function breakable(path: string): ReactNode {
  return path.split(/(?<=\/)|(?=\?)/).map((part, index) => (
    // The parts of one path never change order, so the index is their identity.
    // biome-ignore lint/suspicious/noArrayIndexKey: see above
    <Fragment key={index}>
      {index === 0 ? null : <wbr />}
      {part}
    </Fragment>
  ))
}

/** Whether a request failed: its path and status turn red. */
const failed = (request: NetworkRequest) => request.status >= 400

/**
 * The columns of the requests: when, in the time of the timeline, then the method as a quiet
 * prefix of the path (one cell, so the status stays in sight on a phone), the status, how long it
 * took, and a waterfall over the whole recording. A request the player has not reached yet is
 * muted, as in the events.
 */
function networkColumns(longest: number, position: number): DataTableColumn<NetworkRequest>[] {
  const ahead = (request: NetworkRequest) => request.at > position + ON
  return [
    {
      id: 'at',
      header: 'Tijd',
      sortValue: (request) => request.at,
      cell: (request) => (
        <span className="text-muted tabular-nums">
          {stamp(request.at)}
          {ahead(request) ? <span className="sr-only">, nog niet afgespeeld</span> : null}
        </span>
      ),
    },
    {
      id: 'request',
      header: 'Verzoek',
      sortValue: (request) => request.path,
      cell: (request) => (
        <span
          className={`font-mono text-[11px] ${ahead(request) ? 'text-muted' : failed(request) ? 'text-danger' : 'text-fg'}`}
        >
          <span className="text-muted">{request.method}</span> {breakable(request.path)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      align: 'end',
      sortValue: (request) => request.status,
      cell: (request) => (
        <span
          className={
            ahead(request)
              ? 'text-muted'
              : failed(request)
                ? 'font-medium text-danger'
                : 'text-secondary'
          }
        >
          {request.status}
        </span>
      ),
    },
    {
      id: 'duration',
      header: 'Duur',
      align: 'end',
      hideBelow: 'md',
      sortValue: (request) => request.ms,
      cell: (request) => (
        <span
          className={`whitespace-nowrap tabular-nums ${ahead(request) ? 'text-muted' : request.ms > 1000 ? 'text-attention' : 'text-secondary'}`}
        >
          {`${request.ms.toLocaleString('nl-NL')} ms`}
        </span>
      ),
    },
    {
      id: 'size',
      header: 'Grootte',
      align: 'end',
      hideBelow: 'lg',
      cell: (request) => <span className="whitespace-nowrap text-muted">{request.size}</span>,
    },
    {
      id: 'waterfall',
      header: 'Verloop',
      hideBelow: 'lg',
      cell: (request) => (
        <span className="relative block h-1.5 w-40 rounded-full bg-mark">
          <span
            className={`absolute inset-y-0 min-w-1 rounded-full ${ahead(request) ? 'bg-border-strong' : failed(request) ? 'bg-danger' : request.ms > 1000 ? 'bg-attention' : 'bg-secondary'}`}
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
function Network({ position }: { position: number }): ReactNode {
  const longest = Math.max(...NETWORK.map((request) => request.at * 1000 + request.ms))
  return (
    <div className="p-2 text-[12px]">
      <DataTable
        label="Netwerk"
        columns={networkColumns(longest, position)}
        rows={NETWORK}
        rowKey={(request) => `${request.method}-${request.at}`}
        labels={{ selectAll: 'Alles selecteren', selectRow: (name) => `Selecteer ${name}` }}
      />
    </div>
  )
}

/**
 * The words of a recording's trigger, as a quiet tag: the cause of the recording, not an event,
 * so it leaves the red to the errors themselves.
 */
function TriggerTag({ trigger }: { trigger: string }): ReactNode {
  return <Tag tone="neutral">{trigger}</Tag>
}

/** The events at a moment, in the words of the legend, for the playhead's position in words. */
function spoken(seconds: number, here: readonly ScrubberMarker<TrailEventKind>[]): string {
  return [
    `${clock(seconds)} van ${clock(DURATION)}`,
    ...here.map((marker) => `${TRAIL_KINDS[marker.kind].label}: ${marker.label}`),
  ].join(', ')
}

/**
 * Halo's trail: a recording of a browser session around an error, replayed with its timeline,
 * what happened, the console and the network, and the other recordings of the app beside it.
 *
 * Under the timeline the controls wrap in three groups at 28px: the transport (5 seconds back,
 * Afspelen as the one emphasis of the view, 5 seconds forward), the time with the speed beside it,
 * and on the right the way between the errors ("Vorige fout", where the player is among them,
 * "Volgende fout"). The legend stays a passive key. On a narrow screen the timeline and its
 * controls stick to the bottom of the player while the replay scrolls past, so both stay in
 * sight. A jump between errors is announced politely.
 */
function Trail(): ReactNode {
  const [speed, setSpeed] = useState<Speed>('1')
  const [tab, setTab] = useState('gebeurtenissen')
  const [current, setCurrent] = useState('r1')
  const [position, setPosition] = useState(POSITION)
  const [playing, setPlaying] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const errors = ERRORS.length
  const reached = ERRORS.filter((at) => at <= position + ON).length
  const previous = adjacentMarker(MARKERS, position, 'previous', ['fout'], ON)
  const next = adjacentMarker(MARKERS, position, 'next', ['fout'], ON)
  const seek = (seconds: number) => setPosition(Math.min(Math.max(seconds, 0), DURATION))
  const jump = (marker: ScrubberMarker<TrailEventKind> | undefined) => {
    if (marker === undefined) return
    setPlaying(false)
    seek(marker.at)
    const index = ERRORS.indexOf(marker.at) + 1
    setAnnouncement(`Fout ${index} van ${errors}: ${marker.label}, ${clock(marker.at)}`)
  }
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
            meta="webwinkel · main · wordt verwijderd na 3 nov"
            actions={
              <>
                <div className="hidden @xl:block">
                  <Button variant="secondary" size="sm">
                    Openen in Orbit Review
                  </Button>
                </div>
                <Button variant="secondary" size="sm">
                  Opname delen
                </Button>
              </>
            }
          />
          <div className="grid grid-cols-1 gap-6 @5xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="flex min-w-0 flex-col gap-6">
              <section
                aria-label="Speler"
                className="flex flex-col gap-3 rounded-lg bg-overlay p-3 shadow-plane @3xl:p-4"
              >
                <TrailReplay position={position} />
                <div className="flex flex-col gap-2 bg-overlay @max-3xl:sticky @max-3xl:bottom-0 @max-3xl:z-10 @max-3xl:-mx-3 @max-3xl:-mb-3 @max-3xl:rounded-b-lg @max-3xl:px-3 @max-3xl:pt-2 @max-3xl:pb-3">
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
                    valueText={spoken}
                    legendLabel="Markeringen"
                    groupLabel={(count) => `${count} gebeurtenissen`}
                    controls={
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <div className="flex items-center gap-2">
                          <Tooltip label="5 seconden terug">
                            <IconButton
                              icon="rewind"
                              size="sm"
                              label="5 seconden terug"
                              onClick={() => seek(position - 5)}
                            />
                          </Tooltip>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              if (!playing && position >= DURATION) seek(0)
                              setPlaying(!playing)
                            }}
                          >
                            <Icon name={playing ? 'pause' : 'play'} size="sm" />
                            {playing ? 'Pauzeren' : 'Afspelen'}
                          </Button>
                          <Tooltip label="5 seconden vooruit">
                            <IconButton
                              icon="fast-forward"
                              size="sm"
                              label="5 seconden vooruit"
                              onClick={() => seek(position + 5)}
                            />
                          </Tooltip>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[13px] text-fg tabular-nums whitespace-nowrap">
                            {clock(position)}
                            <span className="font-normal text-muted">{` / ${clock(DURATION)}`}</span>
                          </span>
                          <DropdownMenu
                            label="Snelheid"
                            side="top"
                            align="start"
                            trigger={
                              <Button variant="ghost" size="sm" aria-label={`Snelheid ${speed}×`}>
                                {`${speed}×`}
                              </Button>
                            }
                            items={SPEEDS.map((option) => ({
                              id: option,
                              label: `${option}×`,
                              kind: 'radio' as const,
                              group: 'snelheid',
                              checked: speed === option,
                              onSelect: () => setSpeed(option),
                            }))}
                          />
                        </div>
                        <fieldset
                          aria-label="Fouten"
                          className="m-0 ml-auto flex min-w-0 items-center gap-1 border-0 p-0"
                        >
                          <Tooltip label="Vorige fout">
                            <IconButton
                              icon="chevron-left"
                              size="sm"
                              outlined
                              label="Vorige fout"
                              aria-disabled={previous === undefined}
                              onClick={() => jump(previous)}
                            />
                          </Tooltip>
                          <span className="min-w-22 px-1 text-center text-[13px] text-secondary tabular-nums whitespace-nowrap">
                            {reached === 0 ? `${errors} fouten` : `Fout ${reached} van ${errors}`}
                          </span>
                          <Tooltip label="Volgende fout">
                            <IconButton
                              icon="chevron-right"
                              size="sm"
                              outlined
                              label="Volgende fout"
                              aria-disabled={next === undefined}
                              onClick={() => jump(next)}
                            />
                          </Tooltip>
                        </fieldset>
                      </div>
                    }
                  />
                  <p role="status" className="sr-only">
                    {announcement}
                  </p>
                </div>
              </section>
              <section
                aria-label="Wat er gebeurde"
                className="flex flex-col overflow-hidden rounded-lg bg-overlay shadow-plane"
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
                      content: (
                        <Events
                          position={position}
                          onSeek={(seconds) => {
                            setPlaying(false)
                            seek(seconds)
                          }}
                        />
                      ),
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
                      content: <Network position={position} />,
                    },
                  ]}
                />
              </section>
            </div>
            <aside className="flex min-w-0 flex-col gap-6">
              <Panel title="Details" headingLevel={2}>
                <PropertyList
                  label="Details van de opname"
                  groups={[
                    [
                      { label: 'Vastgelegd door', value: 'Halo, op de server' },
                      {
                        label: 'Aanleiding',
                        value: (
                          <span className="inline-flex">
                            <TriggerTag trigger="Na een fout" />
                          </span>
                        ),
                      },
                      { label: 'Gestart', value: 'vandaag 13:52' },
                      { label: 'Duur', value: clock(DURATION) },
                      {
                        label: 'Fouten',
                        value: <span className="tabular-nums">{errors}</span>,
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
              <Panel title="Opnames" meta="van webwinkel" headingLevel={2} flush>
                {/* The open recording carries the selected tint, as a chosen row does elsewhere. */}
                <div className="px-2 pb-2 [&_[aria-current=true]]:bg-surface-active">
                  <List label="Opnames">
                    {RECORDINGS.map((recording) => {
                      const count =
                        recording.errors === 0
                          ? ''
                          : recording.errors === 1
                            ? '1 fout'
                            : `${recording.errors} fouten`
                      const note = [recording.trigger, recording.when, count].filter(Boolean)
                      return (
                        <RoomyListRow
                          key={recording.id}
                          title={recording.title}
                          meta={recording.duration}
                          note={note.join(' · ')}
                          {...(recording.errors > 0
                            ? { kind: 'failed' as const, status: 'Met fouten' }
                            : { kind: 'done' as const, status: 'Zonder fouten' })}
                          // One clean name, each part once: "Kassa betaalt niet, met fouten, 0:24,
                          // na een fout, vandaag 13:52, 2 fouten".
                          aria-label={[
                            recording.title,
                            recording.errors > 0 ? 'met fouten' : 'zonder fouten',
                            recording.duration,
                            ...note.map((part, index) => (index === 0 ? part.toLowerCase() : part)),
                          ].join(', ')}
                          aria-current={recording.id === current ? 'true' : undefined}
                          onClick={() => setCurrent(recording.id)}
                        />
                      )
                    })}
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
