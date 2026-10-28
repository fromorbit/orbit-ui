import { Fragment, type ReactNode } from 'react'
import { Button } from '../primitives/Button'
import { Icon } from '../primitives/Icon'

/** One crumb of the title strip; the last one is the page itself and has no `onSelect`. */
export interface Crumb {
  label: string
  /** Goes to that place; left out on the last crumb, which is the page the reader is on. */
  onSelect?: () => void
  /** An id (`SPEC-1`, `PLAN-3`): set in mono, as ids are everywhere. */
  mono?: boolean
}

/**
 * The trail for `TitleBar`'s existing `crumbs` slot: "Specs › SPEC-1", "Flow › opdracht".
 *
 * Every crumb but the last is a quiet button that goes there; the last is the page itself, plain
 * text with `aria-current="page"`. A chevron of 12px in the faint tone stands between them,
 * hidden from a screen reader, which hears the trail as a list of places in a `nav`.
 */
export function PageCrumbs({
  trail,
  label,
}: {
  trail: readonly Crumb[]
  /** The name of the trail as a landmark: "Kruimelpad". */
  label: string
}): ReactNode {
  return (
    <nav aria-label={label} data-nt-page-crumbs className="ms-1 flex min-w-0 items-center gap-0.5">
      {trail.map((crumb, index) => {
        const last = index === trail.length - 1
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: a trail never reorders; its position is the key
          <Fragment key={index}>
            {index > 0 ? (
              <span aria-hidden="true" className="flex shrink-0">
                <Icon name="chevron-right" size="xs" tone="faint" />
              </span>
            ) : null}
            {last || crumb.onSelect === undefined ? (
              <span
                {...(last ? { 'aria-current': 'page' as const } : {})}
                className={
                  crumb.mono
                    ? 'min-w-0 truncate px-2 font-mono text-[13px] text-fg'
                    : 'min-w-0 truncate px-2 text-[13px] text-fg'
                }
              >
                {crumb.label}
              </span>
            ) : (
              <Button variant="quiet" size="sm" onClick={crumb.onSelect}>
                {crumb.mono ? <span className="font-mono">{crumb.label}</span> : crumb.label}
              </Button>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}

/** The props of `PageHeader`. */
export interface PageHeaderProps {
  /** The name of the page, its one `h1`. */
  title: string
  /**
   * One quiet line under the title: what the page holds in a few words ("3 beslissen · 2
   * nakijken", a count). Never a second title.
   */
  meta?: ReactNode
  /** Controls at the right of the strip: a search field, a primary action. */
  actions?: ReactNode
  /** The id of the `h1`, for a region that takes its name from it (`aria-labelledby`). */
  titleId?: string
}

/**
 * The head of a page: an `h1` of 20px in the heading weight (`--nt-font-weight-heading`) in a strip
 * of 40px, one meta line, actions on the right.
 *
 * An audit of the app once found six pages with six heads: 20px/500 in Settings, a bolder and larger one in
 * Specs, a loose `h1` of 18px in Flow, none in Artifacts, three stacked in Wacht op jou. One
 * component makes them one: the same size, the same strip, and — because each page puts it right
 * under the title strip, 8px down — the same height on the screen, so moving between pages moves
 * nothing but the words. The strip is fixed at 40px whether there are actions or not, so a page
 * with a search field beside its title does not start its content lower than one without.
 *
 * `data-nt-page-header` is what the end-to-end check names it by.
 */
export function PageHeader({ title, meta, actions, titleId }: PageHeaderProps): ReactNode {
  return (
    // A `div`, not a `header`: outside a section a `header` is the `banner` landmark of the whole
    // window, and that is the title strip's, not a page's.
    <div data-nt-page-header className="flex shrink-0 flex-col">
      <div className="flex h-10 min-w-0 items-center gap-3">
        <h1
          {...(titleId === undefined ? {} : { id: titleId })}
          className="m-0 min-w-0 truncate text-[20px] leading-7 font-heading text-fg"
        >
          {title}
        </h1>
        {actions === undefined ? null : (
          <div className="ms-auto flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {meta === undefined ? null : (
        <p data-nt-page-meta className="m-0 truncate text-[12px] text-muted tabular-nums">
          {meta}
        </p>
      )}
    </div>
  )
}
