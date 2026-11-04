import { cva } from 'class-variance-authority'
import { DropdownMenu as RadixDropdownMenu } from 'radix-ui'
import { createContext, type ReactNode, useContext, useId } from 'react'
import { Icon } from '../primitives/Icon'
import { Kbd } from '../primitives/Kbd'
import type { DropdownMenuHeader, DropdownMenuItem } from './DropdownMenu'
import { PANEL } from './panel'
import { usePortalContainer } from './portal'
import { Tooltip } from './Tooltip'

/**
 * The Radix parts the rows of a menu are drawn with, one set per kind of menu.
 *
 * `DropdownMenu` and `ContextMenu` share one item model and one way of drawing it; what differs is
 * only which Radix menu the rows belong to, since a row of one is not a row of the other (each
 * carries its own scope). Both sets have the same props: Radix builds the two on the same `Menu`.
 * `tallPanel` is here too, because the height Radix measures has a variable of its own per menu
 * (and a class is never assembled from pieces).
 */
export interface MenuParts {
  Item: typeof RadixDropdownMenu.Item
  CheckboxItem: typeof RadixDropdownMenu.CheckboxItem
  RadioGroup: typeof RadixDropdownMenu.RadioGroup
  RadioItem: typeof RadixDropdownMenu.RadioItem
  ItemIndicator: typeof RadixDropdownMenu.ItemIndicator
  Separator: typeof RadixDropdownMenu.Separator
  Group: typeof RadixDropdownMenu.Group
  Sub: typeof RadixDropdownMenu.Sub
  SubTrigger: typeof RadixDropdownMenu.SubTrigger
  SubContent: typeof RadixDropdownMenu.SubContent
  Portal: typeof RadixDropdownMenu.Portal
  /** The frame of a panel that may use the room Radix measured between it and the window's edge. */
  tallPanel: string
}

/** The parts of a `DropdownMenu`. */
export const DROPDOWN_PARTS: MenuParts = {
  Item: RadixDropdownMenu.Item,
  CheckboxItem: RadixDropdownMenu.CheckboxItem,
  RadioGroup: RadixDropdownMenu.RadioGroup,
  RadioItem: RadixDropdownMenu.RadioItem,
  ItemIndicator: RadixDropdownMenu.ItemIndicator,
  Separator: RadixDropdownMenu.Separator,
  Group: RadixDropdownMenu.Group,
  Sub: RadixDropdownMenu.Sub,
  SubTrigger: RadixDropdownMenu.SubTrigger,
  SubContent: RadixDropdownMenu.SubContent,
  Portal: RadixDropdownMenu.Portal,
  // The frame of `PANEL` with the height Radix measured instead of its 288px; the submenu's panel
  // is a `SubContent` of the same menu and reads the same variable.
  tallPanel: PANEL.replace('max-h-72', 'max-h-(--radix-dropdown-menu-content-available-height)'),
}

/** The parts of the menu being drawn; a provider of each menu sets its own. */
const Parts = createContext<MenuParts>(DROPDOWN_PARTS)

/** How roomy the rows of the menu at hand are; read by every row below, submenus included. */
const Density = createContext<'default' | 'comfortable'>('default')

/**
 * Whether the rows of the panel at hand keep a lead slot: true as soon as one row of the panel has
 * an icon, a glyph or a check at the start, so a row without one still starts its label in the
 * same column (Law of Proximity: one left edge for the words of a menu).
 */
const Lead = createContext(false)

const item = cva(
  // `cursor-default` and `select-none` per Radix's own `MenuItem` (a row is chosen, not read), and
  // `data-[highlighted]` is the roving-focus state Radix moves through the list — no focus ring of
  // our own here, for the same reason `Select`'s `ITEM` has none.
  'flex cursor-default items-center gap-2 rounded-md px-2 text-[13px] outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
  {
    variants: {
      tone: {
        default: 'text-fg data-[highlighted]:bg-surface-hover',
        danger: 'text-danger data-[highlighted]:bg-danger-subtle',
        quiet: 'text-secondary data-[highlighted]:bg-surface-hover',
      },
      density: {
        default: 'h-(--nt-control-md)',
        comfortable: 'h-9',
      },
    },
    defaultVariants: { tone: 'default', density: 'default' },
  },
)

/** What the body of a menu needs: its rows and how to draw them. */
export interface MenuBodyProps {
  parts: MenuParts
  items: readonly DropdownMenuItem[]
  checks: 'start' | 'end'
  density: 'default' | 'comfortable'
  header?: DropdownMenuHeader | undefined
}

