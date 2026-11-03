import { type ReactNode, useState } from 'react'
import {
  Avatar,
  DropdownMenu,
  Icon,
  IconButton,
  type IconName,
  OrbitWordmark,
  ProjectMark,
  SearchList,
  type SearchListItem,
  type SearchListLabels,
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

const LABELS: SearchListLabels = {
  empty: 'Niets',
  noResults: (query) => `Geen treffers voor ‘${query}’`,
  loading: 'Laden…',
  error: 'Kon de lijst niet laden',
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
  { id: 'chat', label: 'Gesprekken', icon: 'messages-square', trailing: '3', demo: 'chat' },
  { id: 'review', label: 'Review', icon: 'scan-search', trailing: '2', demo: 'review' },
  { id: 'taken', label: 'Specs', icon: 'clipboard-list', demo: 'taken' },
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
    <span className="flex items-center gap-1 font-heading text-[16px] text-fg tracking-[-0.01em]">
      Halo
      <span aria-hidden="true" className="size-1.5 rounded-full bg-satellite" />
    </span>
  )
}

/**
 * The window the demos share: a sidebar with the app, the workspace, the places and the person,
 * and the screen beside it.
 *
 * It answers to the width of its frame (`@container`, which the demos page puts around every
 * screen), not of the browser: below 48rem the sidebar folds into a bar at the top whose menu
 * holds the places. A place that has a demo of its own opens that demo's block on the page.
 */
export function AppFrame({
  product,
  current,
  places = product === 'orbit' ? ORBIT_PLACES : HALO_PLACES,
  aside,
  children,
}: AppFrameProps): ReactNode {
  const [selected, setSelected] = useState(current)
  const open = (id: string) => {
    setSelected(id)
    const place = places.find((entry) => entry.id === id)
    if (place?.demo !== undefined && place.demo !== current) location.hash = `#/demo/${place.demo}`
  }
  const items: SearchListItem[] = places.map(({ id, label, icon, trailing }) => ({
    id,
    label,
    icon,
    ...(trailing === undefined ? {} : { trailing }),
  }))
  const here = places.find((place) => place.id === current)
  return (
    <div className="flex h-full min-h-0 w-full flex-col @3xl:flex-row">
      <div className="hidden w-60 shrink-0 flex-col bg-frame bg-(image:--nt-sidebar-gradient) @3xl:flex">
        <div className="flex h-12 shrink-0 items-center px-4">
          <AppName product={product} />
        </div>
        <div className="mx-2 mb-4 flex h-(--nt-control-md) items-center gap-2 rounded-md px-2 hover:bg-row-hover">
          <ProjectMark name={WORKSPACE} />
          <span className="min-w-0 flex-1 truncate text-[13px] text-fg">{WORKSPACE}</span>
          <Icon name="chevrons-up-down" size="sm" tone="faint" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2">
          <SearchList
            items={items}
            selectedId={selected}
            onSelect={open}
            label="Navigatie"
            labels={LABELS}
            searchable={false}
            checkSlot={false}
          />
          {aside}
        </div>
        <div className="flex h-14 shrink-0 items-center gap-2 px-4">
          <Avatar name={ME} size="sm" />
          <span className="min-w-0 flex-1 truncate text-[12px] text-secondary">{ME}</span>
          <DropdownMenu
            trigger={<IconButton icon="more-horizontal" size="sm" label="Account" />}
            label="Account"
            side="top"
            align="end"
            items={[
              { id: 'profile', label: 'Profiel', icon: 'user' },
              { id: 'keys', label: 'Sneltoetsen', icon: 'keyboard' },
              { id: 'out', label: 'Uitloggen', icon: 'log-out', separated: true },
            ]}
          />
        </div>
      </div>
      <div className="flex h-12 shrink-0 items-center gap-2 border-border border-b bg-frame px-2 @3xl:hidden">
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
        <AppName product={product} />
        <span aria-hidden="true" className="text-[13px] text-muted">
          /
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-fg">{here?.label ?? ''}</span>
        <Avatar name={ME} size="sm" />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-canvas">{children}</div>
    </div>
  )
}
