import type { ReactNode } from 'react'
import { Missing } from '../../demo-kit/Missing'
import { clock, type TrailEvent, type TrailEventKind } from './TrailData'

/** The look of a marker per kind: a shape and a colour, so neither carries it alone. */
const MARKER: Record<TrailEventKind, { label: string; className: string }> = {
  klik: { label: 'Klik', className: 'size-2 rounded-full bg-secondary' },
  navigatie: { label: 'Navigatie', className: 'h-3 w-0.5 rounded-full bg-accent-text' },
  fout: { label: 'Fout', className: 'size-2.5 rotate-45 rounded-[2px] bg-danger' },
  verzoek: {
    label: 'Mislukt verzoek',
    className: 'size-2 rounded-full border-2 border-danger bg-overlay',
  },
}

const KINDS: TrailEventKind[] = ['klik', 'navigatie', 'fout', 'verzoek']

/**
 * The timeline of a recording, drawn as the missing `Scrubber`: the part played, the playhead,
 * a marker per event in a shape of its kind, the minutes underneath and a legend.
 */
export function TrailScrubber({
  events,
  duration,
  position,
}: {
  events: readonly TrailEvent[]
  duration: number
  position: number
}): ReactNode {
  const at = (seconds: number) => `${(seconds / duration) * 100}%`
  const ticks = Array.from({ length: Math.floor(duration / 5) + 1 }, (_, index) => index * 5)
  return (
    <Missing name="Scrubber">
      <div className="flex flex-col gap-2 px-1 pt-1">
        <div className="relative h-6">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-mark" />
          <div
            className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-secondary"
            style={{ width: at(position) }}
          />
          {events.map((event) => (
            <span
              key={`${event.kind}-${event.at}`}
              title={`${clock(event.at)} · ${MARKER[event.kind].label}: ${event.title}`}
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 ${MARKER[event.kind].className}`}
              style={{ left: at(event.at) }}
            />
          ))}
          <span
            role="slider"
            tabIndex={0}
            aria-label="Afspeelpositie"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={position}
            aria-valuetext={`${clock(position)} van ${clock(duration)}`}
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-canvas bg-fg shadow-menu outline-focus focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ left: at(position) }}
          />
        </div>
        <div aria-hidden="true" className="relative h-4 text-[11px] text-muted tabular-nums">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute -translate-x-1/2 first:translate-x-0"
              style={{ left: at(tick) }}
            >
              {clock(tick)}
            </span>
          ))}
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[12px] text-secondary">
          {KINDS.map((kind) => (
            <li key={kind} className="flex items-center gap-1.5">
              <span className="flex size-3 items-center justify-center">
                <span className={MARKER[kind].className} />
              </span>
              {`${MARKER[kind].label} ${events.filter((event) => event.kind === kind).length}`}
            </li>
          ))}
        </ul>
      </div>
    </Missing>
  )
}
