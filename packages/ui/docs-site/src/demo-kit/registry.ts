import { libraryImports, localImports, missingNames, resolveLocal } from './inventory'
import { MISSING, type MissingName } from './Missing'
import type { Demo, DemoModule } from './types'

/** The order of the list; each slug is a file `demos/<slug>.tsx`. */
const ORDER = [
  'dashboard',
  'cms',
  'betalingen',
  'chat',
  'instellingen',
  'team',
  'taken',
  'inloggen',
] as const

const modules = import.meta.glob<{ default: DemoModule }>('../demos/*.tsx', { eager: true })

/**
 * The text of every demo file and its parts, for the lists derived from it.
 *
 * Vitest caches a transformed module by its own content (`node_modules/.vitest-cache`), and the
 * file list of a glob is part of that transform: after adding a file under `demos/`, clear that
 * folder, or the tests still see the old list.
 */
const sources = import.meta.glob<string>('../demos/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** Every demo, in the order of the list. */
export const DEMOS: readonly Demo[] = ORDER.map((slug) => {
  const module = modules[`../demos/${slug}.tsx`]
  if (!module) throw new Error(`No demo file for ${slug}`)
  return { slug, ...module.default }
})

/** The slug of the page that bundles what is missing: `#/demo/ontbrekend`. */
export const OVERVIEW_SLUG = 'ontbrekend'

/** What one demo is made of, read from its file and the parts it imports. */
export interface DemoInventory {
  /** Library components, alphabetical. */
  used: string[]
  /** Names of its `Missing` placeholders, alphabetical. */
  missing: MissingName[]
}

/** The source files a demo consists of: its own file first, then the parts it pulls in. */
function filesOf(slug: string): string[] {
  const seen: string[] = []
  const visit = (key: string) => {
    if (seen.includes(key) || sources[key] === undefined) return
    seen.push(key)
    for (const specifier of localImports(sources[key])) {
      const base = resolveLocal(key, specifier)
      visit(`${base}.tsx`)
      visit(`${base}.ts`)
    }
  }
  visit(`../demos/${slug}.tsx`)
  return seen
}

/** The components one demo uses and the ones it misses, derived from its source. */
export function inventoryOf(slug: string): DemoInventory {
  const files = filesOf(slug).map((key) => sources[key] ?? '')
  const used = [...new Set(files.flatMap(libraryImports))].sort((a, b) => a.localeCompare(b))
  const missing = [...new Set(files.flatMap(missingNames))]
    .filter((name): name is MissingName => name in MISSING)
    .sort((a, b) => a.localeCompare(b))
  return { used, missing }
}

/** One line of the wishlist: a missing component, why, and the demos it stands in. */
export interface MissingEntry {
  name: MissingName
  reason: string
  demos: Demo[]
}

/** Every missing component over all demos, the most wanted first. */
export function missingOverview(): MissingEntry[] {
  const names = [...new Set(DEMOS.flatMap((demo) => inventoryOf(demo.slug).missing))]
  return names
    .map((name) => ({
      name,
      reason: MISSING[name],
      demos: DEMOS.filter((demo) => inventoryOf(demo.slug).missing.includes(name)),
    }))
    .sort((a, b) => b.demos.length - a.demos.length || a.name.localeCompare(b.name))
}
