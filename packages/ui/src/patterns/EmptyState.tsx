import type { ReactNode } from 'react'
import { Icon, type IconName } from '../primitives/Icon'

/** The props of `EmptyState`. */
export interface EmptyStateProps {
  /** Illustrates what is missing; decorative, like every `Icon`. */
  icon: IconName
  /** Already translated: a pattern never reaches into the catalogue itself. */
  title: string
  description?: string
  /** The one thing that fills the emptiness, e.g. a `Button` that starts a chat. */
  action?: ReactNode
  /**
   * Which element carries the title; `p` by default, for the reason below.
   *
   * `h1` is for the one caller whose empty state *is* the screen: the panel of a chat that has
   * not started, where the sentence is the only thing the panel is about and the document would
   * otherwise have no heading at all. Nothing about the drawing changes with it.
   */
  titleAs?: 'p' | 'h1'
}

/**
 * The place where something would be, saying what it is and what to do about it.
 *
 * Text, not a role: there is nothing here to announce or to wait for — an empty list is a fact of
 * the page, so it reads in document order like the rest of it. The title is a paragraph rather
 * than a heading by default for the same reason: an empty state turns up inside a sidebar, a panel
 * and a popover alike, and none of those can agree on a heading level. A caller whose empty state
 * fills the whole panel says so with `titleAs`.
 */
export function EmptyState({ icon, title, description, action, titleAs }: EmptyStateProps) {
  // Written out, not assembled: `Title` is the element React renders, and both branches keep the
  // same class string so the two forms are the same drawing.
  const Title = titleAs === 'h1' ? 'h1' : 'p'
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <span className="text-muted">
        <Icon name={icon} />
      </span>
      <Title className="m-0 text-[13px] font-medium text-fg">{title}</Title>
      {description ? <p className="m-0 max-w-64 text-[12px] text-muted">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
