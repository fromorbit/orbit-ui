import { type ReactNode, useState } from 'react'
import { Checkbox } from '../primitives/Checkbox'
import { Icon } from '../primitives/Icon'
import { Skeleton } from '../primitives/Skeleton'

/** The way a column is sorted. */
export type SortDirection = 'ascending' | 'descending'

/** Which column the table is sorted by, and which way. */
export interface DataTableSort {
  column: string
  direction: SortDirection
}

/** Below which width of the table a column steps aside, so the narrow table keeps what matters. */
export type DataTableHideBelow = 'md' | 'lg' | 'xl'

/** One column of a `DataTable`. */
export interface DataTableColumn<Row> {
  id: string
  /** The words in the head; also the name of its sort button. */
  header: string
  /** What a row shows in this column. */
  cell(row: Row): ReactNode
  /** Makes the column sortable, by this value of each row (text compares in the locale's order). */
  sortValue?(row: Row): string | number
  /**
   * `end` for amounts and counts, which line up on their last digit; `center` for a column of
   * boxes or marks, such as the rights of a role; `start` by default.
   */
  align?: 'start' | 'center' | 'end'
  /** Steps aside below this width of the table: `md` 48rem, `lg` 56rem, `xl` 72rem. */
  hideBelow?: DataTableHideBelow
  /** Hides the words of the head (they still name it): for a column of row menus. */
  headerHidden?: boolean
}

/** The words of `DataTable`. */
export interface DataTableLabels {
  /** The name of the box in the head: "Alle rijen selecteren". */
  selectAll: string
  /** The name of a row's box: "Selecteer api-gateway". */
  selectRow(name: string): string
}

/** The props of `DataTable`. */
export interface DataTableProps<Row> {
  /** The accessible name of the table: "Spaces". */
  label: string
  columns: readonly DataTableColumn<Row>[]
  rows: readonly Row[]
  /** A stable key per row: its id. */
  rowKey(row: Row): string
  labels: DataTableLabels
  /** The name of a row, for its box: "api-gateway". Needed with `selected`. */
  rowName?(row: Row): string
  /** The keys of the rows that are selected; giving it adds a column of boxes. */
  selected?: readonly string[]
  onSelectedChange?(keys: string[]): void
  /** The key of the row that is open beside the table: the active fill and `aria-current`. */
  current?: string
  /**
   * A click anywhere on a row, to open it. A pointer convenience only: give the row a control of
   * its own too (a button on its name), so the keyboard reaches it.
   */
  onRowClick?(row: Row): void
  /** Whether a row may be selected at all, such as every branch but the default one; yes by default. */
  canSelect?(row: Row): boolean
  /** The sort to start with; the table keeps it from there unless `sort` is given. */
  defaultSort?: DataTableSort
  /** The sort, held by the caller (for a server that sorts); the rows then come sorted. */
  sort?: DataTableSort | null
  onSortChange?(sort: DataTableSort): void
  /** While the rows are on their way: lines of placeholders and `aria-busy`. */
  loading?: boolean
  /** What stands in the table without rows: an `EmptyState`. */
  empty?: ReactNode
  /**
   * A row as a card, for a table narrower than 48rem: the columns then give way to one block per
   * row. Left out, the table scrolls sideways instead.
   */
  card?(row: Row): ReactNode
}

// Written out per value: Tailwind finds a class only as a literal in the source.
const HIDE: Record<DataTableHideBelow, string> = {
  md: 'hidden @3xl:table-cell',
  lg: 'hidden @4xl:table-cell',
  xl: 'hidden @6xl:table-cell',
}

/** The classes of a cell, from its column. */
function cellClass(column: {
  align?: 'start' | 'center' | 'end'
  hideBelow?: DataTableHideBelow
}): string {
  const align =
    column.align === 'end'
      ? 'text-right tabular-nums'
      : column.align === 'center'
        ? 'text-center'
        : 'text-left'
  return column.hideBelow ? `${align} ${HIDE[column.hideBelow]}` : align
}

/** Text in the locale's order, numbers by size. */
function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

/** The rows in the order of `sort`, stable for equal values. */
export function sortRows<Row>(
  rows: readonly Row[],
  columns: readonly DataTableColumn<Row>[],
  sort: DataTableSort | null | undefined,
): Row[] {
  const column = sort ? columns.find((c) => c.id === sort.column) : undefined
  const value = column?.sortValue
  if (!sort || !value) return [...rows]
  const sign = sort.direction === 'ascending' ? 1 : -1
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => sign * compare(value(a.row), value(b.row)) || a.index - b.index)
    .map((entry) => entry.row)
}

/**
 * Rows of data with columns that sort, rows that can be selected, and a loading and an empty
 * state: the list of spaces, deployments or invoices.
 *
 * A real `<table>`, so a screen reader walks it by row and column and hears each header. A sortable
 * header is a button inside the `<th>`, whose `aria-sort` says the current order; a press sorts
 * ascending, a second press descending. With `selected` the first column holds a box per row and
 * one in the head that selects every row, `indeterminate` while some are; a selected row carries
 * the active fill. Amounts align to the end (`align: 'end'`) on tabular figures. The table measures
 * itself, not the window (`@container`): columns step aside at a width of their own, and with
 * `card` a narrow table turns into a list of cards.
 *
 * `EditableTable` is the other table of the library, for typing values in; this one shows them.
 */
