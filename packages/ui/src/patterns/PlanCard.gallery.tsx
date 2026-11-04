import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { PlanCard } from './PlanCard'

const TEAM = [
  'Onbeperkt gesprekken en specs',
  '250 agent-uren per maand',
  'Orbit Review op 10 repositories',
  '50 GB opslag voor opnames',
]

/** The plan the workspace is on, alone: what a settings page shows. */
function Current() {
  return (
    <div className="w-full max-w-sm">
      <PlanCard
        name="Team"
        price="€ 24"
        period="per lid per maand, excl. btw"
        features={TEAM}
        current
        currentLabel="Huidig plan"
        summary="6 leden · € 174,24 per maand incl. btw"
        action={
          <Button variant="secondary" size="sm">
            Plan wijzigen
          </Button>
        }
      />
    </div>
  )
}

/** The plan with what of it is used this month, at the end of each line that counts. */
function WithUsage() {
  return (
    <div className="w-full max-w-sm">
      <PlanCard
        name="Team"
        price="€ 24"
        period="per lid per maand, excl. btw"
        features={[
          'Onbeperkt gesprekken en specs',
          { label: '250 agent-uren per maand', detail: '182 gebruikt' },
          { label: 'Orbit Review op 10 repositories', detail: '7 in gebruik' },
          { label: '50 GB opslag voor opnames', detail: '18,4 GB' },
        ]}
        current
        currentLabel="Huidig plan"
        summary="6 leden · € 174,24 per maand incl. btw"
        action={
          <Button variant="secondary" size="sm">
            Plan wijzigen
          </Button>
        }
      />
    </div>
  )
}

/** Three plans side by side, the current one marked; the feet line up whatever the lists hold. */
function Compare() {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-3 md:grid-cols-3">
      <PlanCard
        name="Solo"
        price="€ 0"
        period="per maand"
        description="Voor jezelf, om Orbit te leren kennen."
        features={['1 lid', '20 agent-uren per maand', 'Orbit Review op 1 repository']}
        action={
          <Button variant="secondary" size="sm">
            Overstappen
          </Button>
        }
      />
      <PlanCard
        name="Team"
        price="€ 24"
        period="per lid per maand, excl. btw"
        description="Voor een team dat samen bouwt en reviewt."
        features={TEAM}
        current
        currentLabel="Huidig plan"
        summary="6 leden"
      />
      <PlanCard
        name="Bedrijf"
        price="€ 39"
        period="per lid per maand, excl. btw"
        description="Voor meer teams, met inloggen via je eigen provider."
        features={[
          'Alles van Team',
          '1.000 agent-uren per maand',
          'Orbit Review op elke repository',
          '250 GB opslag voor opnames',
          'Inloggen met SSO',
        ]}
        action={
          <Button variant="secondary" size="sm">
            Overstappen
          </Button>
        }
      />
    </div>
  )
}

/** A narrow column: the period wraps under the price and the foot under the summary. */
function Narrow() {
  return (
    <div className="w-full max-w-60">
      <PlanCard
        name="Bedrijf"
        price="€ 1.170"
        period="per maand voor 30 leden, excl. btw"
        features={['Inloggen met SSO', 'Een verwerkersovereenkomst op maat']}
        summary="Jaarlijks gefactureerd"
        action={
          <Button variant="secondary" size="sm">
            Overstappen
          </Button>
        }
      />
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'PlanCard',
  states: {
    Current,
    'With usage': WithUsage,
    'Plans side by side': Compare,
    Narrow,
  },
} satisfies Story
