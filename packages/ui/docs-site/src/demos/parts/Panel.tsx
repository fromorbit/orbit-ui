import { type ReactNode, useId } from 'react'

/** The props of {@link Panel}. */
export interface PanelProps {
  /** The heading of the card. */
  title: string
  /** A quiet note beside the heading: a count, a period. */
  meta?: ReactNode
  /** Controls at the right of the heading. */
  actions?: ReactNode
  /** No inner padding, for a list or a table that runs to the card's edges. */
  flush?: boolean
  /** The level of its heading in the outline of the page: 2 right under the page title (the default), 3 under a section. */
  headingLevel?: 2 | 3
  /** The layout of the card in its parent: a grid span, a height. */
  className?: string
  children: ReactNode
}

/**
 * A card on the canvas with a heading: the plane a menu has (`bg-overlay`, a step lighter in dark,
 * white in light), so it reads as lying on the page; its brightness is its edge, no frame. The demos' own layout, not a component.
 */
export function Panel({
  title,
  meta,
  actions,
  flush = false,
  headingLevel = 2,
  className,
  children,
}: PanelProps): ReactNode {
  const id = useId()
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <section
      aria-labelledby={id}
      className={`flex min-w-0 flex-col rounded-lg bg-overlay shadow-plane ${className ?? ''}`}
    >
      <header className="flex min-h-11 items-center gap-2 px-4 pt-1">
        {/* The title keeps one line; where the head is short of room, the note goes under it
            rather than breaking the title into a ragged column beside the actions. */}
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 py-1">
          <Heading id={id} className="m-0 whitespace-nowrap font-medium text-[13px] text-fg">
            {title}
          </Heading>
          {meta === undefined ? null : <span className="text-[12px] text-muted">{meta}</span>}
        </div>
        {actions === undefined ? null : (
          <div className="ml-auto flex items-center gap-1.5">{actions}</div>
        )}
      </header>
      <div className={flush ? 'min-h-0 flex-1' : 'min-h-0 flex-1 px-4 pb-4'}>{children}</div>
    </section>
  )
}
