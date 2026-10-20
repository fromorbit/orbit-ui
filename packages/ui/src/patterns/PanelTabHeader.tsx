import type { ReactNode } from 'react'

/** The props of `PanelTabHeader`. */
export interface PanelTabHeaderProps {
  /**
   * What the tab is about right now: a word, or a control that names it — the scope pill of
   * Wijzigingen, the filter of Bestanden, the address bar of a browser tab. It takes the room the
   * actions leave; a plain string is cut with an ellipsis rather than wrapped.
   */
  title?: ReactNode
  /** Controls at the far end of the strip, on the gutter line of the panel's right edge. */
  actions?: ReactNode
}

/**
 * The head of every tab in the right panel: a 40px strip with a rule, 12px inset, title and actions.
 *
 * Before it, every tab had a head of its own: the first content at 75, 83, 94 or 81px,
 * and Subagents and Terminal without one, so the panel jumped whenever the reader switched tabs.
 * One strip makes them one: the same height whether it holds a pill, a field or nothing, the same
 * rule under it, and the same 12px inset as the rows below — so switching moves nothing but the
 * words. `box-border`: the rule is inside the 40px, so what follows starts at exactly 40px; `pt-px`
 * leaves 38px above the rule, so a control of 28px or 24px is centred on a whole pixel.
 *
 * `data-nt-panel-tab-header` is what the end-to-end check names it by.
 */
export function PanelTabHeader({ title, actions }: PanelTabHeaderProps): ReactNode {
  return (
    <div
      data-nt-panel-tab-header
      className="box-border flex h-10 shrink-0 items-center gap-2 border-border border-b px-3 pt-px"
    >
      <div
        data-nt-panel-tab-title
        className="flex min-w-0 flex-1 items-center gap-2 text-[13px] text-fg"
      >
        {typeof title === 'string' ? <span className="min-w-0 truncate">{title}</span> : title}
      </div>
      {actions === undefined || actions === null ? null : (
        <div data-nt-panel-tab-actions className="ms-auto flex shrink-0 items-center gap-1">
          {actions}
        </div>
      )}
    </div>
  )
}
