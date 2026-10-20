import { type ReactNode, useEffect, useRef } from 'react'
import { Tooltip } from '../overlays/Tooltip'
import { Button } from '../primitives/Button'
import { Icon } from '../primitives/Icon'
import { IconButton } from '../primitives/IconButton'

/** One column of an `EditableTable`. */
export interface EditableTableColumn<Row> {
  id: string
  /** The visible column header. */
  header: string
  /**
   * Draws the cell. `label` is the accessible name for the field in it ("Naam, rij 2"): the
   * header alone would give every field of the column the same name.
   */
  cell(row: Row, index: number, label: string): ReactNode
  /** `grow` (the default) takes the room that is left; `fit` is as narrow as its content. */
  width?: 'grow' | 'fit'
}

/** The words of an `EditableTable`, in the host's language. */
export interface EditableTableLabels {
  /** The add button, unless `addLabel` says otherwise: "Toevoegen". */
  add: string
  /** The header of the column of remove buttons, for a screen reader only: "Verwijderen". */
  removeColumn: string
  /** A row's remove button, from its name or number: "Verwijder rij 2". */
  remove(row: string): string
  /** The name of a field in a cell, its column and row: "Naam, rij 2". */
  cell(column: string, row: string): string
}

/** The props of `EditableTable`. */
export interface EditableTableProps<Row> {
  /** The table's accessible name ("Statussen van een spec"). */
  label: string
  /** The words of the table's own controls, in the host's language; the library holds none. */
  labels: EditableTableLabels
  columns: readonly EditableTableColumn<Row>[]
  rows: readonly Row[]
  /** A stable key per row; not its index, or a removal would move every field's state up. */
  rowKey(row: Row, index: number): string
  /** Names a row in its remove button; its number ("rij 2") when left out. */
  rowLabel?(row: Row, index: number): string
  /** The whole name of a row's remove button, where `labels.remove` does not read well. */
  removeLabel?(row: Row, index: number): string
  /** Appends a row; the focus then goes into its first field. */
  onAdd(): void
  onRemove(index: number): void
  /** The fewest rows it keeps: at that count the remove buttons are gone. */
  minRows?: number
  /** The most rows it holds: at that count "Toevoegen" is gone. */
  maxRows?: number
  /** The add button's words; `labels.add` when left out. */
  addLabel?: string
  disabled?: boolean
}

/**
 * Rows of fields under column headers, with a remove button per row and one way to add.
 *
 * Built for the statuses of an SDD profile: there each row was an `Input`, a
 * `Select` and a `Checkbox` without a header, a dash as the remove button and a loose text button
 * under the list. Here the headers say what each column is, the remove button is a `trash-2` with
 * a name of its own, and the keyboard never falls back to the top of the page: after "Toevoegen"
 * the focus is in the new row's first field, after a removal on the remove button that took its
 * place (or the one above, or "Toevoegen").
 */
export function EditableTable<Row>({
  label,
  labels,
  columns,
  rows,
  rowKey,
  rowLabel,
  removeLabel,
  onAdd,
  onRemove,
  minRows = 0,
  maxRows,
  addLabel,
  disabled,
}: EditableTableProps<Row>) {
  const body = useRef<HTMLTableSectionElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  const pending = useRef<{ kind: 'added' } | { kind: 'removed'; index: number } | null>(null)

  // Runs once the caller has rendered the new rows, which is when there is something to focus.
  // biome-ignore lint/correctness/useExhaustiveDependencies: new rows are the signal; what to focus is read from the DOM they rendered.
  useEffect(() => {
    const next = pending.current
    if (next === null) return
    pending.current = null
    const rowsNow = body.current?.querySelectorAll('tr') ?? []
    if (next.kind === 'added') {
      rowsNow[rowsNow.length - 1]
        ?.querySelector<HTMLElement>('input, button, textarea, [tabindex]')
        ?.focus()
      return
    }
    const row = rowsNow[next.index] ?? rowsNow[next.index - 1]
    const remove = row?.querySelector<HTMLElement>('[data-nt-table-remove]')
    if (remove) remove.focus()
    else addButton.current?.focus()
  }, [rows])

  const removable = rows.length > minRows
  const addable = maxRows === undefined || rows.length < maxRows
  const nameOf = (row: Row, index: number) => rowLabel?.(row, index) ?? String(index + 1)

  return (
    <div className="flex flex-col items-start gap-1">
      <table aria-label={label} className="w-full border-collapse text-left">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={`px-1 pb-1 text-[11px] font-medium text-muted ${
                  column.width === 'fit' ? 'w-px whitespace-nowrap' : ''
                }`}
              >
                {column.header}
              </th>
            ))}
            <th scope="col" className="w-px p-0">
              <span className="sr-only">{labels.removeColumn}</span>
            </th>
          </tr>
        </thead>
        <tbody ref={body}>
          {rows.map((row, index) => {
            const number = String(index + 1)
            return (
              <tr key={rowKey(row, index)}>
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={`px-1 py-0.5 align-middle ${column.width === 'fit' ? 'w-px whitespace-nowrap' : ''}`}
                  >
                    {column.cell(row, index, labels.cell(column.header, number))}
                  </td>
                ))}
                <td className="w-px py-0.5 pl-1 align-middle">
                  {removable ? (
                    <RemoveButton
                      label={removeLabel?.(row, index) ?? labels.remove(nameOf(row, index))}
                      disabled={disabled}
                      onRemove={() => {
                        pending.current = { kind: 'removed', index }
                        onRemove(index)
                      }}
                    />
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {addable ? (
        <Button
          ref={addButton}
          size="sm"
          variant="ghost"
          disabled={disabled}
          onClick={() => {
            pending.current = { kind: 'added' }
            onAdd()
          }}
        >
          <Icon name="plus" size="sm" />
          {addLabel ?? labels.add}
        </Button>
      ) : null}
    </div>
  )
}

/** The `trash-2` of one row, with its name as its tooltip too. */
function RemoveButton({
  label,
  disabled,
  onRemove,
}: {
  label: string
  disabled: boolean | undefined
  onRemove(): void
}) {
  return (
    <Tooltip label={label}>
      <IconButton
        data-nt-table-remove
        icon="trash-2"
        label={label}
        size="sm"
        disabled={disabled}
        onClick={onRemove}
      />
    </Tooltip>
  )
}
