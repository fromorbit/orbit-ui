import { type ReactNode, useId } from 'react'
import { SectionHeading } from '../primitives/SectionHeading'
import { navClick } from './nav-click'

/** The props of `SideNav`. */
export interface SideNavProps {
  /** The name of the landmark: the app whose places these are ("Lens"). */
  label: string
  /** The head of the panel, on a row of 32px above the groups: the app's wordmark, as a rule. */
  head?: ReactNode
  /** The groups, as `SideNavGroup`s. */
  children: ReactNode
}

/**
 * The navigation of one app in the side panel of the shell, the middle layer between the frame
 * and the canvas (`bg-side-panel`, `docs/family-style.md`, "The shell").
 *
 * A `nav` landmark named after the app, a head, and groups of rows 24px apart
 * (`--nt-space-group`). It paints no plane of its own: the host lays it on the side panel, with
 * the hairline in `border` towards the content.
 */
export function SideNav({ label, head, children }: SideNavProps) {
  return (
    <nav
      aria-label={label}
      data-nt-side-nav
      className="flex min-h-0 flex-col gap-2 px-2 pt-2.5 pb-4"
    >
      {head === undefined ? null : (
        <div className="flex h-(--nt-control-md) shrink-0 items-center px-2.5 text-fg">{head}</div>
      )}
      <div data-nt-side-nav-groups className="flex flex-col gap-(--nt-space-group)">
        {children}
      </div>
    </nav>
  )
}

/** The props of `SideNavGroup`. */
export interface SideNavGroupProps {
  /** The heading of the group, in sentence case; without it the group stands without a head. */
  label?: string
  /** The rows, as `SideNavLink`s. */
  children: ReactNode
}

/**
 * A group of rows in a `SideNav`: a list named by its heading, the `SectionHeading` every list of
 * the kit takes (12px/500 muted), its rows 1px apart.
 */
export function SideNavGroup({ label, children }: SideNavGroupProps) {
  const id = useId()
  return (
    <div className="flex flex-col">
      {label === undefined ? null : (
        <SectionHeading level="label" id={id}>
          {label}
        </SectionHeading>
      )}
      <ul
        className="m-0 flex list-none flex-col gap-px p-0"
        {...(label === undefined ? {} : { 'aria-labelledby': id })}
      >
        {children}
      </ul>
    </div>
  )
}

/** The props of `SideNavLink`. */
export interface SideNavLinkProps {
  /** The name of the place. */
  label: string
  /** Where the row leads: a real link, so a new tab still works. */
  href: string
  /** The place that is open: `aria-current="page"` and the `row-active` plane, no check. */
  current?: boolean
  /** A count or a short value at the end of the row (12, Assertief): 11px muted in DM Mono. */
  meta?: string
  /** The name of a repository or a path: the label in DM Mono. */
  mono?: boolean
  /** Takes a plain click instead of the browser, so the host routes without a reload. */
  onNavigate?: (href: string) => void
}

/**
 * One place in a `SideNav`: a row of 32px (`--nt-control-md`), 13px, radius 8px. At rest in
 * `secondary`, under the pointer on `row-hover`; open on `row-active` in `fg` at 500. The meta of
 * the open row steps up to secondary through `theme.css`, as on every lit row.
 */
export function SideNavLink({
  label,
  href,
  current = false,
  meta,
  mono = false,
  onNavigate,
}: SideNavLinkProps) {
  const tone = current
    ? 'bg-row-active font-medium text-fg'
    : 'text-secondary hover:bg-row-hover hover:text-fg'
  return (
    <li>
      <a
        href={href}
        aria-current={current ? 'page' : undefined}
        onClick={navClick(href, onNavigate)}
        className={`no-drag flex h-(--nt-control-md) min-w-0 items-center gap-2 rounded-md px-2.5 text-[13px] no-underline outline-focus transition-colors duration-(--nt-duration-fast) ease-(--nt-ease) focus-visible:outline-2 focus-visible:-outline-offset-2 ${tone}`}
      >
        <span className={mono ? 'min-w-0 truncate font-mono' : 'min-w-0 truncate'}>{label}</span>
        {meta === undefined ? null : (
          <span className="ms-auto shrink-0 font-mono text-[11px] font-normal tabular-nums text-muted">
            {meta}
          </span>
        )}
      </a>
    </li>
  )
}
