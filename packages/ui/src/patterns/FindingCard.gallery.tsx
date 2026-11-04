import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { Icon } from '../primitives/Icon'
import { nl } from '../testing/labels'
import { FindingCard } from './FindingCard'

/**
 * A screenshot of a checkout as a small drawing: the page, and the error the review saw on it.
 * A 144×96 thumbnail, beside the words on a wide card and under them, at the same size, on a narrow
 * one.
 */
function Screenshot(): ReactNode {
  return (
    <div
      role="img"
      aria-label="Schermafbeelding: foutmelding op de kassa"
      className="flex h-24 w-36 flex-col gap-1.5 overflow-hidden rounded-md bg-canvas p-2"
    >
      <span className="h-1.5 w-12 rounded-full bg-border-strong" />
      <span className="h-1.5 w-20 rounded-full bg-surface-active" />
      <span className="flex flex-1 flex-col justify-center gap-1 rounded-sm bg-danger/12 px-1.5">
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
    'Blokkerend, met een schermafbeelding': () => (
      <div className="w-full max-w-[640px]">
        <FindingCard
          headingLevel={2}
          severity="blocking"
          severityLabel={nl.severityWord.blocking}
          title="Betalen met iDEAL loopt vast"
          location="/kassa"
          locationLabel="pagina"
          media={<Screenshot />}
        >
          Na het kiezen van een bank blijft de kassa op ‘Bezig met betalen…’ staan en verschijnt na
          twintig seconden ‘Er ging iets mis’. POST&nbsp;/api/betalingen antwoordt met 500.
        </FindingCard>
      </div>
    ),
    'Elke ernst, van zwaar naar licht': () => (
      <div className="flex w-full max-w-[640px] flex-col gap-2">
        <FindingCard
          headingLevel={2}
          severity="blocking"
          severityLabel={nl.severityWord.blocking}
          title="Wachtwoord staat in de log"
          location="src/auth/login.ts:42"
          locationLabel="bestand"
        >
          Bij een mislukte login schrijft de server het ingevoerde wachtwoord naar de log.
        </FindingCard>
        <FindingCard
          headingLevel={2}
          severity="problem"
          severityLabel={nl.severityWord.problem}
          title="Bankkeuze heeft geen label"
          location="/kassa"
          locationLabel="pagina"
        >
          Het keuzemenu voor de bank heeft geen zichtbaar label; een schermlezer noemt het alleen
          ‘keuzelijst’.
        </FindingCard>
        <FindingCard
          headingLevel={2}
          severity="note"
          severityLabel={nl.severityWord.note}
          title="Spelling van iDEAL"
          location="src/kassa/BetaalKnop.tsx:12"
          locationLabel="bestand"
        >
          De knop zegt ‘Betaal met iDeal’; de merknaam is ‘iDEAL’, in hoofdletters.
        </FindingCard>
      </div>
    ),
    'Met acties': () => (
      <div className="w-full max-w-[640px]">
        <FindingCard
          headingLevel={2}
          severity="problem"
          severityLabel={nl.severityWord.problem}
          title="Totaalbedrag is te klein om te lezen"
          location="/kassa"
          locationLabel="pagina"
          actions={
            // Quiet, the one style of a card's actions, pulled out by the button's own padding so
            // its words line up with the text; each named by the finding as well.
            <span className="-ms-2.5 flex flex-wrap gap-1">
              <Button
                variant="quiet"
                size="sm"
                aria-label="In opname bekijken: Totaalbedrag is te klein om te lezen"
              >
                In opname bekijken
              </Button>
              <Button
                variant="quiet"
                size="sm"
                aria-label="Negeren voor deze review: Totaalbedrag is te klein om te lezen"
              >
                <Icon name="eye-off" size="sm" />
                Negeren voor deze review
              </Button>
            </span>
          }
        >
          Het totaal onder de bankkeuze staat in 10&nbsp;px; elders op de kassa is het 16&nbsp;px.
        </FindingCard>
      </div>
    ),
    'Lange woorden, een diep bestand en een lang verhaal': () => (
      <div className="w-full max-w-[640px]">
        <FindingCard
          headingLevel={2}
          severity="blocking"
          severityLabel={nl.severityWord.blocking}
          title="Ontwikkelomgevingsconfiguratiebestandsvalidatiefoutmelding verschijnt bij elke start van de server"
          location="packages/server/src/authentication/providers/openid-connect/tokenvernieuwing.ts:1287"
          locationLabel="bestand"
        >
          Bij het vernieuwen van een verlopen token leest de server het configuratiebestand opnieuw
          en meldt dan een validatiefout, ook als het bestand niet veranderd is. De melding staat
          bovenaan elke pagina tot de volgende herstart, en een gebruiker die net is ingelogd wordt
          na vijftien minuten zonder waarschuwing uitgelogd. In de log staat
          ‘Configuratievalidatieuitzondering: onbekendeinstellingsnaam’ zonder de naam van de
          instelling die niet klopt.
        </FindingCard>
      </div>
    ),
    'Smal: de schermafbeelding onder de tekst': () => (
      <div className="w-full max-w-[340px]">
        <FindingCard
          headingLevel={2}
          severity="blocking"
          severityLabel={nl.severityWord.blocking}
          title="Betalen met iDEAL loopt vast"
          location="/kassa"
          locationLabel="pagina"
          media={<Screenshot />}
        >
          De kassa blijft op ‘Bezig met betalen…’ staan; de server antwoordt met 500.
        </FindingCard>
      </div>
    ),
  },
} satisfies Story
