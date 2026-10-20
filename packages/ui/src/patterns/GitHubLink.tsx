import type { ReactElement } from 'react'
import { BrandIcon } from '../primitives/BrandIcon'

const STATE_DOT = {
  open: 'bg-success',
  closed: 'bg-danger',
  merged: 'bg-accent',
} as const

/** The props of `GitHubLink`. */
export interface GitHubLinkProps {
  /** The reference as it reads: `#12`, `kassa#12` or `ander/kassa#12`. */
  text: string
  /** `either` for a bare `#12`, which does not say whether it is a pull request or an issue. */
  kind: 'pull' | 'issue' | 'either'
  number: number
  /** The whole reference, `owner/repo#12`, for the tooltip. */
  title: string
  /**
   * The accessible name in the host's words, with the state once it is known: "Pull request 12,
   * gemerged". The caller words it, since only it knows what `kind` and `pull.state` are called.
   */
  label: string
  onOpen(): void
  /** What core knows of the pull request, once it answered: the title joins the tooltip, the state a dot. */
  pull?: { title: string; state: 'open' | 'closed' | 'merged' } | undefined
}

/**
 * A pull request or issue in running text, as a chip: GitHub's mark and the reference, on a quiet
 * surface that deepens on hover — the way the terminal of Claude Code shows them.
 *
 * A sibling of `FileLink` and built the same way: a `button`, since there is no address the
 * renderer may follow itself (opening is the caller's, through core and the host), with its name
 * from the catalogue ("Pull request 12") and the whole `owner/repo#12` in its `title`. Unlike a
 * path it never breaks across lines: it is one short word. The surface at rest is what makes it a
 * chip rather than a link among the words; it is the surface of an inline code, so the two read
 * as kin.
 */
export function GitHubLink({
  text,
  kind,
  number,
  title,
  label,
  onOpen,
  pull,
}: GitHubLinkProps): ReactElement {
  return (
    <button
      type="button"
      data-nt-github-link
      aria-label={label}
      title={pull ? `${title} · ${pull.title}` : title}
      {...(pull ? { 'data-nt-pr-state': pull.state } : {})}
      onClick={() => onOpen()}
      className="inline cursor-pointer whitespace-nowrap rounded-sm bg-surface px-1 py-0.5 font-mono text-[12px] text-fg outline-focus transition-colors duration-100 hover:bg-surface-active focus-visible:outline-2 focus-visible:outline-offset-1 motion-reduce:transition-none"
    >
      <span className="mr-1 inline-flex translate-y-[2px]">
        <BrandIcon brand="github" />
      </span>
      {text}
      {pull ? (
        <span
          aria-hidden
          className={`ml-1 inline-block size-1.5 rounded-full align-middle ${STATE_DOT[pull.state]}`}
        />
      ) : null}
    </button>
  )
}
