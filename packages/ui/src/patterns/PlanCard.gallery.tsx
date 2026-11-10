import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { StatusMark } from '../primitives/StatusMark'
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
  summary: '6 leden · € 174,24 per maand incl. btw',
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

/** The current plan: lifted by the tint of a lit row and marked by its tag. */
function Current() {
  return (
    <div className="w-full max-w-sm">
      <PlanCard {...TEAM_CURRENT} action={changePlan} />
    </div>
  )
}

/**
 * A plan alone with what of it is used this month, as on Gebruik: no other plan to compare to, so
 * no lift and no tag. Each figure says its limit and a 4px meter shows how far it is; the hours
 * head past the plan, so that line takes the tone of attention as on Gebruik, and the foot gives
 * the amount to expect, not the fixed part.
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
          {
            label: '250 agent-uren per maand',
            detail: '182 van 250 u',
            used: { value: 182, max: 250 },
            over: 'Verwacht ≈\u00a0282 u eind oktober',
          },
          {
            label: 'Orbit Review op 10 repositories',
            detail: '7 van 10',
            used: { value: 7, max: 10 },
          },
          {
            label: '50 GB opslag voor opnames',
            detail: '18,4 van 50 GB',
            used: { value: 18.4, max: 50 },
          },
        ]}
        summary="6 leden · verwacht ≈ € 205,22 incl. btw"
        action={changePlan}
      />
    </div>
  )
}

/**
 * The month heads past the plan: the one line that matters takes the tone of attention and says
 * where it ends, the others stay quiet (Von Restorff).
 */
function OverLimit() {
  return (
    <div className="w-full max-w-sm">
      <PlanCard
        name="Team"
        price="€ 24"
        period="per lid per maand, excl. btw"
        features={[
          'Onbeperkt gesprekken en specs',
          {
            label: '250 agent-uren per maand',
            detail: '263 van 250 u',
            used: { value: 263, max: 250 },
            over: '13 u boven je plan, ≈ € 10,40 extra',
          },
          {
            label: 'Orbit Review op 10 repositories',
            detail: '7 van 10',
            used: { value: 7, max: 10 },
          },
          {
            label: '50 GB opslag voor opnames',
            detail: '18,4 van 50 GB',
            used: { value: 18.4, max: 50 },
          },
        ]}
        summary="6 leden · verwacht ≈ € 186,82 incl. btw"
        action={changePlan}
      />
    </div>
  )
}

/** The plan one step up, alone: no tint, no tag, one action that names its target. */
function Target() {
  return (
    <div className="w-full max-w-sm">
      <PlanCard {...BEDRIJF} action={toBedrijf} />
    </div>
  )
}

/**
 * Two plans side by side, as in the settings: the current one lifted and tagged with no button,
 * the other with the one step, so the decision has one button (Hick, one emphasis per row).
 */
function TwoUp() {
  return (
    <div className="w-full max-w-2xl">
      <PlanCards label="Plannen">
        <PlanCard {...TEAM_CURRENT} />
        <PlanCard {...BEDRIJF} action={toBedrijf} />
      </PlanCards>
    </div>
  )
}

/**
 * Many lines, a long one beside a figure, and a long name: the figure drops under its label when
 * the line has no room, the name wraps before the tag.
 */
function ManyFeatures() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] items-start gap-6">
      <PlanCard
        name="Onderneming met eigen omgeving"
        price="€ 1.040"
        period="per maand, excl. btw"
        description="Voor organisaties met eigen eisen aan opslag en toegang."
        features={[
          'Alles van Bedrijf',
          {
            label: '4.000 agent-uren per maand, gedeeld over alle teams',
            detail: '1.912 van 4.000 u',
            used: { value: 1912, max: 4000 },
          },
          'Orbit Review op elke repository',
          '2 TB opslag voor opnames',
          'Inloggen met SSO en SCIM',
          'Een eigen omgeving in de EU',
          'Auditlog van 2 jaar',
          'Een vaste contactpersoon',
          'Reactie binnen 4 uur op werkdagen',
        ]}
        summary="40 leden · € 1.258,40 per maand incl. btw"
        action={changePlan}
      />
      <div className="max-w-60">
        <PlanCard
          name="Team"
          price="€ 24"
          period="per lid per maand, excl. btw"
          features={[
            {
              label: '250 agent-uren per maand',
              detail: '182 van 250 agent-uren gebruikt',
              used: { value: 182, max: 250 },
              over: 'Verwacht ≈\u00a0282 u eind oktober',
            },
            'Orbit Review op 10 repositories',
          ]}
          summary="6 leden · verwacht ≈ € 205,22 incl. btw"
          action={changePlan}
        />
      </div>
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
          summary={
            // A reason, not a price: a quiet stopped mark before the words.
            <span className="inline-flex items-center gap-1.5">
              <StatusMark kind="stopped" size="sm" />
              Past niet bij 6 leden
            </span>
          }
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
        summary="40 leden · € 15.100,80 per jaar incl. btw"
        action={changePlan}
      />
    </div>
  )
}

/** Plans among settings: on the quiet tint of `surface`, the current one lifted, without a button. */
function OnSurface() {
  return (
    <div className="w-full max-w-2xl">
      <PlanCards label="Plannen">
        <PlanCard {...TEAM_CURRENT} plane="surface" />
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
    'Boven het plan': OverLimit,
    'Een ander plan': Target,
    'Twee plannen': TwoUp,
    'Plannen naast elkaar': Compare,
    'In de instellingen': OnSurface,
    Smal: Narrow,
    'Lange naam': LongName,
    'Veel onderdelen': ManyFeatures,
  },
} satisfies Story
