import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { DataTable, type DataTableColumn, sortRows } from './DataTable'

interface Space {
  id: string
  name: string
  memory: number
}

const SPACES: Space[] = [
  { id: 's1', name: 'winkel', memory: 512 },
  { id: 's2', name: 'api-gateway', memory: 2048 },
  { id: 's3', name: 'Blog', memory: 128 },
]

const COLUMNS: DataTableColumn<Space>[] = [
  { id: 'name', header: 'Naam', cell: (s) => s.name, sortValue: (s) => s.name },
  {
    id: 'memory',
    header: 'Geheugen',
    cell: (s) => `${s.memory} MB`,
    sortValue: (s) => s.memory,
    align: 'end',
  },
  { id: 'menu', header: 'Acties', cell: () => '…', headerHidden: true },
]

const LABELS = {
  selectAll: 'Alle rijen selecteren',
  selectRow: (name: string) => `Selecteer ${name}`,
}

const names = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0]?.textContent)

describe('sortRows', () => {
  test('sorts text in the locale order and numbers by size, stable', () => {
    expect(
      sortRows(SPACES, COLUMNS, { column: 'name', direction: 'ascending' }).map((s) => s.id),
    ).toEqual(['s2', 's3', 's1'])
    expect(
      sortRows(SPACES, COLUMNS, { column: 'memory', direction: 'descending' }).map((s) => s.id),
    ).toEqual(['s2', 's1', 's3'])
    expect(sortRows(SPACES, COLUMNS, null)).toEqual(SPACES)
  })
})

test('a table named by its label, with a header per column', () => {
  render(
    <DataTable
      label="Spaces"
      columns={COLUMNS}
      rows={SPACES}
      rowKey={(s) => s.id}
      labels={LABELS}
    />,
  )
  const table = screen.getByRole('table', { name: 'Spaces' })
  expect(within(table).getAllByRole('columnheader')).toHaveLength(3)
  expect(within(table).getByRole('columnheader', { name: 'Acties' })).toBeInTheDocument()
  expect(names()).toEqual(['winkel', 'api-gateway', 'Blog'])
})

test('a header button sorts ascending, then descending, and says so in aria-sort', async () => {
  const onSortChange = vi.fn()
  render(
    <DataTable
      label="Spaces"
      columns={COLUMNS}
      rows={SPACES}
      rowKey={(s) => s.id}
      labels={LABELS}
      onSortChange={onSortChange}
    />,
  )
  const header = screen.getByRole('columnheader', { name: 'Geheugen' })
  expect(header).toHaveAttribute('aria-sort', 'none')
  await userEvent.click(within(header).getByRole('button', { name: 'Geheugen' }))
  expect(header).toHaveAttribute('aria-sort', 'ascending')
  expect(names()).toEqual(['Blog', 'winkel', 'api-gateway'])
  await userEvent.keyboard('{Enter}')
  expect(header).toHaveAttribute('aria-sort', 'descending')
  expect(names()).toEqual(['api-gateway', 'winkel', 'Blog'])
  expect(onSortChange).toHaveBeenLastCalledWith({ column: 'memory', direction: 'descending' })
  // A column without sortValue has no button and no aria-sort.
  expect(screen.getByRole('columnheader', { name: 'Acties' })).not.toHaveAttribute('aria-sort')
})

