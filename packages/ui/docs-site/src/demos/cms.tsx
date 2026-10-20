import { type ReactNode, useState } from 'react'
import {
  Avatar,
  Button,
  Checkbox,
  DropdownMenu,
  Icon,
  IconButton,
  Input,
  PageHeader,
  RelativeTime,
  ScrollArea,
  SegmentedControl,
  Tabs,
  Tag,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import { Missing } from '../demo-kit/Missing'
import type { DemoModule } from '../demo-kit/types'
import { AppFrame, DAY, HOUR, NOW } from './parts/AppFrame'

type Status = 'published' | 'draft' | 'scheduled' | 'archived'
type Kind = 'pages' | 'articles'
type Filter = 'all' | Status

const STATUS: Record<Status, { label: string; tone: 'success' | 'neutral' | 'attention' }> = {
  published: { label: 'Gepubliceerd', tone: 'success' },
  draft: { label: 'Concept', tone: 'neutral' },
  scheduled: { label: 'Gepland', tone: 'attention' },
  archived: { label: 'Gearchiveerd', tone: 'neutral' },
}

interface Entry {
  id: string
  kind: Kind
  title: string
  path: string
  status: Status
  author: string
  updated: number
}

const ENTRIES: Entry[] = [
  {
    id: 'p1',
    kind: 'pages',
    title: 'Home',
    path: '/',
    status: 'published',
    author: 'Iris Kamphorst',
    updated: NOW - 3 * HOUR,
  },
  {
    id: 'p2',
    kind: 'pages',
    title: 'Zomercollectie',
    path: '/winkel/zomercollectie',
    status: 'published',
    author: 'Daan Velthuis',
    updated: NOW - 26 * HOUR,
  },
  {
    id: 'p3',
    kind: 'pages',
    title: 'Cadeaubonnen',
    path: '/winkel/cadeaubonnen',
    status: 'draft',
    author: 'Iris Kamphorst',
    updated: NOW - 2 * DAY,
  },
  {
    id: 'p4',
    kind: 'pages',
    title: 'Over ons',
    path: '/over-ons',
    status: 'published',
    author: 'Sem Oudeweg',
    updated: NOW - 9 * DAY,
  },
  {
    id: 'p5',
    kind: 'pages',
    title: 'Wintercollectie',
    path: '/winkel/wintercollectie',
    status: 'scheduled',
    author: 'Daan Velthuis',
    updated: NOW - 5 * HOUR,
  },
  {
    id: 'p6',
    kind: 'pages',
    title: 'Contact',
    path: '/contact',
    status: 'published',
    author: 'Mila Terhorst',
    updated: NOW - 21 * DAY,
  },
  {
    id: 'p7',
    kind: 'pages',
    title: 'Actie voorjaar',
    path: '/actie/voorjaar',
    status: 'archived',
    author: 'Sem Oudeweg',
    updated: NOW - 140 * DAY,
  },
  {
    id: 'a1',
    kind: 'articles',
    title: 'Tien tips voor de tuin',
    path: '/blog/tien-tips-voor-de-tuin',
    status: 'scheduled',
    author: 'Mila Terhorst',
    updated: NOW - 2 * HOUR,
  },
  {
    id: 'a2',
    kind: 'articles',
    title: 'Zo kies je de juiste pot',
    path: '/blog/de-juiste-pot',
    status: 'published',
    author: 'Fenna Brouwsma',
    updated: NOW - 4 * DAY,
  },
  {
    id: 'a3',
    kind: 'articles',
    title: 'Achter de schermen in het atelier',
    path: '/blog/atelier',
    status: 'draft',
    author: 'Iris Kamphorst',
    updated: NOW - 40 * HOUR,
  },
  {
    id: 'a4',
    kind: 'articles',
    title: 'Wat we leerden van een jaar zonder plastic',
    path: '/blog/zonder-plastic',
    status: 'published',
    author: 'Daan Velthuis',
    updated: NOW - 12 * DAY,
  },
  {
    id: 'a5',
    kind: 'articles',
    title: 'Nieuwe openingstijden',
    path: '/blog/openingstijden',
    status: 'draft',
    author: 'Sem Oudeweg',
    updated: NOW - 30 * HOUR,
  },
]

const FILTERS = [
  { value: 'all', label: 'Alles' },
  { value: 'published', label: 'Gepubliceerd' },
  { value: 'draft', label: 'Concept' },
  { value: 'scheduled', label: 'Gepland' },
  { value: 'archived', label: 'Gearchiveerd' },
] as const

/** The rows of one kind under the filter and the search, as a sketch of the table that is missing. */
function ContentTable({
  kind,
  filter,
  query,
  authors,
}: {
  kind: Kind
  filter: Filter
  query: string
  authors: readonly string[]
}) {
  const [selected, setSelected] = useState<readonly string[]>([])
  const rows = ENTRIES.filter(
    (entry) =>
      entry.kind === kind &&
      (filter === 'all' || entry.status === filter) &&
      (authors.length === 0 || authors.includes(entry.author)) &&
      entry.title.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const toggle = (id: string, on: boolean) =>
    setSelected((now) => (on ? [...now, id] : now.filter((other) => other !== id)))
  return (
    <div className="flex flex-col gap-3">
      <Missing name="DataTable" note="Sorteren per kolom, rijen selecteren, acties op de selectie">
        <div className="flex h-8 items-center gap-3 px-2 text-[12px] text-muted">
          {selected.length > 0 ? (
            <>
              <span className="text-fg">{selected.length} geselecteerd</span>
              <Button size="xs" variant="secondary">
                Publiceren
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setSelected([])}>
                Wissen
              </Button>
            </>
          ) : (
            <span>{rows.length} resultaten</span>
          )}
        </div>
        <div className="grid grid-cols-[24px_minmax(0,1fr)_120px_170px_110px] items-center gap-x-3 border-border border-b px-2 pb-1.5 text-[11px] text-muted">
          <span />
          <span>Titel</span>
          <span>Status</span>
          <span>Auteur</span>
          <span className="flex items-center gap-1">
            Bijgewerkt <Icon name="arrow-down" size="xs" tone="faint" />
          </span>
        </div>
        {rows.map((entry) => (
          <div
            key={entry.id}
            className="grid h-10 grid-cols-[24px_minmax(0,1fr)_120px_170px_110px] items-center gap-x-3 rounded-md px-2 hover:bg-row-hover"
          >
            <Checkbox
              label={`Selecteer ${entry.title}`}
              checked={selected.includes(entry.id)}
              onCheckedChange={(on) => toggle(entry.id, on)}
            />
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-[13px] text-fg">{entry.title}</span>
              <span className="truncate font-mono text-[11px] text-muted">{entry.path}</span>
            </span>
            <span>
              <Tag tone={STATUS[entry.status].tone}>{STATUS[entry.status].label}</Tag>
            </span>
            <span className="flex min-w-0 items-center gap-2 text-[12px] text-secondary">
              <Avatar name={entry.author} size="sm" />
              <span className="truncate">{entry.author}</span>
            </span>
            <span className="text-[12px] text-muted">
              <RelativeTime labels={galleryLabels.time} at={entry.updated} now={NOW} />
            </span>
          </div>
        ))}
      </Missing>
      <Missing name="Pagination">
        <div className="flex items-center justify-end gap-2 text-[12px] text-muted">
          <span className="tabular-nums">1–{rows.length} van 248</span>
          <IconButton icon="chevron-left" size="sm" label="Vorige pagina" disabled />
          <IconButton icon="chevron-right" size="sm" label="Volgende pagina" />
        </div>
      </Missing>
    </div>
  )
}

/** The list of a content system: pages and articles, their status, a filter and a search. */
function Cms(): ReactNode {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [authors, setAuthors] = useState<readonly string[]>([])
  const toolbar = (
    <div className="flex items-center gap-2 pb-3">
      <div className="w-64">
        <Input
          label="Zoek op titel"
          placeholder="Zoek op titel…"
          icon="search"
          size="sm"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          clearLabel="Wissen"
          onClear={() => setQuery('')}
        />
      </div>
      <SegmentedControl<Filter>
        label="Status"
        size="sm"
        value={filter}
        options={FILTERS}
        onValueChange={setFilter}
      />
      <DropdownMenu
        trigger={
          <Button variant="ghost" size="sm">
            Auteur{authors.length > 0 ? ` · ${authors.length}` : ''}
          </Button>
        }
        label="Auteur"
        items={['Iris Kamphorst', 'Daan Velthuis', 'Sem Oudeweg', 'Mila Terhorst'].map((name) => ({
          id: name,
          label: name,
          kind: 'checkbox' as const,
          checked: authors.includes(name),
          onSelect: () =>
            setAuthors((now) =>
              now.includes(name) ? now.filter((n) => n !== name) : [...now, name],
            ),
        }))}
      />
    </div>
  )
  return (
    <AppFrame current="cms">
      <ScrollArea>
        <div className="flex flex-col gap-4 px-8 py-6">
          <PageHeader
            title="Inhoud"
            meta="248 pagina’s en artikelen op zilverberg.example"
            actions={
              <Button variant="primary" size="sm">
                Nieuwe pagina
              </Button>
            }
          />
          <Tabs
            label="Soort inhoud"
            variant="line"
            orientation="horizontal"
            tabs={[
              {
                id: 'pages',
                label: 'Pagina’s',
                count: 7,
                content: (
                  <div className="pt-3">
                    {toolbar}
                    <ContentTable kind="pages" filter={filter} query={query} authors={authors} />
                  </div>
                ),
              },
              {
                id: 'articles',
                label: 'Artikelen',
                count: 5,
                content: (
                  <div className="pt-3">
                    {toolbar}
                    <ContentTable kind="articles" filter={filter} query={query} authors={authors} />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </ScrollArea>
    </AppFrame>
  )
}

export default { title: 'CMS-overzicht', icon: 'file-text', Screen: Cms } satisfies DemoModule
