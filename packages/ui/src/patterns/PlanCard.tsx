import { type ReactNode, useId } from 'react'
import { Icon } from '../primitives/Icon'
import { Tag } from '../primitives/Tag'

/** One line of what a plan holds, with what of it is used when the card shows that. */
export interface PlanFeature {
  /** What the plan holds: "250 agent-uren per maand". */
  label: string
  /** A quiet figure at the end of the line, already formatted: "182 gebruikt". */
  detail?: string
}

/** The props of `PlanCard`. */
export interface PlanCardProps {
  /** The name of the plan: "Team". Also the card's accessible name. */
  name: string
  /** The price, already formatted in the reader's locale: "€ 24". */
  price: string
  /** What the price is for, beside it: "per lid per maand, excl. btw". */
  period?: string
  /** One sentence under the price on who the plan is for. */
  description?: string
  /** What the plan holds, one line each, each after a check. */
  features?: readonly (string | PlanFeature)[]
  /** The plan the workspace is on now: marked once, by a tag beside the name. */
  current?: boolean
  /** The words of that tag: "Huidig plan". Required to mark the current plan. */
  currentLabel?: string
  /** The level of the name in the outline of the page; 3 under a section heading by default. */
  headingLevel?: 2 | 3 | 4
  /** Anything between the features and the foot: a meter, a note. */
  children?: ReactNode
  /** A quiet line at the start of the foot: "6 leden · € 174,24 per maand incl. btw". */
  summary?: ReactNode
  /**
   * One button at the end of the foot ("Plan wijzigen", "Overstappen"), as a `size="sm"` secondary
   * `Button`; a row of plans has no filled button, so the page keeps its one emphasis.
   */
  action?: ReactNode
}

/** A feature as an object, so a plain string and a line with a figure read the same. */
function featureOf(feature: string | PlanFeature): PlanFeature {
  return typeof feature === 'string' ? { label: feature } : feature
}

/**
 * A plan of a subscription as a card: its name, its price and what that is for, what it holds, and
 * one action at the foot; the plan the workspace is on is marked.
 *
 * An `<article>` named by the plan, on the plane of a card (`bg-overlay`, 12px, no frame), so plans
 * side by side read as regions by their tint and a screen reader can jump from plan to plan. Four
 * groups 24px apart — the name and the price, the features, what the caller adds, the foot — with
 * the lines of a group 8px apart (Proximity). The name is the 15px/600 of a card, the price the
 * 20px of a figure with tabular digits, its period a muted 12px beside it, so the eye goes name,
 * price, what you get (Serial Position). The current plan is marked once, by a tag beside its name,
 * never by a frame or a fill: in a row of plans only the words "Huidig plan" differ (Von Restorff,
 * one emphasis per view). A feature can carry a figure at its end ("182 gebruikt"), so the card can
 * say what of the plan is used without a second widget. The card fills the height of its cell and
 * pins the foot, at least as high as its button, to the bottom, so a row of plans lines up its
 * summaries and actions whether a plan has a button or not (Common Region); while the
 * card is narrow the summary and the action wrap rather than squeeze.
 */
export function PlanCard({
  name,
  price,
  period,
  description,
  features = [],
  current = false,
  currentLabel,
  headingLevel = 3,
  children,
  summary,
  action,
}: PlanCardProps) {
  const nameId = useId()
  const Heading = headingLevel === 2 ? 'h2' : headingLevel === 4 ? 'h4' : 'h3'
  const marked = current && currentLabel !== undefined
  return (
    <article
      aria-labelledby={nameId}
      data-nt-plan-card
      {...(current ? { 'data-current': '' } : {})}
      className="flex h-full min-w-0 flex-col gap-6 rounded-lg bg-overlay p-4"
    >
      <div className="flex flex-col gap-2">
        <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1">
          <Heading id={nameId} className="m-0 font-heading text-[15px] text-fg leading-6">
            {name}
          </Heading>
          {marked ? (
            <Tag tone="neutral" icon="check">
              {currentLabel}
            </Tag>
          ) : null}
        </div>
        <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span className="whitespace-nowrap font-heading text-[20px] text-fg tabular-nums leading-7">
            {price}
          </span>
          {period === undefined ? null : <span className="text-[12px] text-muted">{period}</span>}
        </p>
        {description === undefined ? null : (
          <p className="m-0 text-[12px] text-secondary leading-5">{description}</p>
        )}
      </div>
      {features.length === 0 ? null : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13px] leading-5">
          {features.map(featureOf).map(({ label, detail }) => (
            <li key={label} className="flex min-w-0 items-start gap-2">
              <span className="flex h-5 shrink-0 items-center text-muted">
                <Icon name="check" size="sm" />
              </span>
              <span className="min-w-0 flex-1 text-secondary">{label}</span>
              {detail === undefined ? null : (
                <span className="shrink-0 text-[12px] text-muted tabular-nums">{detail}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {children}
      {summary === undefined && action === undefined ? null : (
        <div className="mt-auto flex min-h-(--nt-control-sm) flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {summary === undefined ? (
            <span />
          ) : (
            <p className="m-0 min-w-0 text-[12px] text-muted">{summary}</p>
          )}
          {action}
        </div>
      )}
    </article>
  )
}
