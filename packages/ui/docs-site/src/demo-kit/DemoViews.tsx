import { createElement, type ReactNode, useId, useMemo } from 'react'
import {
  PageHeader,
  ScrollArea,
  SearchList,
  type SearchListItem,
  type SearchListLabels,
  SectionHeading,
  Tag,
} from '../../../src'
import { type Story, storyId } from '../../../src/gallery'
import { DEMOS, type DemoInventory, inventoryOf, missingOverview, OVERVIEW_SLUG } from './registry'

/** Prefix of the hash route of a demo: `#/demo/betalingen`. */
export const DEMO_PREFIX = '#/demo/'

/** The sentences of the list of demos. */
const LIST_LABELS: SearchListLabels = {
  empty: "Geen demo's",
  noResults: (query) => `Geen treffers voor ‘${query}’`,
  loading: 'Laden…',
  error: 'Kon de lijst niet laden',
}

/** The slug in a demo hash, or undefined for a hash that is not one. */
export function demoSlugOf(hash: string): string | undefined {
  if (hash === '#/demo') return ''
  return hash.startsWith(DEMO_PREFIX)
    ? decodeURIComponent(hash.slice(DEMO_PREFIX.length))
    : undefined
}

/** The slug the page shows for a hash: a known demo, the overview, or the first demo. */
export function shownSlug(slug: string | undefined): string {
  if (slug === OVERVIEW_SLUG) return slug
  return DEMOS.find((demo) => demo.slug === slug)?.slug ?? DEMOS[0]?.slug ?? OVERVIEW_SLUG
}

/** The title of a slug as the stage names itself. */
export function titleOfSlug(slug: string): string {
  if (slug === OVERVIEW_SLUG) return 'Overzicht ontbrekend'
  return DEMOS.find((demo) => demo.slug === slug)?.title ?? slug
}

/**
 * The list of the demos in the left column, with the overview of what is missing under it.
 *
 * The same `SearchList` the components tab uses, without its search: nine rows need none.
 */
export function DemoNav({ current }: { current: string }): ReactNode {
  const items = useMemo<SearchListItem[]>(
    () => [
      ...DEMOS.map((demo) => ({
        id: demo.slug,
        label: demo.title,
        icon: demo.icon,
        group: 'Schermen',
      })),
      {
        id: OVERVIEW_SLUG,
        label: 'Overzicht ontbrekend',
        icon: 'list-checks' as const,
        group: 'Wensenlijst',
      },
    ],
    [],
  )
  return (
    <SearchList
      items={items}
      selectedId={current}
      onSelect={(id) => {
        location.hash = `${DEMO_PREFIX}${id}`
      }}
      label="Demo's"
      labels={LIST_LABELS}
      searchable={false}
      sectionHeadings
    />
  )
}

/** The story of a component, to link a name in the lists to its page on the components tab. */
function storyHref(stories: readonly Story[], name: string): string | undefined {
  const story = stories.find((entry) => entry.title === name)
  return story ? `#/${storyId(story)}` : undefined
}

/** The strip under a demo: what it had to draw as missing, and what it is made of. */
function Inventory({
  inventory,
  stories,
}: {
  inventory: DemoInventory
  stories: readonly Story[]
}): ReactNode {
  const usedId = useId()
  const missingId = useId()
  return (
    <aside
      aria-label="Gebruikt en ontbreekt"
      className="flex shrink-0 flex-col gap-2 border-border border-t bg-frame px-4 py-3"
    >
      <div className="flex items-baseline gap-3">
        <div className="w-28 shrink-0">
          <SectionHeading level="label" id={missingId} count={String(inventory.missing.length)}>
            Ontbreekt
          </SectionHeading>
        </div>
        <ul aria-label="Ontbreekt" className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
          {inventory.missing.map((name) => (
            <li key={name}>
              <a
                href={`${DEMO_PREFIX}${OVERVIEW_SLUG}`}
                className="rounded-sm font-mono text-[12px] text-accent-text no-underline outline-focus hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {name}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-baseline gap-3">
        <div className="w-28 shrink-0">
          <SectionHeading level="label" id={usedId} count={String(inventory.used.length)}>
            Gebruikt
          </SectionHeading>
        </div>
        <ul aria-label="Gebruikt" className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
          {inventory.used.map((name) => {
            const href = storyHref(stories, name)
            return (
              <li key={name} className="text-[12px] text-secondary">
                {href === undefined ? (
                  name
                ) : (
                  <a
                    href={href}
                    className="rounded-sm text-secondary no-underline outline-focus hover:text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {name}
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}

/**
 * One demo on the stage at full width and height, as a window of an app, with its lists under it.
 *
 * The lists come from the demo's source (`inventoryOf`), so they cannot disagree with the screen.
 */
export function DemoStage({
  slug,
  showInventory,
  stories,
}: {
  slug: string
  showInventory: boolean
  stories: readonly Story[]
}): ReactNode {
  if (slug === OVERVIEW_SLUG) return <MissingOverview />
  const demo = DEMOS.find((entry) => entry.slug === slug)
  if (!demo) return null
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        data-demo={demo.slug}
        className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-canvas"
      >
        {createElement(demo.Screen)}
      </div>
      {showInventory ? <Inventory inventory={inventoryOf(demo.slug)} stories={stories} /> : null}
    </div>
  )
}

/**
 * The wishlist: every component a demo had to mark as missing, why it is wanted, and where.
 *
 * Sorted by the number of demos that miss it, so the first row is the one to build first.
 */
export function MissingOverview(): ReactNode {
  const entries = missingOverview()
  const listId = useId()
  return (
    <ScrollArea>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-8 py-8">
        <PageHeader
          title="Overzicht ontbrekend"
          meta={`${entries.length} componenten ontbreken in ${DEMOS.length} demo's`}
        />
        <ul
          id={listId}
          aria-label="Ontbrekende componenten"
          className="m-0 flex list-none flex-col rounded-lg border border-border bg-surface p-0"
        >
          {entries.map((entry) => (
            <li
              key={entry.name}
              aria-labelledby={`${listId}-${entry.name}`}
              className="flex flex-col gap-1.5 border-border px-4 py-3 not-first:border-t"
            >
              <div className="flex items-center gap-2">
                <h3
                  id={`${listId}-${entry.name}`}
                  className="m-0 font-mono text-[13px] font-medium text-accent-text"
                >
                  {entry.name}
                </h3>
                <Tag>{`${entry.demos.length}×`}</Tag>
              </div>
              <p className="m-0 text-[13px] text-secondary">{entry.reason}</p>
              <p className="m-0 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
                {entry.demos.map((demo) => (
                  <a
                    key={demo.slug}
                    href={`${DEMO_PREFIX}${demo.slug}`}
                    className="rounded-sm text-muted no-underline outline-focus hover:text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {demo.title}
                  </a>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </ScrollArea>
  )
}