export function DataTable<Row>({
  label,
  columns,
  rows,
  rowKey,
  labels,
  rowName,
  selected,
  onSelectedChange,
  canSelect,
  current,
  onRowClick,
  defaultSort,
  sort: heldSort,
  onSortChange,
  loading = false,
  empty,
  card,
}: DataTableProps<Row>) {
  const [ownSort, setOwnSort] = useState<DataTableSort | null>(defaultSort ?? null)
  const held = heldSort !== undefined
  const sort = held ? heldSort : ownSort
  const shown = held ? [...rows] : sortRows(rows, columns, sort)
  const selectable = selected !== undefined
  const chosen = new Set(selected ?? [])
  const keys = rows.filter((row) => canSelect?.(row) ?? true).map(rowKey)
  const chosenCount = keys.filter((key) => chosen.has(key)).length
  const all = keys.length > 0 && chosenCount === keys.length
  const headBox: boolean | 'indeterminate' = all ? true : chosenCount > 0 ? 'indeterminate' : false
  const span = columns.length + (selectable ? 1 : 0)

  function sortBy(column: string) {
    const next: DataTableSort = {
      column,
      direction:
        sort?.column === column && sort.direction === 'ascending' ? 'descending' : 'ascending',
    }
    if (!held) setOwnSort(next)
    onSortChange?.(next)
  }

  function toggle(key: string, on: boolean) {
    const after = new Set(chosen)
    if (on) after.add(key)
    else after.delete(key)
    onSelectedChange?.(keys.filter((k) => after.has(k)))
  }

  const table = (
    <table
      aria-label={label}
      aria-busy={loading || undefined}
      className={`w-full border-collapse text-left text-[13px] ${card ? 'hidden @3xl:table' : ''}`}
    >
      <thead>
        <tr className="border-border border-b text-[12px] text-muted">
          {selectable ? (
            <th scope="col" className="w-11 py-2.5 ps-4 pe-0 font-normal">
              <span className="flex items-center">
                <Checkbox
                  label={labels.selectAll}
                  checked={headBox}
                  disabled={keys.length === 0}
                  onCheckedChange={(on) => onSelectedChange?.(on ? keys : [])}
                />
              </span>
            </th>
          ) : null}
          {columns.map((column) => {
            const sorted = sort?.column === column.id ? sort.direction : undefined
            return (
              <th
                key={column.id}
                scope="col"
                aria-sort={column.sortValue ? (sorted ?? 'none') : undefined}
                className={`px-3 py-2.5 font-normal ${cellClass(column)}`}
              >
                {column.sortValue ? (
                  <button
                    type="button"
                    onClick={() => sortBy(column.id)}
                    className={`no-drag -mx-1 inline-flex items-center gap-1 rounded-sm px-1 outline-focus hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 ${sorted ? 'text-fg' : ''}`}
                  >
                    {column.header}
                    <span className={sorted ? '' : 'opacity-0'}>
                      <Icon name={sorted === 'descending' ? 'arrow-down' : 'arrow-up'} size="sm" />
                    </span>
                  </button>
                ) : column.headerHidden ? (
                  <span className="sr-only">{column.header}</span>
                ) : (
                  column.header
                )}
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          [0, 1, 2].map((line) => (
            <tr key={line} className="border-border border-b last:border-b-0">
              {selectable ? <td className="py-3.5 ps-4" /> : null}
              {columns.map((column) => (
                <td key={column.id} className={`px-3 py-3.5 ${cellClass(column)}`}>
                  {/* A width that yields: the skeleton never holds a column wider than its words would. */}
                  <span
                    className={`block w-full ${column.align === 'end' ? 'ms-auto max-w-16' : 'max-w-32'}`}
                  >
                    <Skeleton />
                  </span>
                </td>
              ))}
            </tr>
          ))
        ) : shown.length === 0 ? (
          <tr>
            <td colSpan={span} className="p-0">
              {empty}
            </td>
          </tr>
        ) : (
          shown.map((row) => {
            const key = rowKey(row)
            const on = chosen.has(key) || key === current
            return (
              <tr
                key={key}
                aria-current={key === current ? 'true' : undefined}
                {...(onRowClick ? { onClick: () => onRowClick(row) } : {})}
                className={`border-border border-b last:border-b-0 hover:bg-row-hover ${on ? 'bg-row-active' : ''}`}
              >
                {selectable && !(canSelect?.(row) ?? true) ? (
                  <td className="py-3 ps-4 pe-0" />
                ) : selectable ? (
                  <td className="py-3 ps-4 pe-0">
                    <span className="flex items-center">
                      <Checkbox
                        label={labels.selectRow(rowName?.(row) ?? key)}
                        checked={on}
                        onCheckedChange={(next) => toggle(key, next)}
                      />
                    </span>
                  </td>
                ) : null}
                {columns.map((column) => (
                  <td key={column.id} className={`px-3 py-3 text-fg ${cellClass(column)}`}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )

  return (
    <div data-nt-data-table className="@container w-full min-w-0 overflow-x-auto">
      {table}
      {card && loading ? (
        // The narrow form of a loading table: skeleton rows in the shape of the cards, not the
        // desktop columns squeezed into a phone.
        <ul aria-hidden="true" className="m-0 flex list-none flex-col p-0 @3xl:hidden">
          {[0, 1, 2].map((line) => (
            <li
              key={line}
              className="flex flex-col gap-2 border-border border-b px-4 py-3 last:border-b-0"
            >
              <Skeleton width="md" />
              <Skeleton width="sm" />
            </li>
          ))}
        </ul>
      ) : null}
      {card && !loading ? (
        <ul aria-label={label} className="m-0 flex list-none flex-col p-0 @3xl:hidden">
          {shown.length === 0 ? (
            <li>{empty}</li>
          ) : (
            shown.map((row) => (
              <li key={rowKey(row)} className="border-border border-b last:border-b-0">
                {card(row)}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
