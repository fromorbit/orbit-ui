import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { Icon } from '../primitives/Icon'
import { nl } from '../testing/labels'
import { FindingCard } from './FindingCard'

/**
 * A screenshot of a checkout as a small drawing: the page, and the error the review saw on it.
 * Beside the words it is a 144×96 thumbnail; under them, on a narrow card, it fills their column.
 */
function Screenshot(): ReactNode {
  return (
    <div
      role="img"
      aria-label="Schermafbeelding: foutmelding op de kassa"
      className="flex aspect-[3/2] w-full max-w-80 flex-col gap-1.5 overflow-hidden rounded-md bg-canvas p-2 @lg:aspect-auto @lg:h-24 @lg:w-36"
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
    'Blocking, with a screenshot': () => (
      <div className="w-full max-w-[640px]">
        <FindingCard
          severity="blocking"
          severityLabel={nl.severityWord.blocking}
          title="Betalen met iDEAL loopt vast"
          location="/kassa"
          locationLabel="pagina"
          media={<Screenshot />}
        >
          Na het kiezen van een bank blijft de kassa op ‘Bezig met betalen…’ staan en verschijnt na
          twintig seconden ‘Er ging iets mis’. POST /api/betalingen antwoordt met 500.
        </FindingCard>
      </div>
    ),
    'Every severity, heavy to light': () => (
      <div className="flex w-full max-w-[640px] flex-col gap-2">
        <FindingCard
          severity="blocking"
          severityLabel={nl.severityWord.blocking}
          title="Wachtwoord staat in de log"
          location="src/auth/login.ts:42"
          locationLabel="bestand"
        >
          Bij een mislukte login schrijft de server het ingevoerde wachtwoord naar de log.
        </FindingCard>
        <FindingCard
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
          title="Totaalbedrag is te klein om te lezen"
          location="/kassa"
          locationLabel="pagina"
          actions={
            <>
              <Button variant="secondary" size="sm">
                Bekijk in opname
              </Button>
              <Button variant="quiet" size="sm">
                <Icon name="eye-off" size="sm" />
                Negeer
              </Button>
            </>
          }
        >
          Het totaal onder de bankkeuze staat in 10 px; elders op de kassa is het 16 px.
        </FindingCard>
      </div>
    ),
    'Long words, a deep file and a long story': () => (
      <div className="w-full max-w-[640px]">
        <FindingCard
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
    'Narrow: the screenshot under the words': () => (
      <div className="w-full max-w-[340px]">
        <FindingCard
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
