import { stripComments } from './source'

/** Every quoted run in a source file; class lists live in one of these three literal forms. */
const STRINGS = /'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g

/**
 * Finds class strings that ask for the focus ring but forget to offset it.
 *
 * The ring is a trio: `outline-focus` (the colour), `outline-2` (the width) and an
 * `outline-offset-*` (the gap). Without the third the 2px ring lies flush against the border and
 * reads as a thicker border rather than as focus. A negative offset (drawn inside) counts.
 */
export function findFocusRingsWithoutOffset(source: string): string[] {
  return [...stripComments(source).matchAll(STRINGS)]
    .map((match) => match[1] ?? match[2] ?? match[3] ?? '')
    .filter((text) => text.includes('outline-focus') && !text.includes('outline-offset-'))
}
