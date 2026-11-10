import type { ReactNode } from 'react'
import {
  AppRail,
  AppRailItem,
  Avatar,
  Button,
  DropdownMenu,
  type FamilyProduct,
  Icon,
  IconButton,
  type IconName,
  OrbitWordmark,
  ProjectMark,
  SideNav,
  SideNavGroup,
  SideNavLink,
} from '../../../../src'

/** The made-up organisation every demo belongs to. */
export const WORKSPACE = 'Zilverberg'

/** The made-up repository most screens are about: a web shop. */
export const REPO = 'zilverberg/webwinkel'

/** The made-up person who is signed in. */
export const ME = 'Iris Kamphorst'

/** The colleagues of {@link ME}, made up too; the screens share them. */
export const PEOPLE = [
  'Daan Velthuis',
  'Mila Terhorst',
  'Sem Oudeweg',
  'Fenna Brouwsma',
  'Joris Lindeboom',
] as const

/**
 * A fixed moment instead of the clock, as the stories do: the screens read the same every day.
 * 20 October 2026, 14:00 UTC.
 */
export const NOW = Date.UTC(2026, 9, 20, 14, 0, 0)

/** Milliseconds in a minute, an hour and a day, for timestamps relative to {@link NOW}. */
export const MINUTE = 60_000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

/**
 * How long ago, in words as a sentence has them: "2 uur geleden", "gisteren". The short units of
 * `RelativeTime` ("2 u") are for narrow table cells; running text spells them out.
 */
export function ago(ms: number): string {
  if (ms < HOUR) return `${Math.max(1, Math.round(ms / MINUTE))} min geleden`
  if (ms < DAY) return `${Math.round(ms / HOUR)} uur geleden`
  const days = Math.round(ms / DAY)
  if (days === 1) return 'gisteren'
  if (days === 2) return 'eergisteren'
  return `${days} dagen geleden`
}

/** One place in an app's sidebar; `demo` is the slug of the demo that shows it, if one does. */
export interface Place {
  id: string
  label: string
  icon: IconName
  trailing?: string
  demo?: string
}

/** The places of Orbit, the desktop app for working with agents on a repository. */
export const ORBIT_PLACES: readonly Place[] = [
  { id: 'chat', label: 'Gesprekken', icon: 'messages-square', trailing: '2', demo: 'chat' },
  { id: 'review', label: 'Review', icon: 'scan-search', trailing: '2', demo: 'review' },
  { id: 'specs', label: 'Specs', icon: 'clipboard-list', demo: 'specs' },
  { id: 'branches', label: 'Branches', icon: 'git-branch', demo: 'branches' },
  { id: 'team', label: 'Team', icon: 'users', demo: 'team' },
  { id: 'gebruik', label: 'Gebruik', icon: 'sliders-horizontal', demo: 'gebruik' },
  { id: 'instellingen', label: 'Instellingen', icon: 'settings', demo: 'instellingen' },
]

/** The places of Halo, the platform that runs every branch of an app as its own space. */
export const HALO_PLACES: readonly Place[] = [
  { id: 'dashboard', label: 'Overzicht', icon: 'columns', demo: 'dashboard' },
  { id: 'apps', label: 'Apps', icon: 'rows', demo: 'apps' },
  { id: 'trail', label: 'Opnames', icon: 'camera', trailing: '2', demo: 'trail' },
  { id: 'logs', label: 'Logboek', icon: 'terminal' },
  { id: 'secrets', label: 'Geheimen', icon: 'lock' },
]

/** The props of {@link AppFrame}. */
export interface AppFrameProps {
  /** Which app's window this is: its name and places. */
  product: 'orbit' | 'halo'
  /** The id of the place that is open. */
  current: string
  /** The places, when the screen wants others than the product's own. */
  places?: readonly Place[]
  /** Something of the app's own under the places: the spaces of Halo, the projects of Orbit. */
  aside?: ReactNode
  children: ReactNode
}

/** The name of the app at the top of its sidebar: Orbit's wordmark, Halo's word and satellite. */
function AppName({ product }: { product: 'orbit' | 'halo' }): ReactNode {
  if (product === 'orbit') return <OrbitWordmark className="h-[15px] text-fg" />
  return (
    <span className="flex items-center gap-1 font-heading text-[15px] text-fg tracking-[-0.01em]">
      Halo
      <span aria-hidden="true" className="size-1.5 rounded-full bg-satellite" />
    </span>
  )
}

/** An app of the family on the rail, and the demo that shows it. */
interface App {
  id: string
  label: string
  icon: IconName
  product: FamilyProduct
  demo: string
}

/** The apps on the rail of every demo; Lens and Trail open the demo of their own screen. */
const APPS: readonly App[] = [
  { id: 'orbit', label: 'Orbit', icon: 'messages-square', product: 'orbit', demo: 'chat' },
  { id: 'halo', label: 'Halo', icon: 'layers', product: 'halo', demo: 'dashboard' },
  { id: 'lens', label: 'Lens', icon: 'scan-search', product: 'lens', demo: 'review' },
  { id: 'trail', label: 'Trail', icon: 'camera', product: 'trail', demo: 'trail' },
]

