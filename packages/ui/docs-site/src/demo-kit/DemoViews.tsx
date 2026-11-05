import { createElement, type ReactNode, useEffect, useId, useRef, useState } from 'react'
import {
  EmptyState,
  PortalContainerProvider,
  Prose,
  SegmentedControl,
  Switch,
  Tag,
} from '../../../src'
import { galleryLabels, type Story, storyId } from '../../../src/gallery'
import { MISSING, MissingMarks } from './Missing'
import {
  DEMOS,
  type DemoInventory,
  inventoryOf,
  missingOverview,
  OVERVIEW_SLUG,
  sourceOf,
} from './registry'
import type { Demo } from './types'

/** Prefix of the hash route of a demo: `#/demo/betalingen`. */
export const DEMO_PREFIX = '#/demo/'

/** The slug in a demo hash, or undefined for a hash that is not one. */
export function demoSlugOf(hash: string): string | undefined {
  if (hash === '#/demo') return ''
  return hash.startsWith(DEMO_PREFIX)
    ? decodeURIComponent(hash.slice(DEMO_PREFIX.length))
    : undefined
}

/** Old slugs that still lead somewhere: the Specs demo was once `taken`. */
const RENAMED: Readonly<Record<string, string>> = { taken: 'specs' }

/** The slug the page scrolls to for a hash: a known demo, the overview, or the first demo. */
export function shownSlug(slug: string | undefined): string {
  if (slug === OVERVIEW_SLUG) return slug
  const known = slug === undefined ? undefined : (RENAMED[slug] ?? slug)
  return DEMOS.find((demo) => demo.slug === known)?.slug ?? DEMOS[0]?.slug ?? OVERVIEW_SLUG
}

/** The id of a block on the page, which a hash scrolls to. */
export function blockId(slug: string): string {
  return `demo-${slug}`
}

/** The widths a preview can take: the window's own, a tablet's and a phone's. */
type Viewport = 'desktop' | 'tablet' | 'mobile'

const VIEWPORTS = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'mobile', label: 'Mobiel' },
] as const

/** The width of the frame per viewport; the screens answer to it with container queries. */
const WIDTH: Record<Viewport, string> = {
  desktop: 'w-full',
  tablet: 'w-[820px] max-w-full',
  mobile: 'w-[390px] max-w-full',
}

type View = 'preview' | 'code'

const VIEWS = [
  { value: 'preview', label: 'Voorbeeld' },
  { value: 'code', label: 'Code' },
] as const

/** The names of the products, as the mark beside a block's title says them. */
const PRODUCT_NAME = { orbit: 'Orbit', halo: 'Halo', fold: 'Fold' } as const

/** The story of a component, to link a name in the lists to its page on the components tab. */
function storyHref(stories: readonly Story[], name: string): string | undefined {
  const story = stories.find((entry) => entry.title === name)
  return story ? `#/${storyId(story)}` : undefined
}

