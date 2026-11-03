import { type ReactNode, useState } from 'react'
import {
  Button,
  Checkbox,
  DropdownMenu,
  EmptyState,
  Icon,
  IconButton,
  Input,
  PageHeader,
  RelativeTime,
  ScrollArea,
  SegmentedControl,
  StatusMark,
  type StatusMarkKind,
  Tag,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import { Missing } from '../demo-kit/Missing'
import type { DemoModule, DemoScreenProps } from '../demo-kit/types'
import { AppFrame, DAY, HOUR, MINUTE, NOW } from './parts/AppFrame'

type Filter = 'all' | 'running' | 'fault' | 'stopped'

const FILTERS = [
  { value: 'all', label: 'Alle' },
  { value: 'running', label: 'Draait' },
  { value: 'fault', label: 'Fout' },
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
const COLUMNS = [
  { id: 'space', label: 'Space', className: '' },
  { id: 'status', label: 'Status', className: 'w-40' },
  { id: 'stack', label: 'Stack', className: 'hidden w-60 @6xl:table-cell' },
  { id: 'deployed', label: 'Laatste deploy', className: 'hidden w-36 @4xl:table-cell' },
] as const

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

/** The spaces as a table, drawn as the missing `DataTable`; narrow, every row is a card. */
function SpaceTable({ spaces }: { spaces: readonly Space[] }): ReactNode {
  const [picked, setPicked] = useState<readonly string[]>(['s2'])
  const toggle = (id: string, on: boolean) =>
    setPicked((now) => (on ? [...now, id] : now.filter((entry) => entry !== id)))
  return (
    <Missing name="DataTable" note="Sorteren op kolom, rijen selecteren, kaarten op smal scherm">
      <div className="overflow-hidden rounded-xl border border-border bg-overlay">
        <table className="hidden w-full table-fixed border-collapse text-left text-[13px] @3xl:table">
          <thead>
            <tr className="border-border border-b text-[12px] text-muted">
              <th className="w-11 py-2.5 pl-4 font-normal">
                <Checkbox
                  label="Alles selecteren"
                  checked={picked.length === spaces.length && spaces.length > 0}
                  onCheckedChange={(on) => setPicked(on ? spaces.map((space) => space.id) : [])}
                />
              </th>
              {COLUMNS.map((column) => (
                <th key={column.id} className={`px-3 py-2.5 font-normal ${column.className}`}>
                  <span
                    className={`inline-flex items-center gap-1 ${column.id === 'deployed' ? 'text-fg' : ''}`}
                  >
                    {column.label}
                    {column.id === 'deployed' ? <Icon name="arrow-down" size="sm" /> : null}
                  </span>
                </th>
              ))}
              <th className="w-12 py-2.5 pr-3">
                <span className="sr-only">Acties</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {spaces.map((space) => {
              const on = picked.includes(space.id)
              return (
                <tr
                  key={space.id}
                  className={`border-border border-b last:border-b-0 hover:bg-row-hover ${on ? 'bg-row-active' : ''}`}
                >
                  <td className="py-3 pl-4">
                    <Checkbox
                      label={`Selecteer ${space.app} ${space.branch}`}
                      checked={on}
                      onCheckedChange={(next) => toggle(space.id, next)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <SpaceName space={space} />
                      <span className="truncate font-mono text-[11.5px] text-muted">
                        {space.host}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2 whitespace-nowrap text-secondary">
                      <StatusMark kind={space.kind} />
                      {space.status}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 @6xl:table-cell">
                    <span className="flex flex-wrap gap-1">
                      {space.stack.map((part) => (
                        <Tag key={part}>{part}</Tag>
                      ))}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 text-muted @4xl:table-cell">
                    <RelativeTime labels={galleryLabels.time} at={NOW - space.deployed} now={NOW} />
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <RowMenu space={space} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <ul className="m-0 flex list-none flex-col p-0 @3xl:hidden">
          {spaces.map((space) => (
            <li
              key={space.id}
              className="flex items-start gap-3 border-border border-b px-3.5 py-3 last:border-b-0"
            >
              <span className="flex h-5 items-center">
                <StatusMark kind={space.kind} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-[13.5px]">
                <SpaceName space={space} />
                <span className="truncate font-mono text-[11.5px] text-muted">{space.host}</span>
                <span className="text-[12px] text-secondary">
                  {space.status} ·{' '}
                  <RelativeTime labels={galleryLabels.time} at={NOW - space.deployed} now={NOW} />
                </span>
              </div>
              <RowMenu space={space} />
            </li>
          ))}
        </ul>
      </div>
    </Missing>
  )
}

/** Paging under the table, drawn as the missing `Pagination`. */
function PaginationSketch({ shown, total }: { shown: number; total: number }): ReactNode {
  return (
    <Missing name="Pagination">
      <nav
        aria-label="Pagina's"
        className="flex items-center justify-between gap-3 px-1 py-0.5 text-[12px] text-muted"
      >
        <span className="tabular-nums">{`1–${shown} van ${total}`}</span>
        <span className="flex items-center gap-1">
          <IconButton icon="chevron-left" size="sm" label="Vorige pagina" disabled />
          {['1', '2'].map((page) => (
            <span
              key={page}
              aria-current={page === '1' ? 'page' : undefined}
              className="flex size-7 items-center justify-center rounded-md tabular-nums aria-[current=page]:bg-surface-active aria-[current=page]:text-fg"
            >
              {page}
            </span>
          ))}
          <IconButton icon="chevron-right" size="sm" label="Volgende pagina" />
        </span>
      </nav>
    </Missing>
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
            meta={empty ? 'Zilverberg · nog geen apps' : 'Zilverberg · 4 apps · 12 spaces'}
            actions={
              <Button variant="primary" size="sm">
                Nieuwe space
              </Button>
            }
          />
          {empty ? (
            <div className="flex min-h-96 items-center justify-center rounded-xl border border-border border-dashed bg-overlay p-6">
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
                <div className="rounded-xl border border-border bg-overlay p-8">
                  <EmptyState
                    icon="search"
                    title="Geen spaces gevonden"
                    description="Pas de zoekterm of het filter aan."
                  />
                </div>
              ) : (
                <SpaceTable spaces={shown} />
              )}
              <PaginationSketch shown={shown.length} total={12} />
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
