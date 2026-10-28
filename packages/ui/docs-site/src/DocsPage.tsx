import {
  type ComponentType,
  createElement,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  CopyButton,
  OrbitWordmark,
  type Platform,
  PortalContainerProvider,
  ScrollArea,
  SearchList,
  type SearchListItem,
  type SearchListLabels,
  SegmentedControl,
  Toggle,
  UiProvider,
} from '../../src'
import { type Story, stateId, storyId } from '../../src/gallery'
import {
  DEMO_PREFIX,
  DemoNav,
  DemoStage,
  demoSlugOf,
  shownSlug,
  titleOfSlug,
} from './demo-kit/DemoViews'
import { OVERVIEW_SLUG } from './demo-kit/registry'
import { docsShortcuts } from './shortcuts'

/** Prefix of the hash route of one story: `#/primitives-button`. */
const PREFIX = '#/'

/** The two palettes of `tokens.css`, as the page offers them. */
type Theme = 'light' | 'dark'

/** The sentences of the list, in Dutch: the page speaks to the people who read the components. */
const LIST_LABELS: SearchListLabels = {
  empty: 'Geen componenten',
  noResults: (query) => `Geen treffers voor ‘${query}’`,
  loading: 'Laden…',
  error: 'Kon de lijst niet laden',
}

const THEME_OPTIONS = [
  { value: 'dark', label: 'Donker' },
  { value: 'light', label: 'Licht' },
] as const

/** The products of the family, whose satellite `tokens.css` picks with `data-product`. */
type Product = 'orbit' | 'halo' | 'fold'

const PRODUCT_OPTIONS = [
  { value: 'orbit', label: 'Orbit' },
  { value: 'halo', label: 'Halo' },
  { value: 'fold', label: 'Fold' },
] as const

/** The two halves of the page: one component at a time, or whole screens built from them. */
type Mode = 'components' | 'demos'

const MODE_OPTIONS = [
  { value: 'components', label: 'Componenten' },
  { value: 'demos', label: "Demo's" },
] as const

/** Mac and Windows only: Linux draws its keys the way Windows does. */
const PLATFORM_OPTIONS = [
  { value: 'mac', label: 'macOS' },
  { value: 'windows', label: 'Windows' },
] as const

/** The story id in a hash, or undefined for a hash that names none. */
function idOf(hash: string): string | undefined {
  return hash.startsWith(PREFIX) && demoSlugOf(hash) === undefined
    ? decodeURIComponent(hash.slice(PREFIX.length))
    : undefined
}

