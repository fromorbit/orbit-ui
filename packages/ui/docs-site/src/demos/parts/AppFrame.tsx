import type { ReactNode } from 'react'
import {
  Avatar,
  DropdownMenu,
  IconButton,
  ProjectMark,
  SearchList,
  type SearchListItem,
  type SearchListLabels,
} from '../../../../src'

/** The made-up workspace every demo belongs to. */
export const WORKSPACE = 'Zilverberg'

/** The made-up person who is signed in. */
export const ME = 'Iris Kamphorst'

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

/** The places of the made-up app; each id is the slug of the demo that shows it. */
const NAV: SearchListItem[] = [
  { id: 'dashboard', label: 'Overzicht', icon: 'columns' },
  { id: 'cms', label: 'Inhoud', icon: 'file-text' },
  { id: 'betalingen', label: 'Betalingen', icon: 'repeat' },
  { id: 'chat', label: 'Assistent', icon: 'sparkles' },
  { id: 'taken', label: 'Taken', icon: 'list-checks', trailing: '12' },
  { id: 'team', label: 'Team', icon: 'users' },
  { id: 'instellingen', label: 'Instellingen', icon: 'settings' },
]

/** The props of {@link AppFrame}. */
export interface AppFrameProps {
  /** The id of the place that is open. */
  current: string
  children: ReactNode
}

/**
 * The window the demos share: a sidebar with the workspace, the places and the person, and the
 * screen beside it.
 *
 * The places are a `SearchList` without search, as the docs page's own list is; picking one opens
 * that demo, so the screens can be walked through like one app.
 */
export function AppFrame({ current, children }: AppFrameProps): ReactNode {
  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="flex w-52 shrink-0 flex-col border-border border-r bg-frame">
        <div className="flex h-12 shrink-0 items-center gap-2 px-3">
          <ProjectMark name={WORKSPACE} />
          <span className="truncate text-[13px] font-medium text-fg">{WORKSPACE}</span>
        </div>
        <div className="min-h-0 flex-1 px-2">
          <SearchList
            items={NAV}
            selectedId={current}
            onSelect={(id) => {
              location.hash = `#/demo/${id}`
            }}
            label="Navigatie"
            labels={LABELS}
            searchable={false}
          />
        </div>
        <div className="flex h-12 shrink-0 items-center gap-2 border-border border-t px-3">
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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-canvas">{children}</div>
    </div>
  )
}
