import { useState } from 'react'
import type { Story } from '../gallery/story'
import { StatusMark } from '../primitives/StatusMark'
import { Tag } from '../primitives/Tag'
import { DataTable, type DataTableColumn } from './DataTable'
import { EmptyState } from './EmptyState'
import { Pagination } from './Pagination'

interface Space {
  id: string
  name: string
  branch: string
  kind: 'running' | 'fault' | 'stopped'
  status: string
  stack: string
  memory: number
}

const SPACES: Space[] = [
  {
    id: 's1',
    name: 'winkel',
    branch: 'main',
    kind: 'running',
    status: 'Draait',
    stack: 'Laravel',
    memory: 512,
  },
  {
    id: 's2',
    name: 'api-gateway',
    branch: 'feat/rate-limit',
    kind: 'fault',
    status: 'Fout',
    stack: 'Go',
    memory: 2048,
  },
  {
    id: 's3',
    name: 'blog',
    branch: 'main',
    kind: 'stopped',
    status: 'Gestopt',
    stack: 'Astro',
    memory: 128,
  },
  {
    id: 's4',
    name: 'dashboard',
    branch: 'main',
    kind: 'running',
    status: 'Draait',
    stack: 'Next.js',
    memory: 1024,
  },
]

const COLUMNS: DataTableColumn<Space>[] = [
  {
    id: 'name',
    header: 'Space',
    sortValue: (s) => s.name,
    cell: (s) => (
      <span className="flex flex-col">
        <span>{s.name}</span>
        <span className="font-mono text-[12px] text-muted">{s.branch}</span>
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    sortValue: (s) => s.status,
    cell: (s) => (
      <span className="flex items-center gap-2 text-secondary">
        <StatusMark kind={s.kind} />
        {s.status}
      </span>
    ),
  },
  { id: 'stack', header: 'Stack', cell: (s) => <Tag>{s.stack}</Tag>, hideBelow: 'lg' },
  {
    id: 'memory',
    header: 'Geheugen',
    align: 'end',
    sortValue: (s) => s.memory,
    cell: (s) => `${s.memory} MB`,
  },
]

const LABELS = {
  selectAll: 'Alle spaces selecteren',
  selectRow: (name: string) => `Selecteer ${name}`,
}

function Spaces() {
  const [selected, setSelected] = useState<string[]>(['s2'])
  const [page, setPage] = useState(1)
  return (
    <div className="flex w-full max-w-[48rem] flex-col gap-3">
      <div className="overflow-hidden rounded-lg bg-plane shadow-plane">
        <DataTable
          label="Spaces"
          columns={COLUMNS}
          rows={SPACES}
          rowKey={(s) => s.id}
          rowName={(s) => s.name}
          labels={LABELS}
          selected={selected}
          onSelectedChange={setSelected}
          defaultSort={{ column: 'name', direction: 'ascending' }}
        />
      </div>
      <Pagination
        page={page}
        total={128}
        pageSize={25}
        onPageChange={setPage}
        labels={{
          label: "Pagina's",
          previous: 'Vorige pagina',
          next: 'Volgende pagina',
          page: (p) => `Pagina ${p}`,
          range: (from, to, total) => `${from}–${to} van ${total}`,
        }}
      />
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'DataTable',
  states: {
    "Gesorteerd, één rij gekozen, met pagina's": () => <Spaces />,
    Laden: () => (
      <div className="w-full max-w-[48rem] overflow-hidden rounded-lg bg-plane shadow-plane">
        <DataTable
          label="Spaces"
          columns={COLUMNS}
          rows={[]}
          rowKey={(s) => s.id}
          labels={LABELS}
          loading
        />
      </div>
    ),
    Leeg: () => (
      <div className="w-full max-w-[48rem] overflow-hidden rounded-lg bg-plane shadow-plane">
        <DataTable
          label="Spaces"
          columns={COLUMNS}
          rows={[]}
          rowKey={(s) => s.id}
          labels={LABELS}
          empty={
            <EmptyState
              icon="layers"
              title="Nog geen spaces"
              description="Maak er een vanuit een repository."
            />
          }
        />
      </div>
    ),
  },
} satisfies Story