test('a held sort leaves the order to the caller', () => {
  render(
    <DataTable
      label="Spaces"
      columns={COLUMNS}
      rows={SPACES}
      rowKey={(s) => s.id}
      labels={LABELS}
      sort={{ column: 'name', direction: 'ascending' }}
    />,
  )
  expect(names()).toEqual(['winkel', 'api-gateway', 'Blog'])
  expect(screen.getByRole('columnheader', { name: 'Naam' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  )
})

function Selectable({ onChange = vi.fn() }: { onChange?(keys: string[]): void }) {
  const [selected, setSelected] = useState<string[]>([])
  return (
    <DataTable
      label="Spaces"
      columns={COLUMNS}
      rows={SPACES}
      rowKey={(s) => s.id}
      rowName={(s) => s.name}
      labels={LABELS}
      selected={selected}
      onSelectedChange={(keys) => {
        setSelected(keys)
        onChange(keys)
      }}
    />
  )
}

test('rows are selected by their box; the head box selects all and shows mixed', async () => {
  const onChange = vi.fn()
  render(<Selectable onChange={onChange} />)
  await userEvent.click(screen.getByRole('checkbox', { name: 'Selecteer api-gateway' }))
  expect(onChange).toHaveBeenLastCalledWith(['s2'])
  const all = screen.getByRole('checkbox', { name: 'Alle rijen selecteren' })
  expect(all).toHaveAttribute('aria-checked', 'mixed')
  await userEvent.click(all)
  expect(onChange).toHaveBeenLastCalledWith(['s1', 's2', 's3'])
  expect(all).toBeChecked()
  await userEvent.click(all)
  expect(onChange).toHaveBeenLastCalledWith([])
})

test('loading shows placeholders and says busy', () => {
  render(
    <DataTable
      label="Spaces"
      columns={COLUMNS}
      rows={[]}
      rowKey={(s: Space) => s.id}
      labels={LABELS}
      loading
    />,
  )
  expect(screen.getByRole('table', { name: 'Spaces' })).toHaveAttribute('aria-busy', 'true')
  expect(screen.getAllByRole('row')).toHaveLength(4)
})

test('no rows shows the empty state across every column', () => {
  render(
    <DataTable
      label="Spaces"
      columns={COLUMNS}
      rows={[]}
      rowKey={(s: Space) => s.id}
      labels={LABELS}
      empty={<p>Nog geen spaces</p>}
    />,
  )
  const cell = screen.getByText('Nog geen spaces').closest('td')
  expect(cell).toHaveAttribute('colspan', '3')
})

test('an amount column aligns to the end on tabular figures', () => {
  render(
    <DataTable
      label="Spaces"
      columns={COLUMNS}
      rows={SPACES}
      rowKey={(s) => s.id}
      labels={LABELS}
    />,
  )
  expect(screen.getByText('512 MB').className).toContain('text-right')
  expect(screen.getByText('512 MB').className).toContain('tabular-nums')
})

test('a centred column centres its header and its cells', () => {
  render(
    <DataTable
      label="Rechten"
      columns={[
        { id: 'name', header: 'Recht', cell: (s: Space) => s.name },
        { id: 'on', header: 'Lid', cell: (s: Space) => `aan ${s.id}`, align: 'center' },
      ]}
      rows={SPACES}
      rowKey={(s) => s.id}
      labels={LABELS}
    />,
  )
  expect(screen.getByRole('columnheader', { name: 'Lid' }).className).toContain('text-center')
  expect(screen.getByText('aan s1').className).toContain('text-center')
})

test('with card a list stands beside the table for a narrow width', () => {
  render(
    <DataTable
      label="Spaces"
      columns={COLUMNS}
      rows={SPACES}
      rowKey={(s) => s.id}
      labels={LABELS}
      card={(s) => <span>{s.name} kaart</span>}
    />,
  )
  expect(screen.getByRole('list', { name: 'Spaces' })).toBeInTheDocument()
  expect(screen.getByText('winkel kaart')).toBeInTheDocument()
})

test('a row that cannot be selected has no box and stays out of select-all', async () => {
  const onSelectedChange = vi.fn()
  render(
    <DataTable
      label="Spaces"
      columns={COLUMNS}
      rows={SPACES}
      rowKey={(s) => s.id}
      rowName={(s) => s.name}
      labels={LABELS}
      selected={[]}
      onSelectedChange={onSelectedChange}
      canSelect={(s) => s.id !== 's1'}
    />,
  )
  expect(screen.queryByRole('checkbox', { name: 'Selecteer winkel' })).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Alle rijen selecteren' }))
  expect(onSelectedChange).toHaveBeenLastCalledWith(['s2', 's3'])
})

test('the current row is marked, and a click on a row opens it', async () => {
  const onRowClick = vi.fn()
  render(
    <DataTable
      label="Spaces"
      columns={COLUMNS}
      rows={SPACES}
      rowKey={(s) => s.id}
      labels={LABELS}
      current="s2"
      onRowClick={onRowClick}
    />,
  )
  const row = screen.getByText('api-gateway').closest('tr')
  expect(row).toHaveAttribute('aria-current', 'true')
  await userEvent.click(screen.getByText('Blog'))
  expect(onRowClick).toHaveBeenCalledWith(SPACES[2])
})
