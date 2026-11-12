import { initial } from './initial'

/** The props of `TeamMark`. */
export interface TeamMarkProps {
  /** The team's name; the block shows its first letter, the caller writes the name beside it. */
  name: string
}

/**
 * The block before a team's name in the top bar or a menu of teams: 20px, radius 4, the plane of a
 * mark (`bg-mark`) with the first letter in 11px/600 in `fg`.
 *
 * `ProjectMark` a step larger and at full strength: a project's block stands in a row of muted
 * meta, the team's beside its name in a control of the top bar, where a muted letter would read as
 * disabled. No colour per team, as for a project: the name beside it tells two teams apart, and a
 * colour belongs to a person (`Avatar`) or a product (the satellite). Square, never round, so it is
 * never taken for a person. Decorative (`aria-hidden`): the name stands beside it as text.
 */
export function TeamMark({ name }: TeamMarkProps) {
  return (
    <span
      aria-hidden="true"
      data-nt-team-mark
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm bg-mark text-[11px] leading-none font-semibold text-fg"
    >
      {initial(name)}
    </span>
  )
}
