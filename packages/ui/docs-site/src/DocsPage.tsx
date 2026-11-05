import {
  type ComponentType,
  createElement,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  CopyButton,
  DropdownMenu,
  IconButton,
  OrbitWordmark,
  type Platform,
  PortalContainerProvider,
  ScrollArea,
  SearchList,
  type SearchListItem,
  type SearchListLabels,
  SegmentedControl,
  UiProvider,
} from '../../src'
import { type Story, stateId, storyId } from '../../src/gallery'
import { DEMO_PREFIX, DemoGallery, demoSlugOf, demoTitleOf } from './demo-kit/DemoViews'
import { Home } from './Home'
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

/** Where the page keeps the chosen theme, so a reload keeps it; per viewer, never required. */
const THEME_KEY = 'orbit-ui-docs-theme'

/** The theme of the last visit, or dark: storage may be missing or throw (a private window). */
function storedTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/** The groups of the catalogue in the page's language: a quiet eyebrow, not a folder name. */
const GROUP_LABEL: Record<Story['group'], string> = {
  primitives: 'Bouwstenen',
  overlays: 'Lagen',
  patterns: 'Patronen',
  features: 'Schermen',
}

/**
 * Keeps a click on the page's own switches from touching the story under them: no focus moves
 * (a menu or a text selection of the story stays as it is) and the press never reaches the
 * document, where an open layer would read it as a click outside and close. The keyboard still
 * reaches the switches as ever.
 */
const KEEP_STORY_STATE = {
  onMouseDown: (event: { preventDefault(): void }) => event.preventDefault(),
  onPointerDown: (event: { stopPropagation(): void }) => event.stopPropagation(),
}

/** The products of the family, whose satellite `tokens.css` picks with `data-product`. */
type Product = 'orbit' | 'halo' | 'fold'

const PRODUCT_OPTIONS = [
  { value: 'orbit', label: 'Orbit' },
  { value: 'halo', label: 'Halo' },
  { value: 'fold', label: 'Fold' },
] as const

/** The parts of the page: the start, one component at a time, or whole screens built from them. */
type Mode = 'home' | 'components' | 'demos'

const MODE_OPTIONS = [
  { value: 'home', label: 'Start' },
  { value: 'components', label: 'Componenten' },
  { value: 'demos', label: "Demo's" },
] as const

/** Mac and Windows only: Linux draws its keys the way Windows does. */
const PLATFORM_OPTIONS = [
  { value: 'mac', label: 'macOS' },
  { value: 'windows', label: 'Windows' },
] as const

/** Whether a hash is the root of the site, which opens the home page: none, `#` or `#/`. */
export function isHomeHash(hash: string): boolean {
  return hash === '' || hash === '#' || hash === PREFIX
}

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

/** A floating layer of a story: a menu, a popover, a listbox that stands open in the picture. */
const FLOATING = '[data-radix-popper-content-wrapper]'

/**
 * Tab leaves a floating layer of a story as it leaves any other part of the page: the layer's own
 * handling (a menu swallows Tab, a popover's focus scope loops it) is stopped on its way down, and
 * the browser moves the focus on. The layer closes as the focus leaves it, as it would on a click
 * beside it, so a keyboard user is never held in a picture.
 */
function leaveLayerOnTab(event: KeyboardEvent<HTMLElement>): void {
  if (event.key !== 'Tab') return
  if (event.target instanceof Element && event.target.closest(FLOATING) !== null) {
    event.stopPropagation()
  }
}

/**
 * A story whose layer opens as it mounts shows it open, but does not take the focus with it: in
 * the first second after mounting, and before the reader has pressed a key or the pointer, a focus
 * that lands in a floating layer of the state is let go again (to the page's start, where a fresh
 * load has it). Escape still closes the layer, and its trigger takes the focus then.
 */
function useQuietLayers(frame: HTMLElement | null): void {
  useEffect(() => {
    if (frame === null) return
    let touched = false
    const touch = () => {
      touched = true
    }
    const release = (target: EventTarget | null) => {
      if (touched || !(target instanceof HTMLElement)) return
      if (target.closest(FLOATING) === null) return
      queueMicrotask(() => {
        if (document.activeElement === target) target.blur()
      })
    }
    const onFocus = (event: FocusEvent) => release(event.target)
    const settle = () => {
      if (frame.contains(document.activeElement)) release(document.activeElement)
    }
    window.addEventListener('keydown', touch, true)
    window.addEventListener('pointerdown', touch, true)
    frame.addEventListener('focusin', onFocus)
    const frameId = requestAnimationFrame(settle)
    const stop = setTimeout(() => {
      frame.removeEventListener('focusin', onFocus)
    }, 1000)
    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(stop)
      window.removeEventListener('keydown', touch, true)
      window.removeEventListener('pointerdown', touch, true)
      frame.removeEventListener('focusin', onFocus)
    }
  }, [frame])
}