/**
 * The inside of a menu's panel: the head (when there is one), a line, and the rows. The panel
 * around it, its trigger and its root are the menu's own.
 */
export function MenuBody({ parts, items, checks, density, header }: MenuBodyProps) {
  const headId = useId()
  const { Group } = parts
  return (
    <Parts.Provider value={parts}>
      <Density.Provider value={density}>
        {header === undefined ? (
          <Rows items={items} checks={checks} />
        ) : (
          <>
            <Head header={header} id={headId} />
            <Separator />
            <Group
              aria-labelledby={
                header.detail === undefined ? `${headId}-title` : `${headId}-title ${headId}-detail`
              }
            >
              <Rows items={items} checks={checks} />
            </Group>
          </>
        )}
      </Density.Provider>
    </Parts.Provider>
  )
}

/**
 * The head of a menu ({@link DropdownMenuHeader}): the glyph, and beside it the title in `fg` and
 * the detail in `muted` on one left line, 8px from the frame.
 *
 * `aria-hidden` like a `Heading`, for the same reason (a text child of `role="menu"` is what axe
 * reports as `aria-required-children`); the group under it takes its name from both lines through
 * `aria-labelledby`, which reads hidden text, so nothing it says is lost to a reader.
 */
function Head({ header, id }: { header: DropdownMenuHeader; id: string }) {
  return (
    <div data-nt-menu-head aria-hidden="true" className="flex items-center gap-2.5 p-2 select-none">
      {header.glyph}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span id={`${id}-title`} className="truncate text-[13px] leading-4 font-medium text-fg">
          {header.title}
        </span>
        {header.detail === undefined ? null : (
          <span id={`${id}-detail`} className="truncate text-[12px] leading-4 text-muted">
            {header.detail}
          </span>
        )}
      </div>
    </div>
  )
}

/** Whether a row draws something in the lead slot; a heading stands apart and does not count. */
function leads(row: DropdownMenuItem, checks: 'start' | 'end'): boolean {
  const kind = kindOf(row)
  if (kind === 'heading') return false
  if (row.glyph !== undefined) return true
  if (isChoice(row)) return checks === 'start'
  return row.icon !== undefined
}

/** The rows of a menu or a submenu, adjacent radio rows of one group in one `RadioGroup`. */
function Rows({ items, checks }: { items: readonly DropdownMenuItem[]; checks: 'start' | 'end' }) {
  const { RadioGroup } = useContext(Parts)
  const lead = items.some((row) => leads(row, checks))
  return (
    <Lead.Provider value={lead}>
      {segments(items).map((segment) =>
        segment.group === null ? (
          segment.rows.map((row) => <Row key={row.id} row={row} checks={checks} />)
        ) : (
          <RadioGroup
            key={`group-${segment.rows[0]?.id}`}
            value={segment.rows.find((row) => row.checked)?.id ?? ''}
          >
            {segment.rows.map((row) => (
              <Row key={row.id} row={row} checks={checks} />
            ))}
          </RadioGroup>
        ),
      )}
    </Lead.Provider>
  )
}

/** A run of rows: loose rows (`group: null`) or the adjacent radio rows of one group. */
interface Segment {
  group: string | null
  rows: DropdownMenuItem[]
}

/** Splits the rows into runs, so adjacent radio rows of one group share one `RadioGroup`. */
function segments(items: readonly DropdownMenuItem[]): Segment[] {
  const result: Segment[] = []
  for (const row of items) {
    const group = kindOf(row) === 'radio' ? (row.group ?? '') : null
    const last = result.at(-1)
    if (last && last.group === group) last.rows.push(row)
    else result.push({ group, rows: [row] })
  }
  return result
}

/** The kind a row is, with a `checked` row without `kind` counting as a `checkbox`. */
function kindOf(row: DropdownMenuItem): NonNullable<DropdownMenuItem['kind']> {
  return row.kind ?? (row.checked === undefined ? 'action' : 'checkbox')
}

/** The accessible name of a row: its label, with its count after a comma when it has one. */
function nameOf(row: DropdownMenuItem): string {
  if (row.value !== undefined) return `${row.label}: ${row.value}`
  return row.count === undefined ? row.label : `${row.label}, ${row.count}`
}

/** Whether a row is a choice, whose check the menu draws. */
function isChoice(row: DropdownMenuItem): boolean {
  const kind = kindOf(row)
  return kind === 'checkbox' || kind === 'radio'
}

