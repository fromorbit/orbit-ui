import { type ReactNode, useEffect, useState } from 'react'
import {
  Avatar,
  Button,
  Checkbox,
  ConfirmDialog,
  DropdownMenu,
  IconButton,
  PageHeader,
  RelativeTime,
  ScrollArea,
  SegmentedControl,
  StackedRowBranch,
  Tag,
} from '../../../src'
import { galleryLabels } from '../../../src/gallery'
import { Missing } from '../demo-kit/Missing'
import type { DemoModule, DemoScreenProps } from '../demo-kit/types'
import { AppFrame, DAY, HOUR, MINUTE, NOW, REPO } from './parts/AppFrame'
import { Panel } from './parts/Panel'

/** What a branch is to the person cleaning up: still in use, done with, or forgotten. */
type Fate = 'base' | 'busy' | 'waiting' | 'merged' | 'unpushed' | 'stale'

/** The tag of every fate; the base branch can never be selected. */
const FATES: Record<Fate, { label: string; tone?: 'success' | 'attention' }> = {
  base: { label: 'Standaard' },
  busy: { label: 'Gesprek loopt' },
  waiting: { label: 'Wacht op jou', tone: 'attention' },
  merged: { label: 'Samengevoegd', tone: 'success' },
  unpushed: { label: 'Niet gepusht', tone: 'attention' },
  stale: { label: 'Verouderd' },
}

/** One branch of the made-up web shop and the worktree Orbit made for it, if any. */
interface Branch {
  name: string
  worktree: boolean
  fate: Fate
  commit: string
  author: string
  at: number
  ahead: number
  behind: number
  pr?: string
}

const BRANCHES: Branch[] = [
  {
    name: 'main',
    worktree: false,
    fate: 'base',
    commit: 'Zoekbalk: lege toestand met suggesties',
    author: 'Sem Oudeweg',
    at: NOW - 40 * MINUTE,
    ahead: 0,
    behind: 0,
  },
  {
    name: 'nt/zoekfilter-server',
    worktree: true,
    fate: 'busy',
    commit: 'Filters op maat en kleur naar de server',
    author: 'Orbit',
    at: NOW - 2 * MINUTE,
    ahead: 6,
    behind: 0,
  },
  {
    name: 'nt/import-facturen',
    worktree: true,
    fate: 'waiting',
    commit: 'Facturen ophalen per nacht',
    author: 'Orbit',
    at: NOW - 8 * MINUTE,
    ahead: 3,
    behind: 2,
  },
  {
    name: 'nt/ideal',
    worktree: true,
    fate: 'merged',
    commit: 'iDEAL: terugkeer na een mislukte betaling',
    author: 'Mila Terhorst',
    at: NOW - 2 * DAY,
    ahead: 0,
    behind: 9,
    pr: '#486',
  },
  {
    name: 'nt/prijsregels-cache',
    worktree: true,
    fate: 'merged',
    commit: 'Prijsregels een uur in de cache',
    author: 'Orbit',
    at: NOW - 3 * DAY,
    ahead: 0,
    behind: 14,
    pr: '#482',
  },
  {
    name: 'nt/boekhouding',
    worktree: false,
    fate: 'merged',
    commit: 'Export naar de boekhouding elke nacht',
    author: 'Joris Lindeboom',
    at: NOW - 6 * DAY,
    ahead: 0,
    behind: 31,
    pr: '#471',
  },
  {
    name: 'nt/omzet-rapport',
    worktree: true,
    fate: 'unpushed',
    commit: 'Omzet per maand als SQL-weergave',
    author: 'Orbit',
    at: NOW - 9 * HOUR,
    ahead: 2,
    behind: 4,
  },
  {
    name: 'oude-kassa',
    worktree: false,
    fate: 'stale',
    commit: 'Kassa: knop naar boven',
    author: 'Daan Velthuis',
    at: NOW - 41 * DAY,
    ahead: 1,
    behind: 128,
  },
]

/** The filter above the list. */
type Filter = 'all' | 'merged' | 'worktrees'

