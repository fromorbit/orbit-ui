import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { Button } from './Button'
import { StatusMark, type StatusMarkKind } from './StatusMark'

/** Every kind with its word, as a list of spaces names them. */
const kinds: [StatusMarkKind, string][] = [
  ['running', 'Draait'],
  ['fault', 'Fout'],
  ['blocked', 'Geblokkeerd'],
  ['stopped', 'Gestopt'],
]

/** A few rows of a list: a mark, a name and what is going on, in muted words. */
const rows: [StatusMarkKind, string, string][] = [
  ['running', 'shop-main', 'laravel · 3 apps'],
  ['fault', 'pr-482', 'poort 5432 bezet'],
  ['blocked', 'billing', 'wacht op geheim'],
  ['stopped', 'docs', 'gestopt 2 u'],
]

/** The marks in a list and in a row of filters. */
function Sampler(): ReactNode {
  return (
    <div className="flex flex-col gap-4 text-[13px] text-fg">
      <div className="flex flex-col">
        {rows.map(([kind, name, meta]) => (
          <span key={name} className="flex h-9 items-center gap-3 border-b border-border">
            <StatusMark kind={kind} />
            <span className="font-medium">{name}</span>
            <span className="ms-auto font-mono text-[12px] text-muted">{meta}</span>
          </span>
        ))}
      </div>
      {/* Inside a button, as in the filter row of a list of spaces. */}
      <div className="flex flex-wrap gap-2">
        {kinds.map(([kind, word]) => (
          <Button key={kind} variant="secondary" size="sm">
            <StatusMark kind={kind} />
            {word}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'StatusMark',
  states: {
    'Elke staat naast zijn woord': () => (
      <div className="flex flex-col text-[13px] text-fg">
        {kinds.map(([kind, word]) => (
          <span key={kind} className="flex h-7 items-center gap-2">
            <StatusMark kind={kind} />
            {word}
          </span>
        ))}
      </div>
    ),
    'In een lijst en een rij filters': () => <Sampler />,
    // The light palette on its own element: the glow there is 0.22 of the dark one.
    'Op Papier': () => (
      <div data-theme="light" className="rounded-lg bg-canvas p-4">
        <Sampler />
      </div>
    ),
    'Vier keer vergroot, om de tekening te beoordelen': () => (
      // Scaled by a wrapper rather than drawn larger: what shows here is what a list renders,
      // magnified, glow and all.
      <div className="flex flex-wrap gap-6">
        {kinds.map(([kind, word]) => (
          <div key={kind} className="flex size-16 items-center justify-center">
            <div className="scale-[4]">
              <StatusMark kind={kind} label={word} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
} satisfies Story
