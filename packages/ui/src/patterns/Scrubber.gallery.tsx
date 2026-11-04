import { type ReactNode, useState } from 'react'
import type { Story } from '../gallery/story'
import { Scrubber, type ScrubberKind, type ScrubberMarker } from './Scrubber'

type Kind = 'klik' | 'navigatie' | 'fout' | 'verzoek'

/** The kinds of a recorded browser session, in the words of Halo's trail. */
const KINDS: Record<Kind, ScrubberKind> = {
  klik: { label: 'Klik', shape: 'dot' },
  navigatie: { label: 'Navigatie', shape: 'bar' },
  fout: { label: 'Fout', shape: 'diamond', tone: 'danger' },
  verzoek: { label: 'Mislukt verzoek', shape: 'ring', tone: 'danger' },
}

/** A customer who tries to pay twice and gets a server error both times. */
const CHECKOUT: ScrubberMarker<Kind>[] = [
  { at: 0.2, kind: 'navigatie', label: 'Opent /' },
  { at: 3.1, kind: 'klik', label: 'Klikt op In winkelmand' },
  { at: 5.8, kind: 'navigatie', label: 'Opent /kassa' },
  { at: 9.2, kind: 'klik', label: 'Kiest een bank' },
  { at: 12.6, kind: 'klik', label: 'Klikt op Betalen' },
  { at: 14.35, kind: 'fout', label: 'TypeError in Kassa.betaal' },
  { at: 14.6, kind: 'verzoek', label: 'POST /api/bestellingen · 500' },
  { at: 19.1, kind: 'klik', label: 'Klikt opnieuw op Betalen' },
  { at: 20.35, kind: 'fout', label: 'TypeError in Kassa.betaal' },
  { at: 20.6, kind: 'verzoek', label: 'POST /api/bestellingen · 500' },
  { at: 23.0, kind: 'navigatie', label: 'Opent /' },
]

/** A long session in the admin, with one slow request near the end. */
const ADMIN: ScrubberMarker<Kind>[] = [
  { at: 4, kind: 'navigatie', label: 'Opent /beheer' },
  { at: 96, kind: 'klik', label: 'Filtert op Openstaand' },
  { at: 241, kind: 'navigatie', label: 'Opent /beheer/bestellingen/1042' },
  { at: 388, kind: 'klik', label: 'Klikt op Terugbetalen' },
  { at: 402, kind: 'verzoek', label: 'POST /api/terugbetalingen · 502' },
  { at: 655, kind: 'navigatie', label: 'Opent /beheer' },
]

/** A time as the player writes it: 0:14, 12:05. */
function clock(seconds: number): string {
  const whole = Math.floor(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

/** A scrubber on the plane of a player, holding its own position. */
function Player({
  duration,
  start,
  markers,
  legend = true,
  disabled = false,
  width = 'max-w-[640px]',
}: {
  duration: number
  start: number
  markers: ScrubberMarker<Kind>[]
  legend?: boolean
  disabled?: boolean
  width?: string
}): ReactNode {
  const [value, setValue] = useState(start)
  return (
    <div className={`w-full ${width} rounded-lg bg-overlay p-4`}>
      <Scrubber
        label="Afspeelpositie"
        duration={duration}
        value={value}
        onValueChange={setValue}
        markers={markers}
        kinds={KINDS}
        formatTime={clock}
        valueText={(seconds) => `${clock(seconds)} van ${clock(duration)}`}
        {...(legend ? { legendLabel: 'Markeringen' } : {})}
        disabled={disabled}
      />
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'Scrubber',
  states: {
    'At the first error': () => <Player duration={24} start={14.35} markers={CHECKOUT} />,
    'At the start: nothing played yet': () => <Player duration={24} start={0} markers={CHECKOUT} />,
    'A long recording: ticks every five minutes': () => (
      <Player duration={721} start={402} markers={ADMIN} />
    ),
    'Narrow: 320px': () => (
      <Player duration={24} start={14.35} markers={CHECKOUT} width="max-w-[288px]" />
    ),
    'Without markers or legend': () => (
      <Player duration={95} start={31} markers={[]} legend={false} />
    ),
    'Still being processed: disabled': () => (
      <Player duration={24} start={0} markers={[]} disabled />
    ),
  },
} satisfies Story
