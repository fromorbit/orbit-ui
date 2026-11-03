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
  /** The layout of the card in its parent: a grid span, a height. */
  className?: string
  children: ReactNode
}

/**
 * A card on the canvas with a heading: the plane a menu has (`bg-overlay`, a step lighter in dark,
 * white in light), so it reads as lying on the page. The demos' own layout, not a component.
 */
export function Panel({
  title,
  meta,
  actions,
  flush = false,
  className,
  children,
}: PanelProps): ReactNode {
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className={`flex min-w-0 flex-col rounded-xl border border-border bg-overlay ${className ?? ''}`}
    >
      <header className="flex min-h-11 items-center gap-2 px-4 pt-1">
        <h3 id={id} className="m-0 font-medium text-[13px] text-fg">
          {title}
        </h3>
        {meta === undefined ? null : <span className="text-[12px] text-muted">{meta}</span>}
        {actions === undefined ? null : (
          <div className="ml-auto flex items-center gap-1.5">{actions}</div>
        )}
      </header>
      <div className={flush ? 'min-h-0 flex-1' : 'min-h-0 flex-1 px-4 pb-4'}>{children}</div>
    </section>
  )
}
