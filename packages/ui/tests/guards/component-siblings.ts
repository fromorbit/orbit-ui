/**
 * The `.tsx` files under `src/` that are not components, by their path relative to `src/`.
 *
 * The rule is "every `.tsx` file is a component and needs its pair"; this is the list of knowing
 * exceptions, spelled out file by file rather than derived from a naming convention: nothing ties
 * a file name to the identifier it exports, so "lowercase means helper" would quietly excuse a
 * `chip-row.tsx` that exports `ChipRow`. Every entry is a module without states.
 */
const HELPERS: readonly string[] = [
  // A React context plus the one-line provider around it; `portal.test.tsx` covers it.
  'overlays/portal.tsx',
  // The ports a host hands the library: it draws nothing, so there is no story;
  // `UiProvider.test.tsx` covers it.
  'provider/UiProvider.tsx',
]

/**
 * From the file names in one directory, finds the `<Name>.test.tsx` and `<Name>.gallery.tsx`
 * siblings missing for every component file. `directory` is relative to `src/`, which is what
 * {@link HELPERS} is matched against: the same file name in another layer is a component again.
 */
export function findMissingSiblings(names: readonly string[], directory = ''): string[] {
  const present = new Set(names)
  const exempt = new Set(HELPERS)
  const missing: string[] = []
  for (const name of names) {
    if (!name.endsWith('.tsx') || name.endsWith('.test.tsx') || name.endsWith('.gallery.tsx')) {
      continue
    }
    if (exempt.has(directory ? `${directory}/${name}` : name)) continue
    const base = name.slice(0, -'.tsx'.length)
    if (!present.has(`${base}.test.tsx`)) missing.push(`${base}.test.tsx`)
    if (!present.has(`${base}.gallery.tsx`)) missing.push(`${base}.gallery.tsx`)
  }
  return missing
}

/** The listed helpers that no longer exist among `paths` (relative to `src/`), so the list cannot rot. */
export function findStaleHelpers(paths: readonly string[]): string[] {
  const present = new Set(paths)
  return HELPERS.filter((helper) => !present.has(helper))
}
