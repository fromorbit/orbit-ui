import type { ReactNode } from 'react'
import { Icon } from '../../../../src'
import { clock, EVENTS } from './TrailData'

/** The order on the page that was recorded. */
const LINES = [
  { name: 'Koffiebonen Noord', note: '1 kg · bonen', price: '€ 12,50' },
  { name: 'Mok Haven', note: 'aardewerk · blauw', price: '€ 9,95' },
  { name: 'Filterhouder', note: 'porselein', price: '€ 17,00' },
] as const

/** The first click on Betalen and the first error, from the recording. */
const PAY =
  EVENTS.find((event) => event.kind === 'klik' && event.title === 'Klikt op ‘Betalen’')?.at ?? 0
const ERROR = EVENTS.find((event) => event.kind === 'fout')?.at ?? 0

/**
 * The recorded page at `position`: the checkout of the web shop with its order and the payment by
 * iDEAL. Once the customer has pressed Betalen the button is ringed with the pointer on it, and
 * from the first error on the message the customer got stands under it. A drawing from the
 * tokens, as a replay shows the page in its own styles: dimmed and a step less saturated, so the
 * recorded shop's own buttons never compete with the player's, and a quiet "Zo zag de klant het"
 * in its address bar says whose page this is.
 */
export function TrailReplay({ position }: { position: number }): ReactNode {
  const clicked = position >= PAY
  const failed = position >= ERROR
  return (
    <div
      role="img"
      aria-label={`De kassa van de webwinkel op ${clock(position)}${failed ? ', met de melding: Er ging iets mis, het betalen lukt nu niet' : ''}`}
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-canvas"
    >
      <div className="flex h-8 shrink-0 items-center gap-2 border-border border-b bg-frame px-3">
        <span className="flex gap-1">
          <span className="size-2 rounded-full bg-border-strong" />
          <span className="size-2 rounded-full bg-border-strong" />
          <span className="size-2 rounded-full bg-border-strong" />
        </span>
        {/* Cut in the middle: the host gives way with an ellipsis, the path (/kassa) stays. */}
        <span
          title="webwinkel.zilverberg.test/kassa"
          className="mx-auto flex h-5 min-w-0 max-w-80 flex-1 items-center justify-center rounded-md bg-surface-active px-2 font-mono text-[11px] text-secondary"
        >
          <span className="mr-1.5 flex shrink-0">
            <Icon name="lock" size="sm" tone="faint" />
          </span>
          <span className="min-w-0 truncate">webwinkel.zilverberg.test</span>
          <span className="shrink-0">/kassa</span>
        </span>
        <span className="hidden shrink-0 text-[11px] text-muted @xl:inline">
          Zo zag de klant het
        </span>
      </div>
      <div className="pointer-events-none flex flex-col gap-3 p-3 opacity-70 saturate-50 @3xl:gap-4 @3xl:p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate font-heading text-[15px] text-fg">
            Zilverberg Koffie
          </span>
          <span className="flex shrink-0 items-center gap-3 whitespace-nowrap text-[12px] text-secondary">
            <span className="hidden @2xl:inline">Assortiment</span>
            <span className="hidden @2xl:inline">Over ons</span>
            <span className="rounded-full bg-surface-active px-2 py-0.5 text-fg">Winkelmand 3</span>
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          {/* On a phone the order gives way, so the replay, the timeline and Afspelen fit in one view. */}
          <div className="hidden flex-col gap-2 @xl:flex">
            <span className="font-heading text-[15px] text-fg">Kassa</span>
            <ul className="m-0 flex list-none flex-col p-0">
              {LINES.map((line) => (
                <li
                  key={line.name}
                  className="flex items-center gap-3 border-border border-b py-1.5 last:border-b-0"
                >
                  <span className="size-8 shrink-0 rounded-md bg-surface-active" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[12px] text-fg">{line.name}</span>
                    <span className="truncate text-[11px] text-muted">{line.note}</span>
                  </span>
                  <span className="text-[12px] text-fg tabular-nums">{line.price}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-overlay p-3">
            <span className="text-[12px] text-muted">Betaalmethode</span>
            <span className="flex h-8 items-center justify-between rounded-md border border-border px-2.5 text-[12px] text-fg">
              iDEAL · Rabobank
              <Icon name="chevron-down" size="sm" tone="faint" />
            </span>
            <span className="flex items-baseline justify-between text-[12px]">
              <span className="text-secondary">Totaal</span>
              <span className="font-medium text-fg tabular-nums">€ 39,45</span>
            </span>
            {/* The customer's button in the quiet frame of a secondary: the replay is a picture of
                their page, and the one emphasis of this view stays the player's Afspelen. */}
            <span className="relative flex h-8 items-center justify-center rounded-md border border-border-strong font-medium text-[12px] text-fg">
              Betalen
              {clicked ? (
                <>
                  <span className="absolute -inset-1.5 rounded-lg border-2 border-secondary border-dashed" />
                  <span className="absolute -right-1 -bottom-2 text-fg">
                    <Icon name="mouse-pointer-click" size="sm" />
                  </span>
                </>
              ) : null}
            </span>
            <span
              className={`flex items-start gap-2 rounded-md border border-danger-border bg-danger-subtle px-2.5 py-2 text-[12px] text-danger ${failed ? '' : 'invisible'}`}
            >
              <Icon name="alert-triangle" size="sm" />
              <span className="flex flex-col">
                <span className="font-medium">Er ging iets mis…</span>
                <span>Het betalen lukt nu niet. Probeer het later opnieuw.</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
