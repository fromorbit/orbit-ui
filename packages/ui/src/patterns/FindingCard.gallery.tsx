import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { nl } from '../testing/labels'
import { FindingCard } from './FindingCard'

/** A screenshot of a checkout as a small drawing: the page, and the error the review saw on it. */
function Screenshot(): ReactNode {
  return (
    <div
      role="img"
      aria-label="Schermafbeelding: foutmelding op de kassa"
      className="flex h-24 w-36 flex-col gap-1.5 overflow-hidden rounded-md bg-canvas p-2"
    >
      <span className="h-1.5 w-12 rounded-full bg-border-strong" />
      <span className="h-1.5 w-20 rounded-full bg-surface-active" />
      <span className="flex flex-1 flex-col justify-center gap-1 rounded-sm bg-danger-subtle px-1.5">
        <span className="h-1 w-16 rounded-full bg-danger" />
        <span className="h-1 w-20 rounded-full bg-danger/50" />
      </span>
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'FindingCard',
  states: {
    'Blocking, with a screenshot': () => (
      <div className="w-full max-w-[640px]">
        <FindingCard
          severity="blocking"
          severityLabel={nl.severityWord.blocking}
          title="Betalen met iDEAL loopt vast"
          location="/kassa"
          media={<Screenshot />}
        >
          Na het kiezen van een bank blijft de kassa op ‘Bezig met betalen…’ staan en verschijnt na
          twintig seconden ‘Er ging iets mis’. POST /api/betalingen antwoordt met 500.
        </FindingCard>
      </div>
    ),
    'Every weight, heavy to light': () => (
      <div className="flex w-full max-w-[640px] flex-col gap-2">
        <FindingCard
          severity="blocking"
          severityLabel={nl.severityWord.blocking}
          title="Wachtwoord staat in de log"
          location="src/auth/login.ts:42"
        >
          Bij een mislukte login schrijft de server het ingevoerde wachtwoord naar de log.
        </FindingCard>
        <FindingCard
          severity="problem"
          severityLabel={nl.severityWord.problem}
          title="Bankkeuze heeft geen label"
          location="/kassa"
        >
          Het keuzemenu voor de bank heeft geen zichtbaar label; een schermlezer noemt het alleen
          ‘keuzelijst’.
        </FindingCard>
        <FindingCard
          severity="note"
          severityLabel={nl.severityWord.note}
          title="Spelling van iDEAL"
        >
          De knop zegt ‘Betaal met iDeal’; de merknaam is ‘iDEAL’, in hoofdletters.
        </FindingCard>
      </div>
    ),
    'With actions': () => (
      <div className="w-full max-w-[640px]">
        <FindingCard
          severity="problem"
          severityLabel={nl.severityWord.problem}
          title="Totaalbedrag is erg klein"
          location="/kassa"
          actions={
            <>
              <Button variant="secondary" size="xs">
                Bekijk in opname
              </Button>
              <Button variant="ghost" size="xs">
                Negeer
              </Button>
            </>
          }
        >
          Het totaal onder de bankkeuze staat in 10px; elders op de kassa is het 16px.
        </FindingCard>
      </div>
    ),
    'Narrow: the screenshot under the words': () => (
      <div className="w-full max-w-[340px]">
        <FindingCard
          severity="blocking"
          severityLabel={nl.severityWord.blocking}
          title="Betalen met iDEAL loopt vast"
          location="/kassa"
          media={<Screenshot />}
        >
          De kassa blijft op ‘Bezig met betalen…’ staan; de server antwoordt met 500.
        </FindingCard>
      </div>
    ),
  },
} satisfies Story
