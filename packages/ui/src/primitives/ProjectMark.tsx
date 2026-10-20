/**
 * The one segmenter every mark shares, made at the first mark.
 *
 * Not one per mark: each row of the sidebar draws one, and two hundred segmenters were a measurable
 * part of a start with two hundred stored chats.
 */
let graphemes: Intl.Segmenter | undefined

/** The letter of every project name seen, since a list repeats the few projects there are. */
const initials = new Map<string, string>()

/**
 * The first letter of a project name, as a whole grapheme (an emoji stays one sign), in capitals.
 *
 * `Intl.Segmenter` rather than `charAt(0)`: a name that starts with an emoji would otherwise be cut
 * in half, and the block would show half a surrogate pair.
 */
function initial(name: string): string {
  const known = initials.get(name)
  if (known !== undefined) return known
  graphemes ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  const [first] = graphemes.segment(name.trim())
  const letter = first ? first.segment.toLocaleUpperCase() : ''
  initials.set(name, letter)
  return letter
}

/** The props of `ProjectMark`. */
export interface ProjectMarkProps {
  /** The project's name; the block shows its first letter, the caller writes the name after it. */
  name: string
}

/**
 * The small block before a project name on the first line of a chat: 14px, radius 4,
 * a white plane of 8% with the first letter in 9px/600 `text-secondary`.
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
      className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-sm bg-mark text-[9px] leading-none font-semibold text-secondary"
    >
      {initial(name)}
    </span>
  )
}