/** The strip under a block: what it is made of, and what it had to draw as missing. */
function Inventory({
  inventory,
  stories,
}: {
  inventory: DemoInventory
  stories: readonly Story[]
}): ReactNode {
  return (
    <div className="flex flex-col gap-1 px-1 text-[12px]">
      <div className="flex items-baseline gap-3">
        <span className="w-20 shrink-0 text-muted">{`Gebruikt ${inventory.used.length}`}</span>
        {/* Every name a 24px target (WCAG 2.5.8): rows of links that never touch on a phone. */}
        <ul aria-label="Gebruikt" className="m-0 flex list-none flex-wrap gap-x-1 p-0">
          {inventory.used.map((name) => {
            const href = storyHref(stories, name)
            return (
              <li key={name} className="flex min-h-6 items-center text-secondary">
                {href === undefined ? (
                  // The inset of a link, so a wrapped line starts on the edge of the first.
                  <span className="px-1">{name}</span>
                ) : (
                  <a
                    href={href}
                    className="inline-flex min-h-6 items-center rounded-sm px-1 text-secondary no-underline outline-focus hover:text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {name}
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      </div>
      {inventory.missing.length === 0 ? null : (
        <div className="flex items-baseline gap-3">
          <span className="w-20 shrink-0 text-muted">{`Ontbreekt ${inventory.missing.length}`}</span>
          <ul aria-label="Ontbreekt" className="m-0 flex list-none flex-wrap gap-x-1 p-0">
            {inventory.missing.map((name) => (
              <li key={name}>
                <a
                  href={`${DEMO_PREFIX}${OVERVIEW_SLUG}`}
                  title={MISSING[name]}
                  className="inline-flex min-h-6 items-center rounded-sm px-1 font-mono text-[11px] text-accent-text no-underline outline-focus hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** How far a screen's headings sit below the page's: the page's `h1`, then a block's `h2`. */
const HEADING_OFFSET = 2

/**
 * Sets every heading inside a demo's window one outline level under its block: a screen's own `h1`
 * ("Team") is announced as a level 3 under the block's `h2` ("Team en rechten"), its `h2` as 4, and
 * so on to 6, so the page keeps one `h1` and heading navigation runs page, block, screen. The
 * screens and the library's components keep their own elements, which is what they are in an app;
 * `aria-level` says where they stand on this page. Kept up as a screen changes (a state, a width).
 */
function useHeadingOffset(frame: HTMLElement | null): void {
  useEffect(() => {
    if (frame === null) return
    const apply = () => {
      for (const heading of frame.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6')) {
        const level = String(Math.min(6, Number(heading.tagName.slice(1)) + HEADING_OFFSET))
        if (heading.getAttribute('aria-level') !== level) heading.setAttribute('aria-level', level)
      }
    }
    apply()
    const watch = new MutationObserver(apply)
    watch.observe(frame, { childList: true, subtree: true })
    return () => watch.disconnect()
  }, [frame])
}

/**
 * The window a screen stands in: its own container for the screen's container queries and for
 * the floating layers it opens, so a dialog covers the window, not the page. A dialog's layers
 * are `fixed`; the frame's transform (`transform-gpu`) makes it their containing block. The
 * frame sets the 13px body text of Orbit's window, which a setting's label inherits.
 */
function PreviewFrame({ demo, variant }: { demo: Demo; variant: string | undefined }): ReactNode {
  const [frame, setFrame] = useState<HTMLElement | null>(null)
  useHeadingOffset(frame)
  return (
    <div
      ref={setFrame}
      data-demo={demo.slug}
      data-product={demo.product ?? 'orbit'}
      className="@container relative flex h-full min-h-0 w-full min-w-0 transform-gpu overflow-hidden bg-canvas text-[13px] text-fg"
    >
      <PortalContainerProvider container={frame}>
        {createElement(demo.Screen, variant === undefined ? {} : { variant })}
      </PortalContainerProvider>
    </div>
  )
}

/** The window a thumbnail draws a demo in, before it is scaled down to its card. */
const THUMB_WIDTH = 1280
const THUMB_HEIGHT = 800

/**
 * A demo drawn small, as the home page shows it: the real screen at a desktop window's size,
 * scaled down to the width of its box. It is a picture of the screen, not a working one: `inert`
 * keeps its fields and links out of the keyboard's path and out of the accessibility tree; the card
 * around it carries the one link to the demo.
 *
 * The scale follows the box (`ResizeObserver`); where there is none (happy-dom), it stays at the
 * size of the smallest card.
 */
export function DemoThumbnail({
  demo,
  variant,
}: {
  demo: Demo
  variant?: string | undefined
}): ReactNode {
  const [box, setBox] = useState<HTMLElement | null>(null)
  const [scale, setScale] = useState(0.25)
  useEffect(() => {
    if (!box || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / THUMB_WIDTH)
    })
    observer.observe(box)
    return () => observer.disconnect()
  }, [box])
  return (
    <div ref={setBox} className="relative aspect-[16/10] w-full overflow-hidden">
      <div
        inert
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 origin-top-left select-none"
        style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT, transform: `scale(${scale})` }}
      >
        <PreviewFrame demo={demo} variant={variant ?? demo.variants?.[0]?.value} />
      </div>
    </div>
  )
}

/** The source of a demo, as the code view shows it. */
function CodeView({ demo }: { demo: Demo }): ReactNode {
  const fence = `\`\`\`tsx\n${sourceOf(demo.slug).trimEnd()}\n\`\`\``
  return (
    <section
      // biome-ignore lint/a11y/noNoninteractiveTabindex: WCAG 2.1.1, the keyboard reaches what scrolls.
      tabIndex={0}
      aria-label={`Code van ${demo.title}`}
      className="h-full overflow-auto bg-canvas p-4 outline-focus focus-visible:-outline-offset-2 focus-visible:outline-2"
    >
      <Prose labels={galleryLabels.prose} markdown={fence} />
    </section>
  )
}

/**
 * One demo as a block: its title and sentence, the switches of the block (state, preview or code,
 * width), the framed screen, and what it is made of underneath.
 *
 * The lists come from the demo's source (`inventoryOf`), so they cannot disagree with the screen.
 */
export function DemoBlock({ demo, stories }: { demo: Demo; stories: readonly Story[] }): ReactNode {
  const titleId = useId()
  const [view, setView] = useState<View>('preview')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [variant, setVariant] = useState<string | undefined>(demo.variants?.[0]?.value)
  const product = demo.product ?? 'orbit'
  return (
    <section
      id={blockId(demo.slug)}
      aria-labelledby={titleId}
      data-demo-block={demo.slug}
      className="flex scroll-mt-20 flex-col gap-3"
    >
      <header className="flex flex-wrap items-end gap-x-6 gap-y-3 px-1">
        <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h2
              id={titleId}
              tabIndex={-1}
              data-demo-heading
              className="m-0 font-heading text-[20px] text-fg tracking-[-0.01em] outline-none"
            >
              {demo.title}
            </h2>
            <span data-product={product} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-satellite" />
              <span className="text-[12px] text-muted">{PRODUCT_NAME[product]}</span>
            </span>
          </div>
          <p className="m-0 max-w-2xl text-pretty text-[13px] text-secondary leading-relaxed">
            {demo.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {demo.variants && variant !== undefined ? (
            <SegmentedControl<string>
              label={`Toestand van ${demo.title}`}
              size="sm"
              value={variant}
              options={demo.variants}
              onValueChange={setVariant}
            />
          ) : null}
          <SegmentedControl<View>
            label={`Weergave van ${demo.title}`}
            size="sm"
            value={view}
            options={VIEWS}
            onValueChange={setView}
          />
          <div className="hidden lg:block">
            <SegmentedControl<Viewport>
              label={`Breedte van ${demo.title}`}
              size="sm"
              value={viewport}
              options={VIEWPORTS}
              onValueChange={setViewport}
            />
          </div>
        </div>
      </header>
      <div className="flex justify-center rounded-xl border border-border bg-frame bg-[radial-gradient(var(--nt-border)_1px,transparent_1px)] bg-size-[18px_18px] p-2 sm:p-3">
        <div
          className={`h-[clamp(520px,calc(100dvh-220px),780px)] overflow-hidden rounded-lg border border-border shadow-menu transition-[width] duration-(--nt-duration) ease-(--nt-ease) motion-reduce:transition-none ${view === 'code' ? 'w-full' : WIDTH[viewport]}`}
        >
          {view === 'code' ? (
            <CodeView demo={demo} />
          ) : (
            <PreviewFrame demo={demo} variant={variant} />
          )}
        </div>
      </div>
      <Inventory inventory={inventoryOf(demo.slug)} stories={stories} />
    </section>
  )
}

/**
 * The wishlist: every component a demo had to mark as missing, why it is wanted, and where.
 *
 * Sorted by the number of demos that miss it, so the first card is the one to build first. When
 * nothing is missing any more it says so in one calm line, the good end of the list (Peak–End).
 */
export function MissingOverview(): ReactNode {
  const entries = missingOverview()
  const listId = useId()
  const titleId = useId()
  return (
    <section
      id={blockId(OVERVIEW_SLUG)}
      aria-labelledby={titleId}
      // As tall as the window under the strip: the last block of the page can still scroll to
      // the top, so a link to the wishlist opens on the wishlist and not on the end of Team.
      className="flex min-h-[calc(100dvh-5rem)] scroll-mt-20 flex-col gap-4"
    >
      <div className="flex flex-col gap-1 px-1">
        <h2
          id={titleId}
          tabIndex={-1}
          data-demo-heading
          className="m-0 font-heading text-[20px] text-fg tracking-[-0.01em] outline-none"
        >
          Wensenlijst
        </h2>
        <p className="m-0 max-w-2xl text-[13px] text-secondary leading-relaxed">
          {entries.length === 0
            ? 'Een demo die iets mist, tekent het na met een stippellijn; dat komt dan hier op de lijst.'
            : `${entries.length === 1 ? '1 component ontbreekt' : `${entries.length} componenten ontbreken`} in ${DEMOS.length} demo's. Bovenaan staat wat de meeste schermen missen: dat bouwen we het eerst.`}
        </p>
      </div>
      {entries.length === 0 ? (
        <div className="mx-1 rounded-xl bg-plane py-4 shadow-plane">
          <EmptyState
            icon="check-circle"
            title="Er ontbreekt niets"
            description={`Alle ${DEMOS.length} demo's zijn gebouwd uit de componenten van de bibliotheek.`}
          />
        </div>
      ) : (
        <ul
          id={listId}
          aria-label="Ontbrekende componenten"
          className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2 xl:grid-cols-3"
        >
          {entries.map((entry, index) => (
            <li
              key={entry.name}
              aria-labelledby={`${listId}-${entry.name}`}
              className="flex flex-col gap-2 rounded-lg bg-overlay p-4 shadow-plane"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3
                  id={`${listId}-${entry.name}`}
                  className="m-0 font-medium font-mono text-[13px] text-accent-text"
                >
                  {entry.name}
                </h3>
                <span className="ml-auto">
                  <Tag>{entry.demos.length === 1 ? '1 demo' : `${entry.demos.length} demo's`}</Tag>
                </span>
              </div>
              <p className="m-0 flex-1 text-[13px] text-secondary leading-relaxed">
                {entry.reason}
              </p>
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
      )}
    </section>
  )
}

/** The entries of the jump bar: every demo, then the wishlist. */
const JUMPS = [
  ...DEMOS.map(({ slug, title }) => ({ slug, title })),
  { slug: OVERVIEW_SLUG, title: 'Wensenlijst' },
]

/** The name of the block a demo hash leads to, for the page's title: "Team en rechten". */
export function demoTitleOf(slug: string | undefined): string | undefined {
  if (slug === undefined || slug === '') return undefined
  const shown = shownSlug(slug)
  return JUMPS.find((jump) => jump.slug === shown)?.title
}

/**
 * The demos tab: an introduction on the brand's galaxy, a bar to jump to a block, every demo as a
 * block, and the wishlist at the end.
 *
 * One page rather than one demo at a time, as a catalogue of blocks is read: the page keeps a
 * single navigation (the bar), and a screen's own sidebar lives inside its frame. The hash names a
 * block (`#/demo/betalingen`), and the page scrolls to it.
 */
export function DemoGallery({
  slug,
  stories,
}: {
  slug: string | undefined
  stories: readonly Story[]
}): ReactNode {
  const [marks, setMarks] = useState(true)
  const target = slug === undefined || slug === '' ? undefined : shownSlug(slug)
  // The page scrolls to the chosen block and the focus goes to its heading, so the next Tab
  // continues in that demo rather than at the top of the page (a hash change moves no focus).
  useEffect(() => {
    if (target === undefined) return
    const block = document.getElementById(blockId(target))
    block?.scrollIntoView?.({ block: 'start' })
    block?.querySelector<HTMLElement>('[data-demo-heading]')?.focus({ preventScroll: true })
  }, [target])
  const missingCount = missingOverview().length
  // On a narrow window the strip scrolls sideways: the chip of the block in view is brought into
  // it, so the reader always sees where they are (Serial Position).
  const strip = useRef<HTMLUListElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: `target` moves the current chip, which the effect reads from the DOM.
  useEffect(() => {
    const list = strip.current
    const chip = list?.querySelector<HTMLElement>('[aria-current]')
    if (!list || !chip || list.scrollWidth <= list.clientWidth) return
    const left = chip.offsetLeft - list.offsetLeft
    if (left < list.scrollLeft || left + chip.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollLeft = Math.max(0, left - (list.clientWidth - chip.offsetWidth) / 2)
    }
  }, [target])
  return (
    <MissingMarks value={marks}>
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-14 px-4 pt-6 pb-24 sm:px-8 sm:pt-8">
        <div className="relative overflow-hidden rounded-xl bg-(image:--nt-brand-gradient) px-6 py-8 text-(--nt-brand-paper) sm:px-10 sm:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-48 -right-28 size-[30rem] rounded-full border border-(--nt-brand-mist)/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-28 -right-6 hidden size-72 rounded-full border border-(--nt-brand-mist)/20 md:block"
          >
            <span className="absolute top-[85.4%] left-[14.6%] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-satellite shadow-[0_0_14px_3px_var(--nt-satellite)]" />
          </div>
          <div className="relative flex max-w-2xl flex-col gap-3">
            <p className="m-0 text-(--nt-brand-slate) text-[12px] font-medium">Demo&apos;s</p>
            <h1 className="m-0 font-heading text-[20px] leading-tight tracking-[-0.01em]">
              Hele schermen uit de Orbit-familie
            </h1>
            <p className="m-0 text-(--nt-brand-mist) text-[15px] leading-relaxed opacity-85">
              {`${DEMOS.length} schermen van Orbit en Halo, gebouwd uit de componenten van deze bibliotheek. Elk scherm past zich aan zijn breedte aan en de code staat ernaast.${missingCount === 0 ? '' : ` Wat nog ontbreekt is nagetekend en gemarkeerd: ${missingCount === 1 ? '1 component' : `${missingCount} componenten`} op de wensenlijst.`}`}
            </p>
          </div>
        </div>
        <nav
          aria-label="Naar een demo"
          className="sticky top-0 z-20 -mx-4 -my-8 flex items-center gap-3 border-border border-b bg-canvas/90 py-1.5 pr-4 pl-1 backdrop-blur-md sm:-mx-8 sm:pr-8 sm:pl-5 xl:pl-8"
        >
          {/* Wraps on a wide window, so every chip is in sight; scrolls on a narrow one, with a fade
              at both ends that says there is more, the first chip at rest on the gutter. */}
          <ul
            ref={strip}
            className="m-0 flex min-w-0 flex-1 list-none gap-1 overflow-x-auto py-1 pr-8 pl-3.5 xl:pr-0 xl:pl-0.5 [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-32px),transparent)] [scrollbar-width:none] xl:flex-wrap xl:overflow-visible xl:[mask-image:none]"
          >
            {JUMPS.map((jump) => (
              <li key={jump.slug} className="shrink-0">
                <a
                  href={`${DEMO_PREFIX}${jump.slug}`}
                  aria-current={jump.slug === target ? 'location' : undefined}
                  className="flex h-7 items-center rounded-full border border-border px-2.5 text-[12px] text-secondary no-underline outline-focus hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 aria-[current=location]:border-border-strong aria-[current=location]:bg-surface-active aria-[current=location]:text-fg"
                >
                  {jump.title}
                </a>
              </li>
            ))}
          </ul>
          {missingCount === 0 ? null : (
            <div className="flex shrink-0 items-center gap-2 border-border border-l pl-3 text-[12px] text-secondary">
              <Switch label="Markeer ontbrekend" checked={marks} onCheckedChange={setMarks} />
              <span aria-hidden="true" className="hidden sm:inline">
                Markeer ontbrekend
              </span>
            </div>
          )}
        </nav>
        {DEMOS.map((demo) => (
          <DemoBlock key={demo.slug} demo={demo} stories={stories} />
        ))}
        <MissingOverview />
      </div>
    </MissingMarks>
  )
}
