import { useId, useState } from 'react'
import type { Story } from '../gallery/story'
import { Checkbox } from './Checkbox'

/** Stacked checkboxes, one row per tool: the shape a permission list actually takes. */
function OptionList() {
  const [checked, setChecked] = useState<Record<string, boolean>>({
    read: true,
    write: false,
    network: false,
  })
  const rows = [
    { id: 'read', label: 'Bestanden lezen' },
    { id: 'write', label: 'Bestanden schrijven' },
    { id: 'network', label: 'Netwerktoegang' },
  ]
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <CheckboxRow
          key={row.id}
          label={row.label}
          checked={checked[row.id] ?? false}
          onCheckedChange={(next) => setChecked((prev) => ({ ...prev, [row.id]: next }))}
        />
      ))}
    </div>
  )
}

function CheckboxRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange(checked: boolean): void
}) {
  const labelId = useId()
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        label="decoy"
        aria-labelledby={labelId}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <span id={labelId} className="text-fg">
        {label}
      </span>
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'Checkbox',
  states: {
    Checked: () => <Checkbox label="Netwerktoegang" checked onCheckedChange={() => {}} />,
    Unchecked: () => <Checkbox label="Netwerktoegang" checked={false} onCheckedChange={() => {}} />,
    Disabled: () => (
      <Checkbox label="Netwerktoegang" checked={false} disabled onCheckedChange={() => {}} />
    ),
    'In a list of options': () => <OptionList />,
  },
} satisfies Story
