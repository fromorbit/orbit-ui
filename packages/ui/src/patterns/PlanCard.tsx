import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
} from 'react'
import { Icon } from '../primitives/Icon'
import { Tag } from '../primitives/Tag'

/** One line of what a plan holds, with what of it is used when the card shows that. */
export interface PlanFeature {
  /** What the plan holds: "250 agent-uren per maand". */
  label: string
  /**
   * A quiet figure at the end of the line, already formatted and readable on its own:
   * "182 u gebruikt", "18,4 GB gebruikt". A screen reader hears it after a comma.
   */
  detail?: string
}

/**
 * The plane a plan lies on: `overlay`, the plane of a card on the canvas (the default), or
 * `surface`, the tint of a `SettingsGroup`, for plans among settings, so one column speaks one
 * region language.
 */
export type PlanCardPlane = 'overlay' | 'surface'

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
  /**
   * The plan the workspace is on now: a stronger tint of its plane, and a tag in its heading, so
   * the heading reads "Team, Huidig plan".
   */
  current?: boolean
  /** The words of that tag: "Huidig plan". Required to mark the current plan. */
  currentLabel?: string
  /** The level of the name in the outline of the page; 3 under a section heading by default. */
  headingLevel?: 2 | 3 | 4
  /** The plane the card lies on; `overlay` by default. */
  plane?: PlanCardPlane
  /** Anything between the features and the foot: a meter, a note. */
  children?: ReactNode
  /** A quiet line at the start of the foot: "6 leden · € 174,24 per maand incl. btw". */
  summary?: ReactNode
  /**
   * One button at the end of the foot, as a `size="sm"` secondary `Button` that names its target
   * ("Naar Bedrijf"), or "Plan wijzigen" where no other plan is shown. A row of plans has no
   * filled button, so the page keeps its one emphasis. The card describes it by the plan's name
   * (`aria-describedby`, unless the button brings its own), so actions in a row are told apart.
   */
  action?: ReactNode
}

/** A feature as an object, so a plain string and a line with a figure read the same. */
function featureOf(feature: string | PlanFeature): PlanFeature {
  return typeof feature === 'string' ? { label: feature } : feature
}

/** The tint of a card per plane, and the stronger one of the current plan. */
const PLANE: Record<PlanCardPlane, { rest: string; current: string }> = {
  // The opaque plane of a card, with the active tint laid over it as an image.
  overlay: {
    rest: 'bg-overlay',
    current: 'bg-overlay bg-linear-to-b from-surface-hover to-surface-hover',
  },
  surface: { rest: 'bg-surface', current: 'bg-surface-active' },
}

/** The action with the plan's name as its description, unless it brings one of its own. */
function describedAction(action: ReactNode, nameId: string): ReactNode {
  if (!isValidElement(action)) return action
  const element = action as ReactElement<{ 'aria-describedby'?: string }>
  if (element.props['aria-describedby'] !== undefined) return action
  return cloneElement(element, { 'aria-describedby': nameId })
}

