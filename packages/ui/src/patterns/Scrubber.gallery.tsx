import { type ReactNode, useState } from 'react'
import type { Story } from '../gallery/story'
import { Scrubber, type ScrubberKind, type ScrubberMarker } from './Scrubber'

type Kind = 'klik' | 'navigatie' | 'fout' | 'verzoek'

/** The kinds of a recorded browser session, in the words of Halo's trail. */
const KINDS: Record<Kind, ScrubberKind> = {
  fout: { label: 'Fout', shape: 'diamond', tone: 'danger' },
  verzoek: { label: 'Mislukt verzoek', shape: 'ring', tone: 'danger' },
  klik: { label: 'Klik', shape: 'dot' },
  navigatie: { label: 'Navigatie', shape: 'chevron' },
}

/** A customer who tries to pay twice and gets a server error both times. */
const CHECKOUT: ScrubberMarker<Kind>[] = [
  { at: 0.2, kind: 'navigatie', label: 'Opent de startpagina (/)' },
  { at: 3.1, kind: 'klik', label: 'Klikt op In winkelmand' },
  { at: 5.8, kind: 'navigatie', label: 'Opent de kassa (/kassa)' },
  { at: 9.2, kind: 'klik', label: 'Kiest een bank' },
  { at: 12.6, kind: 'klik', label: 'Klikt op Betalen' },
  { at: 14.35, kind: 'fout', label: 'TypeError in Kassa.betaal' },
  { at: 14.6, kind: 'verzoek', label: 'POST /api/bestellingen · 500' },
  { at: 19.1, kind: 'klik', label: 'Klikt opnieuw op Betalen' },
  { at: 20.35, kind: 'fout', label: 'TypeError in Kassa.betaal' },
  { at: 20.6, kind: 'verzoek', label: 'POST /api/bestellingen · 500' },
  { at: 23.0, kind: 'navigatie', label: 'Opent de startpagina (/)' },
]

/** A failed request and the error it throws in the same tenth of a second. */
const TOGETHER: ScrubberMarker<Kind>[] = [
  { at: 1.2, kind: 'navigatie', label: 'Opent de kassa (/kassa)' },
  { at: 4.8, kind: 'klik', label: 'Klikt op Betalen' },
  { at: 5.1, kind: 'verzoek', label: 'POST /api/betaal · 502' },
  { at: 5.1, kind: 'fout', label: 'Error: betaling geweigerd in Kassa.betaal' },
  { at: 9.4, kind: 'navigatie', label: 'Opent de startpagina (/)' },
]

/** Two minutes of a customer who browses a lot: 48 events, dense where they click fast. */
const BUSY: ScrubberMarker<Kind>[] = Array.from({ length: 48 }, (_, index) => {
  const at = Math.round((index * 2.4 + (index % 5) * 0.35 + 0.4) * 10) / 10
  const kind: Kind =
    index === 31 ? 'fout' : index === 32 ? 'verzoek' : index % 7 === 0 ? 'navigatie' : 'klik'
  const label =
    kind === 'fout'
      ? 'TypeError in Zoeken.filter'
      : kind === 'verzoek'
        ? 'GET /api/zoeken?q=bonen · 500'
        : kind === 'navigatie'
          ? `Opent pagina ${index / 7 + 1} van het assortiment`
          : `Klikt op product ${index + 1}`
  return { at, kind, label }
})

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
  note,
  width = 'max-w-[640px]',
}: {
  duration: number
  start: number
  markers: ScrubberMarker<Kind>[]
  legend?: boolean
  disabled?: boolean
  /** A line under the player that says why it cannot play yet, and what comes next. */
  note?: string
  width?: string
}): ReactNode {
  const [value, setValue] = useState(start)
  return (
    <div className={`flex w-full ${width} flex-col gap-2 rounded-lg bg-overlay p-4`}>
      <Scrubber
        label="Afspeelpositie"
        duration={duration}
        value={value}
        onValueChange={setValue}
        markers={markers}
        kinds={KINDS}
        formatTime={clock}
        valueText={(seconds, here) =>
          [
            `${clock(seconds)} van ${clock(duration)}`,
            ...here.map((marker) => `${KINDS[marker.kind].label}: ${marker.label}`),
          ].join(', ')
        }
        {...(legend ? { legendLabel: 'Markeringen' } : {})}
        groupLabel={(count) => `${count} gebeurtenissen`}
        disabled={disabled}
      />
      {note === undefined ? null : (
        <p role="status" className="m-0 text-[12px] text-secondary">
          {note}
        </p>
      )}
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'Scrubber',
  states: {
    'Bij de eerste fout': () => <Player duration={24} start={14.35} markers={CHECKOUT} />,
    'Aan het begin: nog niets afgespeeld': () => (
      <Player duration={24} start={0} markers={CHECKOUT} />
    ),
    'Een fout en een mislukt verzoek tegelijk: één markering, beide vormen': () => (
      <Player duration={10} start={2} markers={TOGETHER} />
    ),
    'Dicht: 48 gebeurtenissen, dichtbij gegroepeerd; een vage tweede vorm markeert een groep, de kaart telt hem':
      () => <Player duration={120} start={76} markers={BUSY} />,
    'Een lange opname: streepjes om de vijf minuten': () => (
      <Player duration={721} start={402} markers={ADMIN} />
    ),
    'Smal: 320px': () => (
      <Player duration={24} start={14.35} markers={CHECKOUT} width="max-w-[288px]" />
    ),
    'Zonder markeringen of legenda': () => (
      <Player duration={95} start={31} markers={[]} legend={false} />
    ),
    'Wordt nog verwerkt: uitgeschakeld': () => (
      <Player
        duration={24}
        start={0}
        markers={[]}
        disabled
        note="Opname wordt nog verwerkt. Over een paar seconden kun je afspelen."
      />
    ),
  },
} satisfies Story
