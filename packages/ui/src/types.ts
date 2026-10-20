/**
 * The data shapes the library draws, as its own copies.
 *
 * The library knows no protocol of a host: these are structural copies of what Orbit's
 * protocol package sends, so Orbit hands its values over as they are and a test on Orbit's side
 * fails the moment the two drift apart.
 */

/**
 * The makers whose mark `BrandIcon` draws, in the order the gallery shows them. A word a host has
 * no mark for is no `Brand`; it passes none and gets the neutral glyph.
 */
export const BRANDS = [
  'anthropic',
  'openai',
  'google',
  'github',
  'cursor',
  'block',
  'qwen',
  'jetbrains',
  'kiro',
  'factory',
  'cline',
  'moonshot',
  'augment',
  'mistral',
  'kilo',
  'cognition',
] as const

/** One maker of {@link BRANDS}. */
export type Brand = (typeof BRANDS)[number]

/**
 * A change to one file, as a diff draws it: everything beside `path` and `kind` is optional detail,
 * since "not known" is an honest answer of whoever made the change.
 */
export interface FileChange {
  path: string
  kind: 'add' | 'delete' | 'modify' | 'move' | 'copy'
  /** Where a `move` or a `copy` came from. */
  fromPath?: string | undefined
  /** The unified diff, when there is one. */
  diff?: string | undefined
  /** The tool call the change happened in, for a view that points back at it. */
  toolCallId?: string | undefined
  /** Lines added, counted by whoever made the change. */
  additions?: number | undefined
  /** Lines removed; see `additions`. */
  deletions?: number | undefined
}
