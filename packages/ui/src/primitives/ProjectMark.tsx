import { initial } from './initial'

/** The props of `ProjectMark`. */
export interface ProjectMarkProps {
  /** The project's name; the block shows its first letter, the caller writes the name after it. */
  name: string
}

/**
 * The small block before a project name on the first line of a chat: 16px, radius 4,
 * a white plane of 8% with the first letter in 11px/600, the smallest size of the scale `text-secondary`.
 *
 * Muted and without colour on purpose: in the sidebar only
 * the status shapes carry colour, so two projects with the same letter draw the same block, and the
 * name beside it is what tells them apart. Decorative (`aria-hidden`): the name stands after it as
 * text, and the row's own name says the project.
 */
export function ProjectMark({ name }: ProjectMarkProps) {
  return (
    <span
      aria-hidden="true"
      data-nt-project-mark
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-sm bg-mark text-[11px] leading-none font-semibold text-secondary"
    >
      {initial(name)}
    </span>
  )
}