/**
 * A plan of a subscription as a card: its name, its price and what that is for, what it holds, and
 * one action at the foot; the plan the workspace is on is marked.
 *
 * An `<article>` named by the plan, on the plane of a card (`bg-overlay`, 12px, no frame) or, among
 * settings, on the tint of a `SettingsGroup` (`plane="surface"`), so plans read as regions by their
 * tint and a screen reader can jump from plan to plan. Three rows 24px apart — the name, the price
 * and who it is for; the features with what the caller adds; the foot — with the lines of a row
 * 8px apart (Proximity). The name is the 15px/600 of a card, the price the 20px of a figure with
 * tabular digits, its period a muted 12px beside it, so the eye goes name, price, what you get
 * (Serial Position). The current plan is marked by a stronger tint of its plane (Common Region)
 * and by the tag in its heading, never by a frame or a filled button (Von Restorff, one emphasis
 * per view). A feature can carry a figure at its end ("182 u gebruikt"), so the card can say what
 * of the plan is used without a second widget.
 *
 * The card fills its cell and pins the foot to the bottom. In `PlanCards` its three rows are the
 * rows of the list (`subgrid`), so the features of every plan start on one line and the feet line
 * up, whatever the descriptions hold. The action stays at the end of the foot at every width, also
 * once it wraps under the summary, and grows to 40px under a coarse pointer (Fitts).
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
  plane = 'overlay',
  children,
  summary,
  action,
}: PlanCardProps) {
  const nameId = useId()
  const Heading = headingLevel === 2 ? 'h2' : headingLevel === 4 ? 'h4' : 'h3'
  const marked = current && currentLabel !== undefined
  const hasFoot = summary !== undefined || action !== undefined
  const rows = hasFoot ? 'grid-rows-[auto_1fr_auto]' : 'grid-rows-[auto_1fr]'
  return (
    <article
      aria-labelledby={nameId}
      data-nt-plan-card
      {...(current ? { 'data-current': '' } : {})}
      className={`grid h-full min-w-0 gap-6 rounded-lg p-4 forced-colors:border forced-colors:border-[CanvasText] ${rows} in-data-nt-plan-cards:row-span-3 in-data-nt-plan-cards:grid-rows-subgrid ${current ? PLANE[plane].current : PLANE[plane].rest}`}
    >
      <div className="flex flex-col gap-2">
        <Heading
          id={nameId}
          className="m-0 flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 font-heading text-[15px] text-fg leading-6"
        >
          {name}
          {marked ? (
            <>
              <span className="sr-only">, </span>
              <Tag tone="neutral" icon="check">
                {currentLabel}
              </Tag>
            </>
          ) : null}
        </Heading>
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
      <div className="flex min-w-0 flex-col gap-6">
        {features.length === 0 ? null : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13px] leading-5">
            {features.map(featureOf).map(({ label, detail }) => (
              <li key={label} className="flex min-w-0 items-start gap-2">
                <span className="flex h-5 shrink-0 items-center text-muted">
                  <Icon name="check" size="sm" />
                </span>
                <span className="min-w-0 flex-1 text-secondary">{label}</span>
                {detail === undefined ? null : (
                  <span className="shrink-0 text-[12px] text-muted tabular-nums">
                    <span className="sr-only">, </span>
                    {detail}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {children}
      </div>
      {hasFoot ? (
        <div className="flex min-h-(--nt-control-sm) flex-wrap items-center gap-x-3 gap-y-2 self-end">
          {summary === undefined ? null : (
            <p className="m-0 min-w-0 text-[12px] text-muted">{summary}</p>
          )}
          {action === undefined ? null : (
            <span className="ml-auto flex pointer-coarse:[&_button]:h-(--nt-control-lg)">
              {describedAction(action, nameId)}
            </span>
          )}
        </div>
      ) : null}
    </article>
  )
}

/** The props of `PlanCards`. */
export interface PlanCardsProps {
  /** The name of the list for a screen reader: "Plannen". */
  label: string
  /** The `PlanCard`s, two to four. */
  children: ReactNode
}

/**
 * Plans side by side: a list of `PlanCard`s whose rows line up across the cards (`subgrid`), so the
 * features of every plan start on one line and the feet stand on one line, whatever the
 * descriptions hold (Similarity, Common Region). The columns follow the width of the list itself,
 * not the window: as many as fit at 15rem or more, so a card is never narrower than 240px, else
 * the plans stack. Plans are regions of their own, 24px apart (`--nt-space-group`).
 */
export function PlanCards({ label, children }: PlanCardsProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a grid of cards; a ul would bring its own margins and bullets to undo.
    <div
      role="list"
      aria-label={label}
      data-nt-plan-cards
      className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-6"
    >
      {Children.map(children, (child) => (
        // biome-ignore lint/a11y/useSemanticElements: the item of the list above.
        <div role="listitem" className="row-span-3 grid min-w-0 grid-rows-subgrid">
          {child}
        </div>
      ))}
    </div>
  )
}
