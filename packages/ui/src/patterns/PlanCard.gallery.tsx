import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { PlanCard, PlanCards } from './PlanCard'

const TEAM = [
  'Onbeperkt gesprekken en specs',
  '250 agent-uren per maand',
  'Orbit Review op 10 repositories',
  '50 GB opslag voor opnames',
]

/** Bedrijf as every story shows it: one feature list, one foot, only the layout differs. */
const BEDRIJF = {
  name: 'Bedrijf',
  price: '€ 39',
  period: 'per lid per maand, excl. btw',
  description: 'Voor meer teams, met inloggen via je eigen provider.',
  features: [
    'Alles van Team',
    '1.000 agent-uren per maand',
    'Orbit Review op elke repository',
    '250 GB opslag voor opnames',
    'Inloggen met SSO',
  ],
  summary: '6 leden · € 283,14 per maand incl. btw',
} as const

/** Team as the current plan: the fixed part of the month, without the hours above the plan. */
const TEAM_CURRENT = {
  name: 'Team',
  price: '€ 24',
  period: 'per lid per maand, excl. btw',
  description: 'Voor een team dat samen bouwt en reviewt.',
  features: TEAM,
  current: true,
  currentLabel: 'Huidig plan',
  summary: '6 leden · vast € 174,24 per maand incl. btw',
} as const

const toBedrijf = (
  <Button variant="secondary" size="sm">
    Naar Bedrijf
  </Button>
)

const changePlan = (
  <Button variant="secondary" size="sm">
    Plan wijzigen
  </Button>
)

/** The current plan: lifted by the accent's tint and its tag. */
function Current() {
  return (
    <div className="w-full max-w-sm">
      <PlanCard {...TEAM_CURRENT} action={changePlan} />
    </div>
  )
}

/**
 * A plan alone with what of it is used this month, as on Gebruik: no other plan to compare to, so
 * no tint and no tag; each figure is short enough to keep its line.
 */
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
          { label: 'Orbit Review op 10 repositories', detail: '7 in gebruik' },
          { label: '50 GB opslag voor opnames', detail: '18,4 GB' },
        ]}
        summary="6 leden · vast € 174,24 per maand incl. btw"
        action={changePlan}
      />
    </div>
  )
}

/**
 * Three plans in `PlanCards`: the rows line up across the cards, the current one is lifted, the
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
          features={[
            '1 lid',
            '20 agent-uren per maand',
            'Orbit Review op 1 repository',
            '5 GB opslag voor opnames',
          ]}
          summary="Past niet bij 6 leden"
        />
        <PlanCard {...TEAM_CURRENT} />
        <PlanCard {...BEDRIJF} action={toBedrijf} />
      </PlanCards>
    </div>
  )
}

/** A narrow column: the period wraps under the price, the action stands under the summary. */
function Narrow() {
  return (
    <div className="w-full max-w-60">
      <PlanCard {...BEDRIJF} action={toBedrijf} />
    </div>
  )
}

/** A long name and a large price beside the tag: the heading wraps, the tag goes under the name. */
function LongName() {
  return (
    <div className="w-full max-w-60">
      <PlanCard
        name="Onderneming Plus"
        price="€ 12.480"
        period="per jaar, excl. btw"
        features={['Alles van Bedrijf', 'Een eigen omgeving in de EU', 'Een vaste contactpersoon']}
        current
        currentLabel="Huidig plan"
        summary="40 leden · vast € 15.100,80 per jaar incl. btw"
        action={changePlan}
      />
    </div>
  )
}

/** Plans among settings: on the tint of a `SettingsGroup`, the current one lifted. */
function OnSurface() {
  return (
    <div className="w-full max-w-2xl">
      <PlanCards label="Plannen">
        <PlanCard {...TEAM_CURRENT} plane="surface" action={changePlan} />
        <PlanCard {...BEDRIJF} plane="surface" action={toBedrijf} />
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
    'In de instellingen': OnSurface,
    Smal: Narrow,
    'Lange naam': LongName,
  },
} satisfies Story