/** The check of a choice row, shown only while it is on. */
function Check() {
  const { ItemIndicator } = useContext(Parts)
  // The slot keeps its 14px when the row is off, so the labels of a group stay in one column
  // with each other and with the icons of the plain rows.
  return (
    <span
      data-nt-menu-check
      className="flex size-(--nt-icon-sm) shrink-0 items-center justify-center"
    >
      <ItemIndicator className="contents">
        <Icon name="check" size="sm" />
      </ItemIndicator>
    </span>
  )
}

/** The empty lead slot of a row without a glyph, in a panel where other rows have one. */
function Blank() {
  return <span data-nt-menu-lead aria-hidden="true" className="size-(--nt-icon-sm) shrink-0" />
}

/**
 * The glyph slot of a row: the caller's own drawing, its icon, or for a choice with the checks at
 * the start a check that shows only when it is on; empty but kept when another row has one.
 */
function Glyph({ row, checks }: { row: DropdownMenuItem; checks: 'start' | 'end' }) {
  const density = useContext(Density)
  const lead = useContext(Lead)
  if (row.glyph !== undefined) return row.glyph
  if (isChoice(row) && checks === 'start') return <Check />
  if (isChoice(row) || row.icon === undefined) return lead ? <Blank /> : null
  // In a comfortable menu the icon steps back to `muted` and the words lead (design A).
  return density === 'comfortable' ? (
    <span data-nt-menu-icon className="flex text-muted">
      <Icon name={row.icon} size="sm" />
    </span>
  ) : (
    <Icon name={row.icon} size="sm" />
  )
}

/** The line above a row that asks for one (`separated`). */
function Separator() {
  const parts = useContext(Parts)
  return <parts.Separator className="-mx-1 my-1 h-px bg-border" />
}

/**
 * A heading over the rows under it: the name of a group of models under "Meer modellen".
 *
 * Not a Radix `Label` and not a stop of the walk: it is `aria-hidden`, because a text child of
 * `role="menu"` without a role of its own is what axe reports as `aria-required-children` (see the
 * reason span in `Choice`), and what it says is in the trigger's accessible name already.
 */
function Heading({ row }: { row: DropdownMenuItem }) {
  return (
    <>
      {row.separated ? <Separator /> : null}
      <div
        data-nt-menu-heading
        aria-hidden="true"
        className="flex h-(--nt-control-md) items-center gap-2 px-2 text-[12px] text-muted select-none"
      >
        {row.glyph ?? (row.icon === undefined ? null : <Icon name={row.icon} size="sm" />)}
        <span className="truncate">{row.label}</span>
      </div>
    </>
  )
}

/**
 * A row that opens rows of its own (Radix `Sub`): its label, its value quiet on the right and a
 * chevron, and a panel beside it in the same frame and the same portal container as the menu.
 */
function Submenu({ row, checks }: { row: DropdownMenuItem; checks: 'start' | 'end' }) {
  const container = usePortalContainer()
  const density = useContext(Density)
  const lead = useContext(Lead)
  const { Sub, SubTrigger, SubContent, Portal, tallPanel } = useContext(Parts)
  return (
    <>
      {row.separated ? <Separator /> : null}
      <Sub>
        <SubTrigger
          {...(row.disabled ? { disabled: true } : {})}
          {...(row.value === undefined ? {} : { 'aria-label': nameOf(row), textValue: row.label })}
          className={`${item({ tone: 'default', density })} data-[state=open]:bg-surface-hover`}
        >
          {row.glyph ??
            (row.icon === undefined ? lead ? <Blank /> : null : <Icon name={row.icon} size="sm" />)}
          <span className="truncate">{row.label}</span>
          {row.value === undefined ? null : (
            <span
              data-nt-menu-value
              className="ml-auto flex min-w-0 items-center gap-1.5 ps-4 text-muted"
            >
              {row.valueGlyph}
              <span className="truncate">{row.value}</span>
            </span>
          )}
          <span className={row.value === undefined ? 'ml-auto flex ps-4' : 'flex'}>
            <Icon name="chevron-right" size="sm" tone="faint" />
          </span>
        </SubTrigger>
        <Portal container={container}>
          <SubContent
            aria-label={row.label}
            // As on the menu itself: Radix names a submenu after its trigger, which here also
            // carries the value ("Agent: Relay"); the panel is named for what it lists.
            aria-labelledby={undefined}
            sideOffset={4}
            collisionPadding={8}
            className={tallPanel}
          >
            <Rows items={row.items ?? []} checks={checks} />
          </SubContent>
        </Portal>
      </Sub>
    </>
  )
}

