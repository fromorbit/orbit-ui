import type { ComponentPropsWithRef, ReactNode } from 'react'

/** The props of `QuickActions`. */
export interface QuickActionsProps {
  /** The name of the group, already translated ("Voorstellen van Orb"). */
  label: string
  /** The actions: a few `QuickAction`s, three at most under a bubble. */
  children: ReactNode
}

/**
 * A row of suggested next steps under a bubble: "Open run 1284", "Start een chat". The chips wrap
 * onto a second line rather than scroll, 6px apart; a `group` named by `label`, so a screen reader
 * hears whose suggestions these are.
 */
export function QuickActions({ label, children }: QuickActionsProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset is for form controls, these are actions.
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {children}
    </div>
  )
}

/** The props of `QuickAction`. */
export interface QuickActionProps
  extends Omit<ComponentPropsWithRef<'button'>, 'className' | 'style' | 'children'> {
  /** What the action does, in a few words: its visible text and its name. */
  children: string
}

/**
 * One suggested step: a framed pill on the small control height, its words in 12px `secondary`,
 * lit on hover. Framed, since every action is a framed button (`family-style.md`), and without a
 * chevron, since it does what it says rather than opening a menu (that is `Pill`). Every prop of a
 * button passes through, the ref too; it defaults to `type="button"`.
 */
export function QuickAction({ children, type = 'button', ...props }: QuickActionProps) {
  const { className: _className, style: _style, ...rest } = props as ComponentPropsWithRef<'button'>
  return (
    <button
      type={type}
      className="inline-flex h-(--nt-control-sm) min-w-0 max-w-full items-center rounded-full border border-border-strong px-2.5 text-[12px] whitespace-nowrap text-secondary outline-focus transition-[background-color,color] duration-(--nt-duration-fast) hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40"
      {...rest}
    >
      <span className="min-w-0 truncate">{children}</span>
    </button>
  )
}
