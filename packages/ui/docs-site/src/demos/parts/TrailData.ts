import type { ScrubberKind, ScrubberMarker } from '../../../../src'

/**
 * The made-up recording the trail demo replays: a customer of the web shop who tries to pay at
 * the checkout twice and gets a server error both times. Times are seconds from the start.
 */

/** What a marker on the timeline and a line of the events stands for. */
export type TrailEventKind = 'klik' | 'navigatie' | 'fout' | 'verzoek'

/** One thing that happened in the recording. */
export interface TrailEvent {
  at: number
  kind: TrailEventKind
  title: string
  detail?: string
}

/**
 * How each kind stands on the timeline: a shape per kind, and red only for what went wrong. A
 * navigation is a quiet bar rather than violet, which is for links and focus.
 */
export const TRAIL_KINDS: Record<TrailEventKind, ScrubberKind> = {
  klik: { label: 'Klik', shape: 'dot' },
  navigatie: { label: 'Navigatie', shape: 'bar' },
  fout: { label: 'Fout', shape: 'diamond', tone: 'danger' },
  verzoek: { label: 'Mislukt verzoek', shape: 'ring', tone: 'danger' },
}

/** One line of the browser's console. */
export interface ConsoleLine {
  at: number
  level: 'info' | 'warn' | 'error'
  text: string
  source?: string
}

/** One request the page made. */
export interface NetworkRequest {
  at: number
  method: 'GET' | 'POST'
  path: string
  status: number
  ms: number
  size: string
}

/** One recording in the list beside the player. */
export interface Recording {
  id: string
  title: string
  trigger: 'Fout' | 'Markering' | 'Steekproef' | 'Testrun'
  when: string
  duration: string
  errors: number
}

/** The length of the recording, in seconds. */
export const DURATION = 24

/** Where the player stands: at the first error. */
export const POSITION = 14.35

export const EVENTS: TrailEvent[] = [
  { at: 0.2, kind: 'navigatie', title: 'Opent /', detail: 'Webwinkel 4.2.0' },
  { at: 3.1, kind: 'klik', title: 'Klikt op In winkelmand', detail: 'Koffiebonen Noord' },
  { at: 5.8, kind: 'navigatie', title: 'Opent /kassa' },
  { at: 9.2, kind: 'klik', title: 'Kiest een bank', detail: 'Rabobank' },
  { at: 12.6, kind: 'klik', title: 'Klikt op Betalen' },
  { at: 14.35, kind: 'fout', title: 'TypeError in Kassa.betaal', detail: 'kassa.js:88' },
  { at: 14.6, kind: 'verzoek', title: 'POST /api/bestellingen', detail: '500 · 233 ms' },
  { at: 19.1, kind: 'klik', title: 'Klikt opnieuw op Betalen' },
  { at: 20.35, kind: 'fout', title: 'TypeError in Kassa.betaal', detail: 'kassa.js:88' },
  { at: 20.6, kind: 'verzoek', title: 'POST /api/bestellingen', detail: '500 · 241 ms' },
  { at: 23.0, kind: 'navigatie', title: 'Opent /', detail: 'verlaat de kassa' },
]

/** The events as markers on the timeline, named by what happened. */
export const MARKERS: ScrubberMarker<TrailEventKind>[] = EVENTS.map((event) => ({
  at: event.at,
  kind: event.kind,
  label: event.detail === undefined ? event.title : `${event.title} · ${event.detail}`,
}))

/** The moments the player can skip between with "Vorige fout" and "Volgende fout". */
export const ERRORS = EVENTS.filter((event) => event.kind === 'fout').map((event) => event.at)

export const CONSOLE: ConsoleLine[] = [
  { at: 0.2, level: 'info', text: 'Webwinkel 4.2.0 gestart' },
  { at: 6.3, level: 'warn', text: 'Bezorgopties laden traag (1840 ms)' },
  {
    at: 14.35,
    level: 'error',
    text: "TypeError: Cannot read properties of undefined (reading 'total')",
    source: 'at Kassa.betaal (kassa.js:88)',
  },
  {
    at: 20.35,
    level: 'error',
    text: "TypeError: Cannot read properties of undefined (reading 'total')",
    source: 'at Kassa.betaal (kassa.js:88)',
  },
]

export const NETWORK: NetworkRequest[] = [
  { at: 0.3, method: 'GET', path: '/api/producten?pagina=1', status: 200, ms: 84, size: '4,8 kB' },
  { at: 3.2, method: 'POST', path: '/api/winkelmand', status: 201, ms: 61, size: '0,6 kB' },
  { at: 5.9, method: 'GET', path: '/api/winkelmand', status: 200, ms: 38, size: '1,2 kB' },
  { at: 6.0, method: 'GET', path: '/api/bezorgopties', status: 200, ms: 1840, size: '2,1 kB' },
  { at: 14.1, method: 'POST', path: '/api/bestellingen', status: 500, ms: 233, size: '0,1 kB' },
  { at: 20.1, method: 'POST', path: '/api/bestellingen', status: 500, ms: 241, size: '0,1 kB' },
  { at: 23.1, method: 'GET', path: '/api/producten?pagina=1', status: 200, ms: 79, size: '4,8 kB' },
]

export const RECORDINGS: Recording[] = [
  {
    id: 'r1',
    title: 'Pagina op webwinkel.zilverberg.test',
    trigger: 'Fout',
    when: 'vandaag 13:52',
    duration: '0:24',
    errors: 2,
  },
  {
    id: 'r2',
    title: 'Scenariorun afrekenen-ideal',
    trigger: 'Testrun',
    when: 'vandaag 11:08',
    duration: '0:41',
    errors: 1,
  },
  {
    id: 'r3',
    title: 'Pagina op beheer.zilverberg.test',
    trigger: 'Markering',
    when: 'gisteren 16:20',
    duration: '1:12',
    errors: 0,
  },
  {
    id: 'r4',
    title: 'Pagina op webwinkel.zilverberg.test',
    trigger: 'Steekproef',
    when: 'gisteren 09:41',
    duration: '2:03',
    errors: 0,
  },
]

/** A time in seconds as the player writes it: 0:14. */
export function clock(seconds: number): string {
  const whole = Math.floor(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

/** A time in seconds with its tenths, for a line of the console: 14,3 s. */
export function stamp(seconds: number): string {
  return `${seconds.toFixed(1).replace('.', ',')} s`
}