/** One row of the menu, in whichever Radix form its kind asks for. */
function Row({ row, checks }: { row: DropdownMenuItem; checks: 'start' | 'end' }) {
  const kind = kindOf(row)
  if (kind === 'heading') return <Heading row={row} />
  if (kind === 'submenu') return <Submenu row={row} checks={checks} />
  return <Choice row={row} checks={checks} />
}

/** A row that does something when chosen: an action, a checkbox or a radio. */
function Choice({ row, checks }: { row: DropdownMenuItem; checks: 'start' | 'end' }) {
  const reasonId = useId()
  const density = useContext(Density)
  const { Item, CheckboxItem, RadioItem } = useContext(Parts)
  // A row that is `disabled` *and* carries a reason (`hint`) stays a real stop of the menu instead:
  // Radix's own `disabled` both removes a row from the roving-
  // focus walk — so ArrowDown skips straight over it — and sets `pointer-events: none` on it (the
  // `item` class below), so neither a real keyboard walk nor a hover could ever reach the row
  // whose reason they were meant to read. Guarded by hand instead, the same shape `PickTools`'s own
  // point button already uses: `aria-disabled` for assistive tech, `aria-describedby` at a hidden
  // sibling (never a child — inside the row it would join the row's own accessible *name*, not
  // just its description) so the reason reads without an open tooltip, dimmed without Radix's own
  // hook, and the action itself refused in `onSelect`.
  const guarded = row.disabled === true && row.hint !== undefined
  const common = {
    ...(row.disabled === undefined || guarded ? {} : { disabled: row.disabled }),
    ...(guarded ? { 'aria-disabled': true, 'aria-describedby': reasonId } : {}),
    // `aria-label` wins over content in the accessible-name algorithm, and `textValue` does the
    // same for Radix' typeahead — which otherwise reads the rendered text content, key included.
    // Both keep the row at just its label. Only set where they change anything, so a
    // row without a `shortcut` renders exactly as before.
    ...(row.shortcut === undefined && row.count === undefined
      ? {}
      : { 'aria-label': nameOf(row), textValue: row.label }),
    onSelect: (event: Event) => {
      if (guarded) {
        // Keeps the menu open, exactly what Radix's own `disabled` would have done by never
        // letting the select happen at all.
        event.preventDefault()
        return
      }
      row.onSelect?.()
    },
    className: guarded
      ? `${item({ tone: row.tone ?? 'default', density })} opacity-40`
      : item({ tone: row.tone ?? 'default', density }),
  }
  const content: ReactNode = (
    <>
      <Glyph row={row} checks={checks} />
      <span className="truncate">{row.label}</span>
      {row.count === undefined ? null : (
        <span data-nt-menu-count className="font-mono text-[11px] text-muted tabular-nums">
          {row.count}
        </span>
      )}
      {row.shortcut === undefined ? null : (
        <span className="ml-auto flex ps-4">
          {/* One cap around the whole shortcut ("⌘,"), never loose keys (design A). */}
          <Kbd tone="menu" shortcut={row.shortcut} />
        </span>
      )}
      {checks === 'end' && isChoice(row) ? (
        <span className="ml-auto flex ps-4">
          <Check />
        </span>
      ) : null}
    </>
  )
  const kind = kindOf(row)
  const element =
    kind === 'checkbox' ? (
      <CheckboxItem checked={row.checked === true} {...common}>
        {content}
      </CheckboxItem>
    ) : kind === 'radio' ? (
      <RadioItem value={row.id} {...common}>
        {content}
      </RadioItem>
    ) : (
      <Item {...common}>{content}</Item>
    )
  const hinted = row.hint === undefined ? element : <Tooltip label={row.hint}>{element}</Tooltip>
  // The reason, read as the row's description whether or not the tooltip is open — a sibling, not
  // a child of `element`: inside it the accessible-name algorithm would fold this text into the
  // row's own name instead of leaving it as a separate description.
  //
  // `hidden`, not `sr-only` (review, 3e ronde): `sr-only` keeps the span in the accessibility tree
  // as ordinary text, so a reader walking the menu in document order would hear it once on its own
  // and again as the row's `aria-describedby` — and axe reads a bare `<span>` sitting directly in
  // `role="menu"` as a child without one of the roles a menu requires (`aria-required-children`).
  // The HTML `hidden` attribute takes the span out of the tree entirely; `aria-describedby` still
  // reaches its text regardless; that reference is the one thing that does.
  const reason = guarded ? (
    <span id={reasonId} hidden>
      {row.hint}
    </span>
  ) : null
  return row.separated ? (
    <>
      <Separator />
      {reason}
      {hinted}
    </>
  ) : (
    <>
      {reason}
      {hinted}
    </>
  )
}
