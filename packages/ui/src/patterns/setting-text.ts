/** Blank text is no text: a value the caller does not have yet never becomes an empty line. */
export function present(text: string | undefined): string | undefined {
  return text === undefined || text.trim() === '' ? undefined : text
}

/**
 * The line of explanation without a full stop at its end: one form for every settings row,
 * whatever its catalogue spelt, and room for "· Na herstart" behind it. An ellipsis stays.
 */
export function withoutFullStop(text: string | undefined): string | undefined {
  return text?.trim().replace(/(?<!\.)\.$/, '')
}
