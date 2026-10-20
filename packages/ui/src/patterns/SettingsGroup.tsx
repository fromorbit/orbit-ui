import { Children, type ReactNode, useId } from 'react'
import { SectionHeading } from '../primitives/SectionHeading'

/** The props of `SettingsGroup`. */
export interface SettingsGroupProps {
  /** The group's heading, in the style of a `ListGroup` heading; left out, a bare card. */
  title?: string
  /** One action in the heading, on the right, such as a `Button sm` "Toevoegen…". */
  action?: ReactNode
  /** The rows, usually `SettingRow`s; a line is drawn between them. */
  children: ReactNode
}

/**
 * A group of settings rows: a quiet heading with an optional action beside it, and the rows in one
 * card with a line between each.
 *
 * The heading is `SectionHeading` at level 2 — the heading of every group of rows in the app, not
 * a copy of its classes — and carries no sentence under it. The card is the frame the screen already had — `rounded-lg`,
 * a border, `surface`. A group without rows draws no empty card, so "no extensions yet" is just
 * the heading with its action. The space between groups belongs to the screen
 * that stacks them.
 *
 * A row may also draw nothing once it renders — a `custom` control with nothing to show, such as
 * Backend where there is no WSL — which React cannot tell before. CSS can: a card whose children are
 * all empty is not drawn, and a group without an action goes with it, heading and all. The line between rows is drawn between two that draw something, so an empty one in between
 * or at the end leaves no stray line either. Layout, so an end-to-end test of the host measures it.
 */
export function SettingsGroup({ title, action, children }: SettingsGroupProps) {
  const titleId = useId()
  const hasRows = Children.toArray(children).length > 0
  const card = hasRows ? (
    <div
      data-nt-settings-card
      className="rounded-lg border border-border bg-surface [&:not(:has(>:not(:empty)))]:hidden [&>:not(:empty)~:not(:empty)]:border-t [&>:not(:empty)~:not(:empty)]:border-border"
    >
      {children}
    </div>
  ) : null
  // Rows that all draw nothing take the group with them, unless an action keeps its heading.
  const vanishes =
    hasRows && action === undefined
      ? '[&:not(:has(>[data-nt-settings-card]>:not(:empty)))]:hidden'
      : ''

  if (title === undefined) {
    return (
      <div data-nt-settings-group className={`flex flex-col gap-2 ${vanishes}`.trim()}>
        {action === undefined ? null : <div className="flex justify-end">{action}</div>}
        {card}
      </div>
    )
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset is for one form control's parts; this is a named group of rows, and a named section would be a landmark.
    <div
      data-nt-settings-group
      role="group"
      aria-labelledby={titleId}
      className={`flex flex-col gap-2 ${vanishes}`.trim()}
    >
      <div className="flex min-h-7 items-center justify-between gap-2">
        <SectionHeading level={2} id={titleId}>
          {title}
        </SectionHeading>
        {action}
      </div>
      {card}
    </div>
  )
}
