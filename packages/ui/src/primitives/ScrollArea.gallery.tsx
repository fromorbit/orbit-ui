import type { Story } from '../gallery/story'
import { Button } from './Button'
import { ScrollArea } from './ScrollArea'

/** More rows than fit in the fixed-height container below, so the scrollbar is always visible. */
const rows = Array.from({ length: 30 }, (_, index) => `Row ${index + 1}`)

function Rows() {
  return (
    <ul className="m-0 list-none p-0">
      {rows.map((row) => (
        <li
          key={row}
          className="border-border border-b px-2 py-1.5 text-fg text-[13px] last:border-b-0"
        >
          {row}
        </li>
      ))}
    </ul>
  )
}

/** The same rows, but each one focusable by itself — the case that needs no label. */
function ButtonRows() {
  return (
    <div className="flex flex-col p-1">
      {rows.map((row) => (
        <Button key={row} variant="ghost" size="sm" block onClick={() => {}}>
          {row}
        </Button>
      ))}
    </div>
  )
}

/**
 * Rows whose text is far wider than the column they stand in, so they have to truncate.
 *
 * Plain lines rather than `Button`s, for two reasons: a primitive may not import a pattern, so the
 * real case (`ListRow`) cannot appear here, and a `Button` has a fixed height and wraps rather
 * than truncates, which would show a trait of the button instead of one of this component. The
 * buttons below are what keeps the viewport out of the tab order.
 */
function TruncatingRows() {
  return (
    <div className="flex flex-col p-1">
      <div className="truncate px-2 text-[13px] text-fg">
        A line of text far too long to fit inside this narrow column
      </div>
      <div className="truncate px-2 text-[13px] text-muted">
        And a second one, just as long, that has to end in an ellipsis
      </div>
      {rows.map((row) => (
        <Button key={row} variant="ghost" size="sm" block onClick={() => {}}>
          {row}
        </Button>
      ))}
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'ScrollArea',
  states: {
    Default: () => (
      // The fixed height lives here, in the story: `ScrollArea` itself only fills whatever box
      // it is given.
      <div className="h-48 w-64 rounded-md border border-border bg-surface">
        <ScrollArea label="Rows">
          <Rows />
        </ScrollArea>
      </div>
    ),
    'With focusable content': () => (
      // No label: the buttons are the tab stops, so the viewport adds none of its own.
      <div className="h-48 w-64 rounded-md border border-border bg-surface">
        <ScrollArea>
          <ButtonRows />
        </ScrollArea>
      </div>
    ),
    'With a row that must truncate': () => (
      // The sidebar's case: the column has a fixed width and a row's text does not. It has to
      // truncate inside the column, never widen it — see the Radix note in ScrollArea.tsx.
      <div className="h-48 w-56 rounded-md border border-border bg-surface">
        <ScrollArea>
          <TruncatingRows />
        </ScrollArea>
      </div>
    ),
    'Long list': () => (
      // The two shapes, one above the other, which should not be told apart: `ScrollArea` draws its own
      // bar over the content, and a plain `overflow-y-auto` gets the global one from `index.css`
      // (8px, the same thumb, no track, no arrows). Point at either to see its thumb.
      <div className="flex flex-col gap-4">
        <div className="h-48 w-64 rounded-md border border-border bg-surface">
          <ScrollArea label="Rows in a ScrollArea">
            <Rows />
          </ScrollArea>
        </div>
        <div
          data-nt-plain-scroller
          className="h-48 w-64 overflow-y-auto rounded-md border border-border bg-surface"
        >
          <ButtonRows />
        </div>
      </div>
    ),
  },
} satisfies Story