/** The current hash, live: the address bar is the page's only router. */
function useHash(): string {
  const [hash, setHash] = useState(() => location.hash)
  useEffect(() => {
    const onHash = () => setHash(location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return hash
}

/**
 * The framed box one state of a story stands in, which is also the container of its floating
 * layers.
 *
 * One container per state rather than one for the stage, as Orbit's gallery has: a layer without
 * an anchor (the open `MentionList`) then lands under its own caption instead of at the foot of
 * the page. The state is mounted as a component, never called, since it may hold hooks of its own.
 */
function StateFrame({ state }: { state: ComponentType }): ReactNode {
  const [frame, setFrame] = useState<HTMLElement | null>(null)
  return (
    <div ref={setFrame} className="relative rounded-lg border border-border bg-bg p-6">
      <PortalContainerProvider container={frame}>{createElement(state)}</PortalContainerProvider>
    </div>
  )
}

/** The props of {@link DocsPage}. */
export interface DocsPageProps {
  /** The catalogue to show: the library's `stories`, sorted by group and title. */
  stories: readonly Story[]
}

/**
 * The public page of the components: a searchable list of every story on the left, the chosen one
 * on the right, with switches for the theme and the platform.
 *
 * A copy of the behaviour of Orbit's gallery (`features/gallery`), without its i18n and bridge: the
 * route is the hash (`#/<story-id>`), so a link to one component works on a static host under any
 * path. The theme goes on `<html>` as `data-theme`, which is what `tokens.css` switches on, and to
 * the `UiProvider`, for what reads the theme in code (the diffs of `@pierre/diffs`); the product goes
 * there as `data-product`, which picks the satellite (the dot beside "UI"). The provider
 * gets `docsShortcuts`, so the key caps of the stories are drawn as Orbit draws them.
 *
 * The second tab, "Demo's", shows whole screens built from the components (`#/demo/<slug>`) and
 * the wishlist of what they lack (`#/demo/ontbrekend`); see `demo-kit/`. Both tabs keep their
 * place in state, so switching back returns to the story or demo that was open.
 */
export function DocsPage({ stories }: DocsPageProps): ReactNode {
  const hash = useHash()
  const [theme, setTheme] = useState<Theme>('dark')
  const [product, setProduct] = useState<Product>('orbit')
  const [platform, setPlatform] = useState<Platform>('mac')
  const shortcuts = useMemo(() => docsShortcuts(platform), [platform])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.product = product
  }, [product])

  const [showInventory, setShowInventory] = useState(true)
  const demoSlug = demoSlugOf(hash)
  const mode: Mode = demoSlug === undefined ? 'components' : 'demos'
  const shownDemo = shownSlug(demoSlug)

  const chosenId = idOf(hash)
  const story = stories.find((entry) => storyId(entry) === chosenId) ?? stories[0]
  const currentId = story ? storyId(story) : undefined

  // Where each tab was, so the tabs return to it rather than to its first entry.
  const [lastStory, setLastStory] = useState<string | undefined>(chosenId)
  const [lastDemo, setLastDemo] = useState<string | undefined>(demoSlug)
  useEffect(() => {
    if (mode === 'components' && chosenId) setLastStory(chosenId)
    if (mode === 'demos') setLastDemo(shownDemo)
  }, [mode, chosenId, shownDemo])

  const switchMode = (next: Mode) => {
    location.hash =
      next === 'demos' ? `${DEMO_PREFIX}${lastDemo ?? shownDemo}` : `${PREFIX}${lastStory ?? ''}`
  }

  const items = useMemo<SearchListItem[]>(
    () =>
      stories.map((entry) => ({
        id: storyId(entry),
        label: entry.title,
        group: entry.group,
        keywords: [entry.group, ...Object.keys(entry.states)],
      })),
    [stories],
  )

  return (
    <UiProvider shortcuts={shortcuts} platform={platform} theme={theme} locale="nl-NL">
      <div className="flex h-dvh bg-frame text-fg">
        <nav
          aria-label={mode === 'demos' ? "Demo's" : 'Componenten'}
          className="flex w-64 shrink-0 flex-col border-border border-r bg-(image:--nt-sidebar-gradient)"
        >
          <div className="flex h-12 shrink-0 items-center gap-2 px-4">
            <OrbitWordmark className="h-4 text-fg" />
            <span className="text-[13px] text-muted">UI</span>
            <span aria-hidden="true" className="size-1.5 rounded-full bg-satellite" />
          </div>
          <div className="min-h-0 flex-1">
            <ScrollArea>
              <div className="px-2 pb-2">
                {mode === 'demos' ? (
                  <DemoNav current={shownDemo} />
                ) : (
                  <SearchList
                    items={items}
                    selectedId={currentId ?? null}
                    onSelect={(id) => {
                      location.hash = `${PREFIX}${id}`
                    }}
                    label="Zoek een component"
                    labels={LIST_LABELS}
                  />
                )}
              </div>
            </ScrollArea>
          </div>
        </nav>
        <div className="flex min-w-0 flex-1 flex-col bg-canvas">
          <header className="flex h-12 shrink-0 items-center gap-3 border-border border-b px-4">
            <SegmentedControl<Mode>
              label="Weergave"
              size="sm"
              value={mode}
              options={MODE_OPTIONS}
              onValueChange={switchMode}
            />
            <div className="flex-1" />
            {mode === 'demos' && shownDemo !== OVERVIEW_SLUG ? (
              <Toggle
                icon="panel-right"
                label="Gebruikt en ontbreekt"
                size="sm"
                pressed={showInventory}
                onPressedChange={setShowInventory}
              />
            ) : null}
            <SegmentedControl<Platform>
              label="Platform"
              size="sm"
              value={platform}
              options={PLATFORM_OPTIONS}
              onValueChange={setPlatform}
            />
            <SegmentedControl<Product>
              label="Product"
              size="sm"
              value={product}
              options={PRODUCT_OPTIONS}
              onValueChange={setProduct}
            />
            <SegmentedControl<Theme>
              label="Thema"
              size="sm"
              value={theme}
              options={THEME_OPTIONS}
              onValueChange={setTheme}
            />
          </header>
          {mode === 'demos' ? (
            <main
              key={shownDemo}
              aria-label={titleOfSlug(shownDemo)}
              className="relative min-h-0 flex-1 overflow-hidden"
            >
              <DemoStage slug={shownDemo} showInventory={showInventory} stories={stories} />
            </main>
          ) : (
            <main
              key={currentId ?? 'empty'}
              // The stage scrolls, so the keyboard needs a stop on it (axe scrollable-region-focusable).
              // biome-ignore lint/a11y/noNoninteractiveTabindex: WCAG 2.1.1, the keyboard reaches what scrolls.
              tabIndex={0}
              aria-label={story?.title ?? 'Geen verhaal'}
              className="relative min-h-0 flex-1 overflow-y-auto outline-focus [scrollbar-gutter:stable] focus-visible:-outline-offset-2 focus-visible:outline-2"
            >
              {story ? (
                <article className="max-w-4xl p-8">
                  <div className="mb-6 flex items-center gap-2">
                    <div className="min-w-0">
                      <p className="m-0 text-[11px] text-muted">{story.group}</p>
                      <h1 className="m-0 text-[18px] font-medium text-fg">{story.title}</h1>
                    </div>
                    <div className="ml-auto">
                      <CopyButton
                        text={() => location.href}
                        label="Kopieer link"
                        copiedLabel="Link gekopieerd"
                        failedLabel="Kopiëren mislukt"
                      />
                    </div>
                  </div>
                  {Object.entries(story.states).map(([caption, state]) => (
                    <section
                      key={caption}
                      data-docs-state={stateId(caption)}
                      aria-label={caption}
                      className="mb-8"
                    >
                      <p className="m-0 mb-2 text-[12px] text-muted">{caption}</p>
                      <StateFrame state={state} />
                    </section>
                  ))}
                </article>
              ) : (
                <p className="p-8 text-[13px] text-muted">Geen componenten</p>
              )}
            </main>
          )}
        </div>
      </div>
    </UiProvider>
  )
}