const FILTERS = [
  { value: 'all', label: 'Alle' },
  { value: 'merged', label: 'Samengevoegd' },
  { value: 'worktrees', label: 'Met worktree' },
] as const

/** Whether a branch is shown under a filter. */
function shown(branch: Branch, filter: Filter): boolean {
  if (filter === 'merged') return branch.fate === 'merged'
  if (filter === 'worktrees') return branch.worktree
  return true
}

/** The merged branches, selected when the screen opens: what a clean-up starts with. */
const MERGED = BRANCHES.filter((branch) => branch.fate === 'merged').map((branch) => branch.name)

/** One row: the box, the branch with its last commit, how far it is from main, and its fate. */
function Row({
  branch,
  selected,
  onSelect,
}: {
  branch: Branch
  selected: boolean
  onSelect(selected: boolean): void
}): ReactNode {
  const fate = FATES[branch.fate]
  return (
    <li
      className={`grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3 border-border border-t px-4 py-3 @3xl:grid-cols-[20px_minmax(0,1fr)_96px_140px_32px] ${selected ? 'bg-surface' : ''}`}
    >
      {branch.fate === 'base' ? (
        <span />
      ) : (
        <Checkbox label={`Kies ${branch.name}`} checked={selected} onCheckedChange={onSelect} />
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex min-w-0 items-center gap-2 font-mono text-[13px] text-fg">
          <StackedRowBranch name={branch.name} worktree={branch.worktree} />
          {branch.pr === undefined ? null : (
            <span className="hidden text-[12px] text-accent-text @xl:inline">{branch.pr}</span>
          )}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-muted">
          <Avatar name={branch.author} size="sm" />
          <span className="truncate text-secondary">{branch.commit}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">
            <RelativeTime labels={galleryLabels.time} at={branch.at} now={NOW} />
          </span>
        </span>
      </div>
      <span className="hidden font-mono text-[12px] text-muted tabular-nums @3xl:block">
        {branch.fate === 'base' ? '' : `↑${branch.ahead} ↓${branch.behind}`}
      </span>
      <span className="flex justify-end @3xl:justify-start">
        <Tag {...(fate.tone === undefined ? {} : { tone: fate.tone })}>{fate.label}</Tag>
      </span>
      <span className="hidden justify-end @3xl:flex">
        {branch.fate === 'base' ? null : (
          <DropdownMenu
            trigger={
              <IconButton icon="more-horizontal" size="sm" label={`Meer over ${branch.name}`} />
            }
            label={branch.name}
            align="end"
            items={[
              { id: 'open', label: 'Openen in een gesprek', icon: 'messages-square' },
              { id: 'adopt', label: 'Overnemen in main', icon: 'git-branch' },
              { id: 'drop', label: 'Weggooien…', icon: 'trash-2', tone: 'danger', separated: true },
            ]}
          />
        )}
      </span>
    </li>
  )
}

/**
 * Orbit's branches of a repository: what agents and people left behind, with the merged ones
 * selected, a bar for the selection, and the question before anything goes.
 */
function Branches({ variant = 'lijst' }: DemoScreenProps): ReactNode {
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<string[]>(MERGED)
  const [asking, setAsking] = useState(variant === 'bevestigen')
  useEffect(() => setAsking(variant === 'bevestigen'), [variant])
  const rows = BRANCHES.filter((branch) => shown(branch, filter))
  const choosable = rows.filter((branch) => branch.fate !== 'base')
  const all = choosable.length > 0 && choosable.every((branch) => selected.includes(branch.name))
  const worktrees = BRANCHES.filter(
    (branch) => selected.includes(branch.name) && branch.worktree,
  ).length
  return (
    <AppFrame product="orbit" current="branches">
      <ScrollArea>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 @3xl:px-8 @3xl:py-7">
          <PageHeader
            title="Branches"
            meta={`${REPO} · ${BRANCHES.length} branches · ${BRANCHES.filter((b) => b.worktree).length} worktrees`}
            actions={
              <Button
                variant="secondary"
                size="sm"
                disabled={selected.length === 0}
                onClick={() => setAsking(true)}
              >
                Opruimen…
              </Button>
            }
          />
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Samengevoegd', short: 'kunnen weg', value: '3', note: 'kunnen weg' },
              {
                label: 'Worktrees op schijf',
                short: 'op schijf',
                value: '2,4 GB',
                note: 'in 5 mappen',
              },
              { label: 'Oudste branch', short: 'oudste', value: '41 dagen', note: 'oude-kassa' },
            ].map((fact) => (
              <div
                key={fact.label}
                className="flex min-w-0 flex-col gap-0.5 rounded-xl border border-border bg-overlay px-3 py-2.5 @3xl:flex-row @3xl:items-baseline @3xl:gap-2 @3xl:px-4 @3xl:py-3"
              >
                <span className="whitespace-nowrap font-heading text-[17px] text-fg tabular-nums @3xl:text-[20px]">
                  {fact.value}
                </span>
                <span className="min-w-0 truncate text-[12px] text-muted @3xl:text-[12.5px]">
                  <span className="@3xl:hidden">{fact.short}</span>
                  <span className="hidden @3xl:inline">{`${fact.label.toLowerCase()} · ${fact.note}`}</span>
                </span>
              </div>
            ))}
          </div>
          <Panel
            title="Branches van Orbit"
            meta={`${rows.length} van ${BRANCHES.length}`}
            actions={
              <div className="hidden @2xl:block">
                <SegmentedControl<Filter>
                  label="Filter"
                  size="sm"
                  value={filter}
                  options={FILTERS}
                  onValueChange={setFilter}
                />
              </div>
            }
            flush
          >
            <Missing name="DataTable" note="Rijselectie, sorteren op kolom en een lege toestand">
              <div className="flex flex-col">
                <div className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3 px-4 pt-1 pb-2 text-[11.5px] text-muted @3xl:grid-cols-[20px_minmax(0,1fr)_96px_140px_32px]">
                  <Checkbox
                    label="Kies alles"
                    checked={all}
                    onCheckedChange={(on) =>
                      setSelected(on ? choosable.map((branch) => branch.name) : [])
                    }
                  />
                  <span>Branch en laatste commit</span>
                  <span className="hidden @3xl:block">t.o.v. main</span>
                  <span className="text-right @3xl:text-left">Staat</span>
                  <span className="hidden @3xl:block" />
                </div>
                <ul className="m-0 list-none p-0">
                  {rows.map((branch) => (
                    <Row
                      key={branch.name}
                      branch={branch}
                      selected={selected.includes(branch.name)}
                      onSelect={(on) =>
                        setSelected((now) =>
                          on ? [...now, branch.name] : now.filter((name) => name !== branch.name),
                        )
                      }
                    />
                  ))}
                </ul>
              </div>
            </Missing>
          </Panel>
        </div>
      </ScrollArea>
      {selected.length > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-overlay py-1.5 pr-1.5 pl-4 shadow-menu">
            <span className="text-[13px] text-fg tabular-nums">{`${selected.length} geselecteerd`}</span>
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              Wissen
            </Button>
            <Button variant="primary" size="sm" onClick={() => setAsking(true)}>
              Opruimen…
            </Button>
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        title={`${selected.length} branches opruimen?`}
        body={`De branches gaan weg, lokaal en op GitHub, en ${worktrees === 1 ? 'één worktree' : `${worktrees} worktrees`} met ${worktrees === 1 ? 'zijn' : 'hun'} map. Wat samengevoegd is, staat al in main.`}
        confirmLabel="Opruimen"
        cancelLabel="Annuleren"
        tone="danger"
        onConfirm={() => {
          setSelected([])
          setAsking(false)
        }}
      />
    </AppFrame>
  )
}

export default {
  title: 'Branches opruimen',
  description:
    'Wat agents en mensen achterlieten in een repository: de samengevoegde branches staan al aangevinkt, een balk houdt de selectie bij, en Orbit vraagt het voordat er iets weggaat.',
  icon: 'git-branch',
  product: 'orbit',
  variants: [
    { value: 'lijst', label: 'Lijst' },
    { value: 'bevestigen', label: 'Bevestigen' },
  ],
  Screen: Branches,
} satisfies DemoModule
