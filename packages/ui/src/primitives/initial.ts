/**
 * The one segmenter every mark shares, made at the first mark.
 *
 * Not one per mark: each row of the sidebar draws one, and two hundred segmenters were a measurable
 * part of a start with two hundred stored chats.
 */
let graphemes: Intl.Segmenter | undefined

/** The letter of every name seen, since a list repeats the few projects and teams there are. */
const initials = new Map<string, string>()

/**
 * The first letter of a name, as a whole grapheme (an emoji stays one sign), in capitals: the sign
 * of `ProjectMark` and `TeamMark`.
 *
 * `Intl.Segmenter` rather than `charAt(0)`: a name that starts with an emoji would otherwise be cut
 * in half, and the block would show half a surrogate pair.
 */
export function initial(name: string): string {
  const known = initials.get(name)
  if (known !== undefined) return known
  graphemes ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  const [first] = graphemes.segment(name.trim())
  const letter = first ? first.segment.toLocaleUpperCase() : ''
  initials.set(name, letter)
  return letter
}