/**
 * Which item of the rail is open: the settings at its foot, the app whose screen this is (Lens
 * for the review, Trail for the recordings), or the product of the window.
 */
function openOnRail(product: 'orbit' | 'halo', current: string): string {
  if (current === 'instellingen') return 'instellingen'
  if (current === 'review') return 'lens'
  if (current === 'trail') return 'trail'
  return product
}

/**
 * The window the demos share, as the shell of the family (`docs/family-style.md`, "The shell"):
 * the rail of the apps and a top bar of 48px on the frame, and one floating plane with a 12px
 * corner at the top start and a hairline in `border-strong` above and at the start. In the plane
 * the side panel (`SideNav` on `bg-side-panel`, a hairline in `border` towards the content) and
 * the content on the canvas.
 *
 * It answers to the width of its frame (`@container`, which the demos page puts around every
 * screen), not of the browser: below 48rem the rail and the side panel fold away and the menu
 * in the top bar holds the places. A place that has a demo of its own opens that demo's block on
 * the page.
 */
export function AppFrame({
  product,
  current,
  places = product === 'orbit' ? ORBIT_PLACES : HALO_PLACES,
  aside,
  children,
}: AppFrameProps): ReactNode {
  const open = (id: string) => {
    const place = places.find((entry) => entry.id === id)
    if (place?.demo !== undefined && place.demo !== current) location.hash = `#/demo/${place.demo}`
  }
  const here = places.find((place) => place.id === current)
  const onRail = openOnRail(product, current)
  const app = product === 'orbit' ? 'Orbit' : 'Halo'
  return (
    <div
      data-nt-shell
      data-product={product}
      className="flex h-full min-h-0 w-full flex-col bg-frame"
    >
      <header
        data-nt-shell-top-bar
        className="flex h-12 shrink-0 items-center gap-3 ps-2 pe-3 @3xl:ps-5"
      >
        <span className="@3xl:hidden">
          <DropdownMenu
            trigger={<IconButton icon="panel-left" size="sm" label="Navigatie" />}
            label="Navigatie"
            align="start"
            items={places.map((place) => ({
              id: place.id,
              label: place.label,
              icon: place.icon,
              onSelect: () => open(place.id),
            }))}
          />
        </span>
        <AppName product={product} />
        <span aria-hidden="true" className="text-[13px] text-muted @3xl:hidden">
          /
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-fg @3xl:invisible">
          {here?.label ?? ''}
        </span>
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="sm" aria-label={`Account van ${ME}`}>
              <Avatar name={ME} size="sm" />
            </Button>
          }
          label="Account"
          align="end"
          items={[
            { id: 'profile', label: 'Profiel', icon: 'user' },
            { id: 'keys', label: 'Sneltoetsen', icon: 'keyboard' },
            { id: 'out', label: 'Uitloggen', icon: 'log-out', separated: true },
          ]}
        />
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="hidden @3xl:flex">
          <AppRail
            label={`Apps, ${here?.label ?? app}`}
            foot={
              <AppRailItem
                label="Instellingen"
                icon={<Icon name="settings" />}
                href="#/demo/instellingen"
                current={onRail === 'instellingen'}
                product="orbit"
              />
            }
          >
            {APPS.map((entry) => (
              <AppRailItem
                key={entry.id}
                label={entry.label}
                icon={<Icon name={entry.icon} />}
                href={`#/demo/${entry.demo}`}
                current={entry.id === onRail}
                product={entry.product}
              />
            ))}
          </AppRail>
        </div>
        <div
          data-nt-shell-plane
          className="flex min-h-0 min-w-0 flex-1 overflow-hidden border-t border-border-strong @3xl:ms-0.5 @3xl:rounded-ss-lg @3xl:border-s"
        >
          <div
            data-nt-shell-side
            className="hidden w-[244px] shrink-0 flex-col overflow-y-auto border-e border-border bg-side-panel @3xl:flex"
          >
            <SideNav
              label={`${app}, ${here?.label ?? 'navigatie'}`}
              head={
                <span className="flex min-w-0 items-center gap-2">
                  <ProjectMark name={WORKSPACE} />
                  <span className="min-w-0 truncate text-[13px] font-medium">{WORKSPACE}</span>
                </span>
              }
            >
              <SideNavGroup>
                {places.map((place) =>
                  place.demo === undefined ? (
                    // A place without a demo of its own is words, never a link to the screen
                    // that is already open.
                    <li
                      key={place.id}
                      className="flex h-(--nt-control-md) items-center px-2 text-[13px] text-secondary"
                    >
                      {place.label}
                    </li>
                  ) : (
                    <SideNavLink
                      key={place.id}
                      label={place.label}
                      href={`#/demo/${place.demo}`}
                      current={place.id === current}
                      {...(place.trailing === undefined ? {} : { meta: place.trailing })}
                    />
                  ),
                )}
              </SideNavGroup>
            </SideNav>
            {aside === undefined ? null : <div className="px-2 pb-4">{aside}</div>}
          </div>
          <div data-nt-shell-content className="flex min-h-0 min-w-0 flex-1 flex-col bg-canvas">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
