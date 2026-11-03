import type { ReactNode } from 'react'
import { Icon } from '../../../../src'

/** The order on the page that was recorded. */
const LINES = [
  { name: 'Koffiebonen Noord', note: '1 kg · bonen', price: '€ 12,50' },
  { name: 'Mok Haven', note: 'aardewerk · blauw', price: '€ 9,95' },
  { name: 'Filterhouder', note: 'porselein', price: '€ 17,00' },
] as const

/**
 * The recorded page at the moment of the first error: the checkout of the web shop with its
 * order, the payment by iDEAL and the message the customer got. A drawing from the tokens, as a
 * replay shows the page in its own styles; the click that caused it is ringed.
 */
export function TrailReplay(): ReactNode {
  return (
    <div
      role="img"
      aria-label="De kassa van de webwinkel op 0:14, met de melding: Er ging iets mis, het betalen lukt nu niet"
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-canvas"
    >
      <div className="flex h-8 shrink-0 items-center gap-2 border-border border-b bg-frame px-3">
        <span className="flex gap-1">
          <span className="size-2 rounded-full bg-border-strong" />
          <span className="size-2 rounded-full bg-border-strong" />
          <span className="size-2 rounded-full bg-border-strong" />
        </span>
        <span className="mx-auto flex h-5 min-w-0 max-w-80 flex-1 items-center justify-center gap-1.5 truncate rounded-md bg-surface-active px-2 font-mono text-[11px] text-secondary">
          <Icon name="lock" size="sm" tone="faint" />
          webwinkel.zilverberg.test/kassa
        </span>
      </div>
      <div className="flex flex-col gap-4 p-4 @3xl:p-5">
        <div className="flex items-center justify-between">
          <span className="whitespace-nowrap font-heading text-[15px] text-fg">
            Zilverberg Koffie
          </span>
          <span className="flex items-center gap-3 whitespace-nowrap text-[12px] text-secondary">
            <span className="hidden @2xl:inline">Assortiment</span>
            <span className="hidden @2xl:inline">Over ons</span>
            <span className="rounded-full bg-surface-active px-2 py-0.5 text-fg">Winkelmand 3</span>
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            <span className="font-heading text-[18px] text-fg">Kassa</span>
            <ul className="m-0 flex list-none flex-col p-0">
              {LINES.map((line) => (
                <li
                  key={line.name}
                  className="flex items-center gap-3 border-border border-b py-2 last:border-b-0"
                >
                  <span className="size-8 shrink-0 rounded-md bg-surface-active" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[12.5px] text-fg">{line.name}</span>
                    <span className="truncate text-[11px] text-muted">{line.note}</span>
                  </span>
                  <span className="text-[12.5px] text-fg tabular-nums">{line.price}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-overlay p-3">
            <span className="text-[12px] text-muted">Betaalmethode</span>
            <span className="flex h-8 items-center justify-between rounded-md border border-border px-2.5 text-[12.5px] text-fg">
              iDEAL · Rabobank
              <Icon name="chevron-down" size="sm" tone="faint" />
            </span>
            <span className="flex items-baseline justify-between text-[12.5px]">
              <span className="text-secondary">Totaal</span>
              <span className="font-medium text-fg tabular-nums">€ 39,45</span>
            </span>
            <span className="relative flex h-8 items-center justify-center rounded-md bg-accent font-medium text-[12.5px] text-accent-fg">
              Betalen
              <span className="absolute -inset-1.5 rounded-lg border-2 border-danger/70" />
              <span className="absolute -right-1 -bottom-2 text-fg">
                <Icon name="mouse-pointer-click" size="sm" />
              </span>
            </span>
            <span className="flex items-start gap-2 rounded-md border border-danger-border bg-danger-subtle px-2.5 py-2 text-[12px] text-danger">
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
