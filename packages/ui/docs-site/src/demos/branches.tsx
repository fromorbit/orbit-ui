import { type ReactNode, useEffect, useState } from 'react'
import {
  Avatar,
  Button,
  Checkbox,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
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

/** The menu of a branch; the default branch has none. */
function BranchMenu({ branch }: { branch: Branch }): ReactNode {
  if (branch.fate === 'base') return null
  return (
    <DropdownMenu
      trigger={<IconButton icon="more-horizontal" size="sm" label={`Meer over ${branch.name}`} />}
      label={branch.name}
      align="end"
      items={[
        { id: 'open', label: 'Openen in een gesprek', icon: 'messages-square' },
        { id: 'adopt', label: 'Samenvoegen in main', icon: 'git-branch' },
        { id: 'drop', label: 'Weggooien…', icon: 'trash-2', tone: 'danger', separated: true },
      ]}
    />
  )
}

/** How far a branch is from main, in words: the arrows of the column, said out. */
function distance(branch: Branch): string {
  return `${branch.ahead} ${branch.ahead === 1 ? 'commit' : 'commits'} voor, ${branch.behind} achter`
}

/** The names in a sentence: "a, b en c". */
function listed(names: readonly string[]): string {
  return names.length < 2
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} en ${names[names.length - 1]}`
}

/**
 * A branch as a phone shows it: the box, the name and its state on one line, the last commit
 * under it (cut before the time, never after), so why a row is ticked stays in sight.
 */
function BranchCard({
  branch,
  checked,
  onCheckedChange,
}: {
  branch: Branch
  checked: boolean
  onCheckedChange: (next: boolean) => void
}): ReactNode {
  const fate = FATES[branch.fate]
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="flex h-5 w-4 shrink-0 items-center">
        {branch.fate === 'base' ? null : (
          <Checkbox
            label={`Kies ${branch.name}`}
            checked={checked}
            onCheckedChange={onCheckedChange}
          />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex min-w-0 flex-1 items-center font-mono text-[13px] text-fg">
            <StackedRowBranch name={branch.name} worktree={branch.worktree} />
          </span>
          <Tag {...(fate.tone === undefined ? {} : { tone: fate.tone })}>{fate.label}</Tag>
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-muted">
          <span className="min-w-0 flex-1 truncate text-secondary">{branch.commit}</span>
          <span className="shrink-0">
            <RelativeTime labels={galleryLabels.time} at={branch.at} now={NOW} />
          </span>
        </span>
      </div>
    </div>
  )
}

/** The columns: the branch with its last commit, how far it is from main, its fate, its menu. */
const COLUMNS: DataTableColumn<Branch>[] = [
  {
    id: 'branch',
    header: 'Branch en laatste commit',
    sortValue: (branch) => branch.name,
    cell: (branch) => (
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
    ),
  },
  {
    id: 'distance',
    header: 'Voor / achter op main',
    hideBelow: 'md',
    sortValue: (branch) => branch.ahead,
    cell: (branch) =>
      branch.fate === 'base' ? null : (
        <span title={distance(branch)} className="font-mono text-[12px] text-muted tabular-nums">
          <span aria-hidden="true">{`↑${branch.ahead} ↓${branch.behind}`}</span>
          <span className="sr-only">{distance(branch)}</span>
        </span>
      ),
  },
  {
    id: 'fate',
    header: 'Staat',
    sortValue: (branch) => FATES[branch.fate].label,
    cell: (branch) => {
      const fate = FATES[branch.fate]
      return <Tag {...(fate.tone === undefined ? {} : { tone: fate.tone })}>{fate.label}</Tag>
    },
  },
  {
    id: 'menu',
    header: 'Acties',
    headerHidden: true,
    align: 'end',
    hideBelow: 'md',
    cell: (branch) => <BranchMenu branch={branch} />,
  },
]

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
  const worktrees = BRANCHES.filter(
    (branch) => selected.includes(branch.name) && branch.worktree,
  ).length
  return (
    <AppFrame product="orbit" current="branches">
      <ScrollArea>
        {/* Room under the table for the bar of a selection, so it never covers the last row. */}
        <div
          className={`mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pt-5 @3xl:px-8 @3xl:pt-7 ${selected.length > 0 ? 'pb-24' : 'pb-5 @3xl:pb-7'}`}
        >
          {/* No act in the head: the bar under a selection is the one place to clean up from. */}
          <PageHeader
            title="Branches"
            meta={`${REPO} · ${BRANCHES.length} branches · ${BRANCHES.filter((b) => b.worktree).length} worktrees`}
          />
          <div className="grid grid-cols-2 gap-3 @xl:grid-cols-3">
            {[
              { label: 'Samengevoegd', short: 'kunnen weg', value: '3', note: 'kunnen weg' },
              {
                label: 'Worktrees op schijf',
                short: 'op schijf',
                value: '2,4 GB',
                note: 'in 5 mappen',
              },
              {
                label: 'Oudste branch',
                short: 'oudste: oude-kassa',
                value: '5 wk',
                note: 'oude-kassa',
              },
            ].map((fact) => (
              <div
                key={fact.label}
                className="flex min-w-0 flex-col gap-0.5 rounded-lg bg-overlay px-3 py-2.5 last:col-span-2 @xl:last:col-span-1 @3xl:flex-row @3xl:items-baseline @3xl:gap-2 @3xl:px-4 @3xl:py-3"
              >
                <span className="whitespace-nowrap font-heading text-[20px] text-fg tabular-nums">
                  {fact.value}
                </span>
                <span className="min-w-0 truncate text-[12px] text-muted @3xl:text-[12px]">
                  <span className="@3xl:hidden">{fact.short}</span>
                  <span className="hidden @3xl:inline">{`${fact.label.toLowerCase()} · ${fact.note}`}</span>
                </span>
              </div>
            ))}
          </div>
          <Panel
            title="Alle branches"
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
            <DataTable
              label="Branches"
              columns={COLUMNS}
              rows={rows}
              rowKey={(branch) => branch.name}
              rowName={(branch) => branch.name}
              labels={{ selectAll: 'Kies alles', selectRow: (name) => `Kies ${name}` }}
              selected={selected}
              onSelectedChange={setSelected}
              canSelect={(branch) => branch.fate !== 'base'}
              card={(branch) => (
                <BranchCard
                  branch={branch}
                  checked={selected.includes(branch.name)}
                  onCheckedChange={(next) =>
                    setSelected((now) =>
                      next ? [...now, branch.name] : now.filter((name) => name !== branch.name),
                    )
                  }
                />
              )}
            />
          </Panel>
        </div>
      </ScrollArea>
      {selected.length > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-border bg-overlay py-1.5 pr-1.5 pl-4 shadow-menu">
            <span className="text-[13px] text-fg tabular-nums">{`${selected.length} geselecteerd`}</span>
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              Selectie opheffen
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
        title={
          selected.length === 1 ? '1 branch opruimen?' : `${selected.length} branches opruimen?`
        }
        body={`${selected.length === 1 ? 'De branch' : 'De branches'} ${listed(selected)} ${selected.length === 1 ? 'gaat' : 'gaan'} weg, lokaal en op GitHub, en ${worktrees === 1 ? 'één worktree' : `${worktrees} worktrees`} met ${worktrees === 1 ? 'zijn' : 'hun'} map. Wat samengevoegd is, staat al in main. Dit kun je niet ongedaan maken.`}
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
