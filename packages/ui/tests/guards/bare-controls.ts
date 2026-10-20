import { stripComments } from './source'

/** The native controls that only a component of the library renders. */
const BARE = /<(button|input|textarea|select|dialog)\b/g

/**
 * Finds native controls in a source. Biome cannot restrict JSX elements, so this guards the rule;
 * comments are stripped first, so a `<button>` written as an example never trips it.
 */
export function findBareControls(source: string): string[] {
  return [...stripComments(source).matchAll(BARE)].map((match) => match[1] as string)
}