/**
 * The box one state of a story stands in (no frame: its caption and the space between states
 * group it, the Law of Proximity), which is also the container of its floating
 * layers.
 *
 * One container per state rather than one for the stage, as Orbit's gallery has: a layer without
 * an anchor (the open `MentionList`) then lands under its own caption instead of at the foot of
 * the page. The state is mounted as a component, never called, since it may hold hooks of its own.
 */
function StateFrame({ state }: { state: ComponentType }): ReactNode {
  const [frame, setFrame] = useState<HTMLElement | null>(null)
  useQuietLayers(frame)
  return (
    <div ref={setFrame} className="relative" onKeyDownCapture={leaveLayerOnTab}>
      <PortalContainerProvider container={frame}>{createElement(state)}</PortalContainerProvider>
    </div>
  )
}

/** The name of the site, the satellite beside it, as a link to the home page. */
function HomeLink(): ReactNode {
  return (
    <a
      href={PREFIX}
      aria-label="Orbit UI, naar de start"
      className="flex items-center gap-2 rounded-sm text-fg no-underline outline-focus focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <OrbitWordmark className="h-4 text-fg" />
      <span className="text-[13px] text-muted">UI</span>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-satellite" />
    </a>
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
 * The root (`#/`, or no hash) opens the home page (`Home`): what the library is, the install line,
 * a mosaic of live components and demos, and the ways in. The third tab, "Demo's", is one page of blocks: whole screens built from the components, each
 * in a frame of its own, and the wishlist of what they lack; `#/demo/<slug>` scrolls to a block
 * (see `demo-kit/`). It has no sidebar, so the docs' navigation never stands beside a screen's own.
 * Both tabs keep their place in state, so switching back returns to the story or demo that was
 * open. Below 768px the list of components folds behind a button in the header.
 */
export function DocsPage({ stories }: DocsPageProps): ReactNode {
  const hash = useHash()
  const [theme, setTheme] = useState<Theme>(storedTheme)
  const [product, setProduct] = useState<Product>('orbit')
  const [platform, setPlatform] = useState<Platform>('mac')
  const shortcuts = useMemo(() => docsShortcuts(platform), [platform])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // A private window: the theme simply lasts until the reload.
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.product = product
  }, [product])

  const [navOpen, setNavOpen] = useState(false)
  const demoSlug = demoSlugOf(hash)
  const mode: Mode = isHomeHash(hash) ? 'home' : demoSlug === undefined ? 'components' : 'demos'

  const chosenId = idOf(hash)
  const story = stories.find((entry) => storyId(entry) === chosenId) ?? stories[0]
  const currentId = story ? storyId(story) : undefined

  // The title says where the reader is, so a tab, the history and a screen reader tell the routes
  // apart (WCAG 2.4.2): "StatusMark · Bouwstenen · Orbit UI", "Team en rechten · Demo's · Orbit UI".
  const where =
    mode === 'demos'
      ? [demoTitleOf(demoSlug), "Demo's"]
      : mode === 'home' || story === undefined
        ? []
        : [story.title, GROUP_LABEL[story.group]]
  const title = [...where.filter((part) => part !== undefined), 'Orbit UI'].join(' · ')
  useEffect(() => {
    document.title = title
  }, [title])
  // A story opens at its title. A state that takes the focus as it mounts (an active tab, a
  // field) or a layer that opens would scroll the stage down to itself, and the reader would land
  // mid-page; the stage goes back to the top once the states have settled, keeping their focus.
  const stage = useRef<HTMLElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new story is what resets the stage.
  useEffect(() => {
    const top = () => stage.current?.scrollTo?.({ top: 0 })
    top()
    const frame = requestAnimationFrame(top)
    const later = setTimeout(top, 150)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(later)
    }
  }, [currentId])

  // Where each tab was, so the tabs return to it rather than to its first entry.
  const [lastStory, setLastStory] = useState<string | undefined>(chosenId)
  const [lastDemo, setLastDemo] = useState<string | undefined>(demoSlug)
  useEffect(() => {
    if (mode === 'components' && chosenId) setLastStory(chosenId)
    if (mode === 'demos') setLastDemo(demoSlug === '' ? undefined : demoSlug)
  }, [mode, chosenId, demoSlug])

  const switchMode = (next: Mode) => {
    location.hash =
      next === 'home'
        ? PREFIX
        : next === 'demos'
          ? lastDemo === undefined
            ? '#/demo'
            : `${DEMO_PREFIX}${lastDemo}`
          : `${PREFIX}${lastStory ?? (stories[0] ? storyId(stories[0]) : '')}`
  }

  const items = useMemo<SearchListItem[]>(
    () =>
      stories.map((entry) => ({
        id: storyId(entry),
        label: entry.title,
        group: GROUP_LABEL[entry.group],
        keywords: [entry.group, GROUP_LABEL[entry.group], ...Object.keys(entry.states)],
      })),
    [stories],
  )

  return (
    <UiProvider shortcuts={shortcuts} platform={platform} theme={theme} locale="nl-NL">
      <div className="flex h-dvh bg-frame text-fg">
        {mode === 'components' && navOpen ? (
          <button
            type="button"
            aria-label="Sluit de lijst"
            tabIndex={-1}
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-30 bg-scrim md:hidden"
          />
        ) : null}
        {mode === 'components' ? (
          <nav
            aria-label="Componenten"
            className={`${navOpen ? 'fixed inset-y-0 left-0 z-40 flex shadow-menu' : 'hidden'} w-64 shrink-0 flex-col bg-frame bg-(image:--nt-sidebar-gradient) md:static md:z-auto md:flex md:shadow-frame-edge`}
          >
            <div className="flex h-12 shrink-0 items-center px-4">
              <HomeLink />
            </div>
            <div className="min-h-0 flex-1">
              <ScrollArea>
                <div className="px-2 pb-2">
                  <SearchList
                    items={items}
                    selectedId={currentId ?? null}
                    onSelect={(id) => {
                      setNavOpen(false)
                      location.hash = `${PREFIX}${id}`
                    }}
                    label="Zoek een component"
                    labels={LIST_LABELS}
                    checkSlot={false}
                  />
                </div>
              </ScrollArea>
            </div>
          </nav>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col bg-canvas">
          <header className="flex h-12 shrink-0 items-center gap-2 border-border border-b px-4 sm:gap-3">
            {mode === 'components' ? (
              <div className="md:hidden">
                <IconButton
                  icon="panel-left"
                  size="sm"
                  label="Componenten"
                  aria-expanded={navOpen}
                  onClick={() => setNavOpen((open) => !open)}
                />
              </div>
            ) : (
              <div className="hidden items-center pr-1 sm:flex">
                <HomeLink />
              </div>
            )}
            <SegmentedControl<Mode>
              label="Weergave"
              size="sm"
              value={mode}
              options={MODE_OPTIONS}
              onValueChange={switchMode}
            />
            <div className="flex-1" />
            <div className="flex items-center gap-2 sm:gap-3" {...KEEP_STORY_STATE}>
              <div className="hidden lg:block">
                <SegmentedControl<Platform>
                  label="Platform"
                  size="sm"
                  value={platform}
                  options={PLATFORM_OPTIONS}
                  onValueChange={setPlatform}
                />
              </div>
              <div className="hidden sm:block">
                <SegmentedControl<Product>
                  label="Product"
                  size="sm"
                  value={product}
                  options={PRODUCT_OPTIONS}
                  onValueChange={setProduct}
                />
              </div>
              <div className="sm:hidden">
                <DropdownMenu
                  label="Product"
                  align="end"
                  trigger={
                    <button
                      type="button"
                      aria-label={`Product: ${PRODUCT_OPTIONS.find((option) => option.value === product)?.label ?? ''}`}
                      className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-secondary outline-focus hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      {/* The satellite beside the product's name, never on its own. */}
                      <span aria-hidden="true">
                        {PRODUCT_OPTIONS.find((option) => option.value === product)?.label ?? ''}
                      </span>
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-satellite" />
                    </button>
                  }
                  items={PRODUCT_OPTIONS.map((option) => ({
                    id: option.value,
                    label: option.label,
                    kind: 'radio' as const,
                    group: 'product',
                    checked: option.value === product,
                    onSelect: () => setProduct(option.value),
                  }))}
                />
              </div>
              <SegmentedControl<Theme>
                label="Thema"
                size="sm"
                value={theme}
                options={THEME_OPTIONS}
                onValueChange={setTheme}
              />
            </div>
          </header>
          {mode === 'home' ? (
            <main
              aria-label="Start"
              className="relative min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]"
            >
              <Home stories={stories} />
            </main>
          ) : mode === 'demos' ? (
            <main
              aria-label="Demo's"
              className="relative min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]"
            >
              <DemoGallery slug={demoSlug} stories={stories} />
            </main>
          ) : (
            <main
              ref={stage}
              key={currentId ?? 'empty'}
              // The stage scrolls, so the keyboard needs a stop on it (axe scrollable-region-focusable).
              // biome-ignore lint/a11y/noNoninteractiveTabindex: WCAG 2.1.1, the keyboard reaches what scrolls.
              tabIndex={0}
              aria-label={story?.title ?? 'Geen verhaal'}
              className="relative min-h-0 flex-1 overflow-y-auto outline-focus [scrollbar-gutter:stable] focus-visible:-outline-offset-2 focus-visible:outline-2"
            >
              {story ? (
                <article className="max-w-4xl p-4 sm:p-8">
                  <div className="mb-6 flex flex-col gap-1">
                    <p className="m-0 text-[12px] text-muted">{GROUP_LABEL[story.group]}</p>
                    <div className="flex items-center gap-1.5">
                      <h1 className="m-0 min-w-0 font-medium text-[20px] text-fg">{story.title}</h1>
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
                      className="mb-10"
                    >
                      <h2 className="m-0 mb-2 font-normal text-[12px] text-muted">{caption}</h2>
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
