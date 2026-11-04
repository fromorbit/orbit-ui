import { type ReactNode, useState } from 'react'
import {
  Button,
  DataTable,
  type DataTableColumn,
  DropdownMenu,
  EmptyState,
  IconButton,
  Input,
  PageHeader,
  Pagination,
  RelativeTime,
  ScrollArea,
  SegmentedControl,
  StatusMark,
  type StatusMarkKind,
  Tag,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import type { DemoModule, DemoScreenProps } from '../demo-kit/types'
import { AppFrame, ago, DAY, HOUR, MINUTE, NOW } from './parts/AppFrame'

type Filter = 'all' | 'running' | 'fault' | 'stopped'

const FILTERS = [
  { value: 'all', label: 'Alle' },
  { value: 'running', label: 'Draait' },
  { value: 'fault', label: 'Start niet' },
  { value: 'stopped', label: 'Gestopt' },
] as const

/** One space: a branch of an app running on an address of its own. */
interface Space {
  id: string
  app: string
  branch: string
  kind: StatusMarkKind
  status: string
  host: string
  stack: readonly string[]
  deployed: number
}

const SPACES: readonly Space[] = [
  {
    id: 's1',
    app: 'webwinkel',
    branch: 'main',
    kind: 'running',
    status: 'Draait',
    host: 'webwinkel.zilverberg.test',
    stack: ['Laravel', 'Vite', 'Postgres'],
    deployed: 3 * HOUR,
  },
  {
    id: 's2',
    app: 'webwinkel',
    branch: 'betaling-ideal',
    kind: 'fault',
    status: 'Start niet',
    host: 'ideal.webwinkel.zilverberg.test',
    stack: ['Laravel', 'Vite', 'Postgres'],
    deployed: 12 * MINUTE,
  },
  {
    id: 's3',
    app: 'webwinkel',
    branch: 'zoeken-v2',
    kind: 'running',
    status: 'Draait',
    host: 'zoeken-v2.webwinkel.zilverberg.test',
    stack: ['Laravel', 'Meilisearch'],
    deployed: 47 * MINUTE,
  },
  {
    id: 's4',
    app: 'beheer',
    branch: 'main',
    kind: 'running',
    status: 'Draait',
    host: 'beheer.zilverberg.test',
    stack: ['Vite', 'React'],
    deployed: 26 * HOUR,
  },
  {
    id: 's5',
    app: 'nieuwsbrief',
    branch: 'sjablonen',
    kind: 'blocked',
    status: 'Wacht op geheim',
    host: 'sjablonen.nieuwsbrief.zilverberg.test',
    stack: ['Node', 'Redis'],
    deployed: 2 * HOUR,
  },
  {
    id: 's6',
    app: 'webwinkel',
    branch: 'cadeaubon',
    kind: 'stopped',
    status: 'Gestopt',
    host: 'cadeaubon.webwinkel.zilverberg.test',
    stack: ['Laravel', 'Vite', 'Postgres'],
    deployed: 3 * DAY,
  },
  {
    id: 's7',
    app: 'api',
    branch: 'main',
    kind: 'running',
    status: 'Draait',
    host: 'api.zilverberg.test',
    stack: ['Go', 'Postgres'],
    deployed: 5 * HOUR,
  },
  {
    id: 's8',
    app: 'beheer',
    branch: 'rapportage',
    kind: 'stopped',
    status: 'Gestopt',
    host: 'rapportage.beheer.zilverberg.test',
    stack: ['Vite', 'React'],
    deployed: 6 * DAY,
  },
]

/** Which filter a space falls under; a blocked space counts as one with a fault. */
function matches(space: Space, filter: Filter, query: string): boolean {
  const text = `${space.app} ${space.branch} ${space.host}`.toLowerCase()
  if (query !== '' && !text.includes(query.toLowerCase())) return false
  if (filter === 'all') return true
  if (filter === 'fault') return space.kind === 'fault' || space.kind === 'blocked'
  return space.kind === filter
}

/** The menu at the end of a row. */
function RowMenu({ space }: { space: Space }): ReactNode {
  return (
    <DropdownMenu
      trigger={
        <IconButton icon="more-horizontal" size="sm" label={`Acties voor ${space.branch}`} />
      }
      label={`Acties voor ${space.branch}`}
      align="end"
      items={[
        { id: 'open', label: 'Openen', icon: 'square-arrow-out-up-right' },
        { id: 'log', label: 'Logboek', icon: 'terminal' },
        { id: 'restart', label: 'Herstarten', icon: 'rotate-cw' },
        { id: 'stop', label: 'Stoppen', icon: 'square', tone: 'danger', separated: true },
      ]}
    />
  )
}

/** The columns of the table; the narrower the frame, the fewer of them. */
/** The name of a space as app / branch. */
function SpaceName({ space }: { space: Space }): ReactNode {
  return (
    <span className="truncate text-fg">
      <span className="font-medium">{space.app}</span>
      <span className="text-muted"> / </span>
      {space.branch}
    </span>
  )
}

/** The columns of the table of spaces; narrow, the stack and the deploy step aside. */
const COLUMNS: DataTableColumn<Space>[] = [
  {
    id: 'space',
    header: 'App en branch',
    sortValue: (space) => `${space.app}/${space.branch}`,
    cell: (space) => (
      <div className="flex min-w-0 flex-col gap-0.5">
        <SpaceName space={space} />
        <span className="truncate font-mono text-[11px] text-muted">{space.host}</span>
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    sortValue: (space) => space.status,
    cell: (space) => (
      <span className="flex items-center gap-2 whitespace-nowrap text-secondary">
        <StatusMark kind={space.kind} />
        {space.status}
      </span>
    ),
  },
  {
    id: 'stack',
    header: 'Stack',
    hideBelow: 'lg',
    cell: (space) => (
      <span className="flex flex-wrap gap-1">
        {space.stack.map((part) => (
          <Tag key={part}>{part}</Tag>
        ))}
      </span>
    ),
  },
  {
    id: 'deployed',
    header: 'Laatst uitgerold',
    hideBelow: 'lg',
    sortValue: (space) => -space.deployed,
    cell: (space) => (
      <span className="text-muted">
        <RelativeTime labels={galleryLabels.time} at={NOW - space.deployed} now={NOW} />
      </span>
    ),
  },
  {
    id: 'menu',
    header: 'Acties',
    headerHidden: true,
    align: 'end',
    cell: (space) => <RowMenu space={space} />,
  },
]

/** The spaces as a table: sortable, rows to select, and narrow every row a card. */
function SpaceTable({ spaces }: { spaces: readonly Space[] }): ReactNode {
  const [picked, setPicked] = useState<readonly string[]>([])
  return (
    <div className="overflow-hidden rounded-lg bg-overlay shadow-plane">
      <DataTable
        label="Spaces"
        columns={COLUMNS}
        rows={spaces}
        rowKey={(space) => space.id}
        rowName={(space) => `${space.app} ${space.branch}`}
        labels={{ selectAll: 'Alles selecteren', selectRow: (name) => `Selecteer ${name}` }}
        selected={picked}
        onSelectedChange={setPicked}
        defaultSort={{ column: 'deployed', direction: 'descending' }}
        card={(space) => (
          <div className="flex items-start gap-3 px-3.5 py-3">
            <span className="flex h-5 items-center">
              <StatusMark kind={space.kind} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-[13px]">
              <SpaceName space={space} />
              <span className="truncate font-mono text-[11px] text-muted">{space.host}</span>
              <span className="text-[12px] text-secondary">
                {`${space.status} · uitgerold ${ago(space.deployed)}`}
              </span>
            </div>
            <RowMenu space={space} />
          </div>
        )}
      />
    </div>
  )
}

/** Paging under the table. */
function SpacePages({ total }: { total: number }): ReactNode {
  const [page, setPage] = useState(1)
  return (
    <Pagination
      page={page}
      total={total}
      pageSize={8}
      onPageChange={setPage}
      labels={{
        label: "Pagina's",
        previous: 'Vorige pagina',
        next: 'Volgende pagina',
        page: (n) => `Pagina ${n}`,
        range: (from, to, all) => `${from}–${to} van ${all}`,
      }}
    />
  )
}

/** Halo's list of apps and their spaces, filtered by state and searched by name or address. */
function Apps({ variant }: DemoScreenProps): ReactNode {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const empty = variant === 'leeg'
  const shown = SPACES.filter((space) => matches(space, filter, query))
  return (
    <AppFrame product="halo" current="apps">
      <ScrollArea>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 @3xl:px-8 @3xl:py-7">
          <PageHeader
            title="Apps"
            meta={empty ? 'Zilverberg · nog geen spaces' : 'Zilverberg · 4 apps · 12 spaces'}
            // Empty, the empty state's own "Repository koppelen" is the one next step.
            {...(empty
              ? {}
              : {
                  actions: (
                    <Button variant="primary" size="sm">
                      Nieuwe space
                    </Button>
                  ),
                })}
          />
          {empty ? (
            <div className="flex min-h-96 items-center justify-center rounded-lg bg-overlay p-6 shadow-plane">
              <EmptyState
                icon="rows"
                title="Nog geen spaces"
                description="Een space is één branch van een app op een eigen adres. Koppel een repository en Halo zet de eerste voor je op."
                action={
                  <Button variant="primary" size="sm">
                    Repository koppelen
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1 basis-56 *:w-full @3xl:max-w-80">
                  <Input
                    label="Zoek een space"
                    icon="search"
                    size="sm"
                    placeholder="Zoek op app, branch of adres…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <SegmentedControl<Filter>
                  label="Toon"
                  size="sm"
                  value={filter}
                  options={FILTERS}
                  onValueChange={setFilter}
                />
              </div>
              {shown.length === 0 ? (
                <div className="rounded-lg bg-overlay p-8 shadow-plane">
                  <EmptyState
                    icon="search"
                    title="Geen spaces gevonden"
                    description="Pas de zoekterm of het filter aan."
                  />
                </div>
              ) : (
                <SpaceTable spaces={shown} />
              )}
              <SpacePages total={12} />
            </>
          )}
        </div>
      </ScrollArea>
    </AppFrame>
  )
}

export default {
  title: 'Apps',
  description:
    'Elke branch van een app draait in Halo als eigen space. Een tabel met status, adres en stack, die op een smal scherm overgaat in kaarten.',
  icon: 'rows',
  product: 'halo',
  variants: [
    { value: 'lijst', label: 'Lijst' },
    { value: 'leeg', label: 'Leeg' },
  ],
  Screen: Apps,
} satisfies DemoModule
