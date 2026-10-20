import { useState } from 'react'
import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { Checkbox } from '../primitives/Checkbox'
import { Input } from '../primitives/Input'
import { Select } from '../primitives/Select'
import { nl } from '../testing/labels'
import { EditableTable } from './EditableTable'

interface Status {
  id: number
  name: string
  kind: string
  decision: boolean
}

const KINDS = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'busy', label: 'Busy' },
  { value: 'done', label: 'Done' },
  { value: 'closed', label: 'Closed' },
]

const STATUSES: Status[] = [
  { id: 1, name: 'Draft', kind: 'draft', decision: false },
  { id: 2, name: 'In review', kind: 'review', decision: false },
  { id: 3, name: 'Approved', kind: 'done', decision: true },
  { id: 4, name: 'Dropped', kind: 'closed', decision: true },
]

/** The statuses of a spec, as the profile dialog will hold them. */
function Statuses({ initial, maxRows }: { initial: Status[]; maxRows?: number }) {
  const [rows, setRows] = useState(initial)
  const [next, setNext] = useState(100)
  const patch = (index: number, change: Partial<Status>) =>
    setRows((all) => all.map((row, at) => (at === index ? { ...row, ...change } : row)))
  return (
    <TooltipProvider>
      <div className="w-[480px]">
        <EditableTable<Status>
          label="Statuses of a spec"
          labels={nl.editableTable}
          rows={rows}
          rowKey={(row) => String(row.id)}
          rowLabel={(row) => row.name || '…'}
          minRows={1}
          {...(maxRows !== undefined ? { maxRows } : {})}
          addLabel="Add status"
          columns={[
            {
              id: 'name',
              header: 'Name',
              cell: (row, index, label) => (
                <Input
                  label={label}
                  size="sm"
                  value={row.name}
                  onChange={(event) => patch(index, { name: event.target.value })}
                />
              ),
            },
            {
              id: 'kind',
              header: 'Kind',
              width: 'fit',
              cell: (row, index, label) => (
                <Select
                  label={label}
                  size="sm"
                  value={row.kind}
                  options={KINDS}
                  onValueChange={(kind) => patch(index, { kind })}
                />
              ),
            },
            {
              id: 'decision',
              header: 'Decision',
              width: 'fit',
              cell: (row, index, label) => (
                <Checkbox
                  label={label}
                  checked={row.decision}
                  onCheckedChange={(decision) => patch(index, { decision: decision === true })}
                />
              ),
            },
          ]}
          onAdd={() => {
            setRows((all) => [...all, { id: next, name: '', kind: 'draft', decision: false }])
            setNext((id) => id + 1)
          }}
          onRemove={(index) => setRows((all) => all.filter((_, at) => at !== index))}
        />
      </div>
    </TooltipProvider>
  )
}

export default {
  group: 'patterns',
  title: 'EditableTable',
  states: {
    'Statuses of a spec': () => <Statuses initial={STATUSES} />,
    'One row left: nothing to remove': () => <Statuses initial={STATUSES.slice(0, 1)} />,
    'Full: nothing to add': () => <Statuses initial={STATUSES.slice(0, 2)} maxRows={2} />,
  },
} satisfies Story
