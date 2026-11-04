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
   * The plan the workspace is on now, among other plans: the card is lifted to the plane of a card
   * with the accent's subtle tint over it, in either plane and theme, and its heading carries a tag,
   * so it reads "Team, Huidig plan". A plan that stands alone compares to nothing: leave it out.
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

/** The plane of a plan at rest: every alternative on one quiet surface. */
const REST: Record<PlanCardPlane, string> = {
  overlay: 'bg-overlay',
  surface: 'bg-surface',
}

/**
 * The plane of the current plan on either plane: the opaque plane of a card with the accent's
 * subtle tint laid over it as an image. A lift in both themes (white with a violet breath on Paper,
 * a lighter blue on Midnight), never the grey of a pressed card.
 */
const CURRENT = 'bg-overlay bg-linear-to-b from-accent-subtle to-accent-subtle'

/**
 * The quiet words of a card (the period, a figure, the summary): `muted` at rest; on the tint of
 * the current plan `secondary`, as `muted` falls under 4.5:1 there in dark.
 */
const quiet = (current: boolean) => (current ? 'text-secondary' : 'text-muted')

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
 * (Serial Position). The current plan is marked by the accent's subtle tint over the plane of a
 * card (Common Region) and by the tag in its heading, never by a frame or a filled button (Von
 * Restorff, one emphasis per view). The heading row is 28px with or without the tag, so names and
 * prices of plans side by side stand on one line. A feature can carry a figure at its end ("182 u gebruikt"), so the card can say what
 * of the plan is used without a second widget.
 *
 * The card fills its cell and pins the foot to the bottom. In `PlanCards` its three rows are the
 * rows of the list (`subgrid`), so the features of every plan start on one line and the feet line
 * up, whatever the descriptions hold. The foot has one rule per width of the card: from 22rem of
 * content the summary and the action share a row, narrower the summary stands on its own line and
 * the action under it at the end. Stacked, the summary keeps the top of the foot and the action
 * its bottom, so beside other plans the summaries share a line and so do the actions. The action grows to 40px under a
 * coarse pointer (Fitts).
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
      className={`grid h-full min-w-0 gap-6 rounded-lg p-4 forced-colors:border forced-colors:border-[CanvasText] ${rows} in-data-nt-plan-cards:row-span-3 in-data-nt-plan-cards:grid-rows-subgrid ${current ? CURRENT : REST[plane]}`}
    >
      <div className="flex flex-col gap-2">
        {/* 28px with or without the tag (the tag's own line is 16px), so the name and the price
            of the current plan stand on the line of the plans beside it. */}
        {/* Marked, the heading is named "Team, Huidig plan" as one string: a hidden comma between
            the flex items was read with a space before it. The visible words start the name. */}
        <Heading
          id={nameId}
          {...(marked ? { 'aria-label': `${name}, ${currentLabel}` } : {})}
          className="m-0 flex min-h-7 flex-wrap items-center gap-x-2 gap-y-1 font-heading text-[15px] text-fg leading-6"
        >
          <span>{name}</span>
          {marked ? (
            <span className="flex leading-4">
              <Tag tone="neutral" icon="check">
                {currentLabel}
              </Tag>
            </span>
          ) : null}
        </Heading>
        <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span className="whitespace-nowrap font-heading text-[20px] text-fg tabular-nums leading-7">
            {price}
          </span>
          {period === undefined ? null : (
            <span className={`text-[12px] ${quiet(current)}`}>{period}</span>
          )}
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
                  <span className={`shrink-0 text-[12px] tabular-nums ${quiet(current)}`}>
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
        // The foot measures its own width: a container on the card itself would contain its layout,
        // and a contained grid cannot be a subgrid.
        // Stacked, the summary keeps the top of the foot and the action its bottom, so beside other
        // plans both stand on one line whatever wraps.
        <div className="@container min-w-0">
          <div className="flex h-full flex-col items-end justify-between gap-2 @[22rem]:h-auto @[22rem]:min-h-(--nt-control-sm) @[22rem]:flex-row @[22rem]:items-center @[22rem]:gap-3">
            {summary === undefined ? null : (
              <p
                className={`m-0 min-w-0 self-stretch text-[12px] leading-5 @[22rem]:flex-1 @[22rem]:self-auto ${quiet(current)}`}
              >
                {summary}
              </p>
            )}
            {action === undefined ? null : (
              <span className="flex shrink-0 @[22rem]:ml-auto pointer-coarse:[&_button]:h-(--nt-control-lg)">
                {describedAction(action, nameId)}
              </span>
            )}
          </div>
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
