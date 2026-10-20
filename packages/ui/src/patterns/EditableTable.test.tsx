import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { TooltipProvider } from '../overlays/Tooltip'
import { Input } from '../primitives/Input'
import { nl } from '../testing/labels'
import { EditableTable, type EditableTableProps } from './EditableTable'

interface Status {
  id: number
  name: string
}

let nextId = 10

/** A table of statuses with one text column, keeping its rows the way a caller would. */
function Harness({
  initial = [
    { id: 1, name: 'Concept' },
    { id: 2, name: 'Klaar' },
  ],
  onRemoveSpy,
  ...rest
}: Partial<EditableTableProps<Status>> & {
  initial?: Status[]
  onRemoveSpy?: (index: number) => void
}) {
  const [rows, setRows] = useState(initial)
  return (
    <TooltipProvider>
      <EditableTable<Status>
        label="Statussen"
        labels={nl.editableTable}
        rowKey={(row) => String(row.id)}
        columns={[
          {
            id: 'name',
            header: 'Naam',
            cell: (row, index, label) => (
              <Input
                label={label}
                size="sm"
                value={row.name}
                onChange={(event) =>
                  setRows((all) =>
                    all.map((other, at) =>
                      at === index ? { ...other, name: event.target.value } : other,
                    ),
                  )
                }
              />
            ),
          },
          { id: 'kind', header: 'Soort', width: 'fit', cell: () => <span>open</span> },
        ]}
        {...rest}
        rows={rows}
        onAdd={() => setRows((all) => [...all, { id: nextId++, name: '' }])}
        onRemove={(index) => {
          onRemoveSpy?.(index)
          setRows((all) => all.filter((_, at) => at !== index))
        }}
      />
    </TooltipProvider>
  )
}

function table(): HTMLElement {
  return screen.getByRole('table', { name: 'Statussen' })
}

test('the table names its columns in a header row', () => {
  render(<Harness />)
  const headers = within(table()).getAllByRole('columnheader')
  expect(headers.map((header) => header.textContent)).toEqual(['Naam', 'Soort', 'Verwijderen'])
})

test('the column of the remove buttons has a header only for the reader', () => {
  render(<Harness />)
  const last = within(table()).getAllByRole('columnheader').at(-1)
  expect(last?.querySelector('.sr-only')).not.toBeNull()
})

test('each row is a table row, its fields named by column and row', () => {
  render(<Harness />)
  expect(within(table()).getAllByRole('row')).toHaveLength(3)
  expect(screen.getByRole('textbox', { name: 'Naam, rij 2' })).toHaveValue('Klaar')
})

test('each row has a remove button with a real icon and a name of its own', () => {
  render(<Harness />)
  const remove = screen.getByRole('button', { name: 'Verwijder rij 2' })
  expect(remove.querySelector('svg')).not.toBeNull()
})

test('a row label of the caller names the remove button', () => {
  render(<Harness rowLabel={(row) => row.name} />)
  expect(screen.getByRole('button', { name: 'Verwijder rij Klaar' })).toBeInTheDocument()
})

test('a whole name of the caller replaces the words of the remove button', () => {
  render(<Harness removeLabel={(row) => `Verwijder ${row.name}`} />)
  expect(screen.getByRole('button', { name: 'Verwijder Klaar' })).toBeInTheDocument()
})

test('removing a row hands the focus to the remove button that takes its place', async () => {
  const spy = vi.fn()
  render(
    <Harness
      initial={[
        { id: 1, name: 'Concept' },
        { id: 2, name: 'Bezig' },
        { id: 3, name: 'Klaar' },
      ]}
      onRemoveSpy={spy}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Verwijder rij 1' }))
  expect(spy).toHaveBeenCalledWith(0)
  expect(screen.getByRole('textbox', { name: 'Naam, rij 1' })).toHaveValue('Bezig')
  expect(screen.getByRole('button', { name: 'Verwijder rij 1' })).toHaveFocus()
})

test('removing the last row hands the focus to the row above it', async () => {
  render(<Harness />)
  await userEvent.click(screen.getByRole('button', { name: 'Verwijder rij 2' }))
  expect(screen.getByRole('button', { name: 'Verwijder rij 1' })).toHaveFocus()
})

test('adding a row puts the focus in its first field', async () => {
  render(<Harness />)
  await userEvent.click(screen.getByRole('button', { name: 'Toevoegen' }))
  const added = screen.getByRole('textbox', { name: 'Naam, rij 3' })
  expect(added).toHaveFocus()
  await userEvent.keyboard('Afgerond')
  expect(added).toHaveValue('Afgerond')
})

test('minRows keeps the remove buttons of the last rows away', () => {
  render(<Harness minRows={2} />)
  expect(screen.queryByRole('button', { name: /Verwijder rij/ })).toBeNull()
})

test('maxRows turns adding off once the table is full', () => {
  render(<Harness maxRows={2} />)
  expect(screen.queryByRole('button', { name: 'Toevoegen' })).toBeNull()
})

test('the add button takes a label of its own', () => {
  render(<Harness addLabel="Status toevoegen" />)
  expect(screen.getByRole('button', { name: 'Status toevoegen' })).toBeInTheDocument()
})

test('disabled turns adding and removing off', () => {
  render(<Harness disabled />)
  expect(screen.getByRole('button', { name: 'Toevoegen' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Verwijder rij 1' })).toBeDisabled()
})

test('an empty table still shows its headers and the way to add', () => {
  render(<Harness initial={[]} />)
  expect(within(table()).getAllByRole('columnheader')).toHaveLength(3)
  expect(screen.getByRole('button', { name: 'Toevoegen' })).toBeInTheDocument()
})
