import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { PlanCard, PlanCards } from './PlanCard'

const TEAM = [
  'Onbeperkt gesprekken en specs',
  '250 agent-uren per maand',
  'Orbit Review op 10 repositories',
  '50 GB opslag voor opnames',
]

/** The plan the workspace is on, alone: its tint and its tag mark it; no other plan in sight. */
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

/** The plan with what of it is used this month, each figure readable on its own. */
function WithUsage() {
  return (
    <div className="w-full max-w-sm">
      <PlanCard
        name="Team"
        price="€ 24"
        period="per lid per maand, excl. btw"
        features={[
          'Onbeperkt gesprekken en specs',
          { label: '250 agent-uren per maand', detail: '182 u gebruikt' },
          { label: 'Orbit Review op 10 repositories', detail: '7 gebruikt' },
          { label: '50 GB opslag voor opnames', detail: '18,4 GB gebruikt' },
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

/**
 * Three plans in `PlanCards`: the rows line up across the cards, the current one is tinted, the
 * plan that does not fit says why instead of offering a step that cannot work, and the one step
 * up names its target.
 */
function Compare() {
  return (
    <div className="w-full max-w-4xl">
      <PlanCards label="Plannen">
        <PlanCard
          name="Solo"
          price="€ 0"
          period="per maand"
          description="Voor jezelf, om Orbit te leren kennen."
          features={['1 lid', '20 agent-uren per maand', 'Orbit Review op 1 repository']}
          summary="Past niet bij 6 leden"
        />
        <PlanCard
          name="Team"
          price="€ 24"
          period="per lid per maand, excl. btw"
          description="Voor een team dat samen bouwt en reviewt."
          features={TEAM}
          current
          currentLabel="Huidig plan"
          summary="6 leden · € 174,24 per maand incl. btw"
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
          summary="6 leden · € 283,14 per maand incl. btw"
          action={
            <Button variant="secondary" size="sm">
              Naar Bedrijf
            </Button>
          }
        />
      </PlanCards>
    </div>
  )
}

/** A narrow column: the period wraps under the price, the action keeps the end of the foot. */
function Narrow() {
  return (
    <div className="w-full max-w-60">
      <PlanCard
        name="Bedrijf"
        price="€ 1.170"
        period="per maand voor 30 leden, excl. btw"
        features={['Inloggen met SSO', 'Een verwerkersovereenkomst op maat']}
        summary="€ 14.040 per jaar, excl. btw"
        action={
          <Button variant="secondary" size="sm">
            Naar Bedrijf
          </Button>
        }
      />
    </div>
  )
}

/** Plans among settings: on the tint of a `SettingsGroup`, the current one a step stronger. */
function OnSurface() {
  return (
    <div className="w-full max-w-2xl">
      <PlanCards label="Plannen">
        <PlanCard
          name="Team"
          price="€ 24"
          period="per lid per maand, excl. btw"
          features={TEAM}
          current
          currentLabel="Huidig plan"
          plane="surface"
          summary="6 leden · € 174,24 per maand incl. btw"
        />
        <PlanCard
          name="Bedrijf"
          price="€ 39"
          period="per lid per maand, excl. btw"
          features={['Alles van Team', '1.000 agent-uren per maand', 'Inloggen met SSO']}
          plane="surface"
          summary="6 leden · € 283,14 per maand incl. btw"
          action={
            <Button variant="secondary" size="sm">
              Naar Bedrijf
            </Button>
          }
        />
      </PlanCards>
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'PlanCard',
  states: {
    'Huidig plan': Current,
    'Met gebruik': WithUsage,
    'Plannen naast elkaar': Compare,
    'Tussen instellingen': OnSurface,
    Smal: Narrow,
  },
} satisfies Story
