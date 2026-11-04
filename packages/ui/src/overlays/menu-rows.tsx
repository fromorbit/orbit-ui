import { cva } from 'class-variance-authority'
import { DropdownMenu as RadixDropdownMenu } from 'radix-ui'
import { createContext, type ReactNode, useContext, useId } from 'react'
import { Icon } from '../primitives/Icon'
import { Kbd } from '../primitives/Kbd'
import { useUi } from '../provider/UiProvider'
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
  /**
   * The cap on a submenu's width: 256px (a step from its parent, not a second panel twice as
   * wide), or the room Radix measured on the side it opens to, so a
   * submenu flipped to the left on a phone ends at the window's edge and cuts its labels instead.
   * When neither side has room for its 160px, it slides back over its parent by what it lacks, so
   * it stays 8px inside the window (Radix only flips a submenu, it never moves it across).
   */
  subWidth: string
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
  subWidth:
    'max-w-[min(16rem,var(--radix-dropdown-menu-content-available-width))] data-[side=right]:translate-x-[min(0px,calc(var(--radix-dropdown-menu-content-available-width)-100%))] data-[side=left]:translate-x-[max(0px,calc(100%-var(--radix-dropdown-menu-content-available-width)))]',
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

/**
 * Whether the lead slot is as wide as the glyph of the head (30px, an `Avatar` of `md`) rather than
 * an icon's 14px: under a head with a glyph, so the labels of the rows start on the left edge of the
 * head's own title and every word of the panel stands on one line, the icons centred under the
 * avatar.
 */
const WideLead = createContext(false)

/**
 * The cap on a menu's width: 320px, or the window less the 8px of collision room on either side.
 * Without it a long label stretched the panel past the window's edge, and the `truncate` of every
 * label never had a width to cut at.
 */
export const MENU_WIDTH = 'max-w-[min(20rem,calc(100vw-16px))]'

const item = cva(
  // `cursor-default` and `select-none` per Radix's own `MenuItem` (a row is chosen, not read), and
  // `data-[highlighted]` is the roving-focus state Radix moves through the list — no focus ring of
  // our own here, for the same reason `Select`'s `ITEM` has none.
  //
  // A row the keyboard walked to (`focus-visible`: Radix moves the real focus with the walk, and the
  // browser marks it visible only after a key) stands on a step more tint, `surface-active` (the
  // keyboard caret of every list of the family), rather than a ring: a ring drew a framed chip
  // inside the frame of the panel. A danger row doubles its own tint the same way (the inset shadow
  // lays `danger-subtle` once more over it). The tint alone measured 1.2:1 against the panel, so
  // the caret also carries a 2px bar of the focus colour on its leading edge, inset 6px from top
  // and bottom: 3:1 and more in both themes (WCAG 1.4.11), the second cue a pointer's hover lacks.
  'relative flex cursor-default items-center gap-2 rounded-md px-2 text-[13px] outline-none select-none focus-visible:before:absolute focus-visible:before:inset-y-1.5 focus-visible:before:start-0 focus-visible:before:w-0.5 focus-visible:before:rounded-full focus-visible:before:bg-focus data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
  {
    variants: {
      tone: {
        default: 'text-fg data-[highlighted]:bg-surface-hover focus-visible:bg-surface-active',
        danger:
          'text-danger data-[highlighted]:bg-danger-subtle focus-visible:bg-danger-subtle focus-visible:shadow-[inset_0_0_0_100px_var(--nt-danger-subtle)]',
        quiet: 'text-secondary data-[highlighted]:bg-surface-hover focus-visible:bg-surface-active',
      },
      density: {
        // 44px under a coarse pointer, a target a finger finds (Fitts).
        default: 'h-(--nt-control-md) pointer-coarse:h-11',
        comfortable: 'h-9 pointer-coarse:h-11',
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
        <WideLead.Provider value={header?.glyph !== undefined}>
          {header === undefined ? (
            <Rows items={items} checks={checks} />
          ) : (
            <>
              <Head header={header} id={headId} />
              {/* The line under the head is drawing, not a stop: a reader entering the menu would
                otherwise hear "separator" before anything else, the head being hidden. */}
              <div
                data-nt-menu-head-line
                aria-hidden="true"
                className="-mx-1 my-1 h-px bg-border"
              />
              <Group
                aria-labelledby={
                  header.detail === undefined
                    ? `${headId}-title`
                    : `${headId}-title ${headId}-detail`
                }
              >
                <Rows items={items} checks={checks} />
              </Group>
            </>
          )}
        </WideLead.Provider>
      </Density.Provider>
    </Parts.Provider>
  )
}

/**
 * The head of a menu ({@link DropdownMenuHeader}): the glyph, and beside it the title in `fg` and
 * the detail in `muted` on one left line, 8px from the frame. The glyph stands in a slot of 30px
 * with 8px after it, the same slot and gap the rows under it lead with (`WideLead`), so the title
 * and the labels of the rows share one left edge.
 *
 * `aria-hidden` like a `Heading`, for the same reason (a text child of `role="menu"` is what axe
 * reports as `aria-required-children`); the group under it takes its name from both lines through
 * `aria-labelledby`, which reads hidden text, so nothing it says is lost to a reader.
 */
function Head({ header, id }: { header: DropdownMenuHeader; id: string }) {
  return (
    <div data-nt-menu-head aria-hidden="true" className="flex items-center gap-2 p-2 select-none">
      {header.glyph === undefined ? null : (
        <span className="flex w-7.5 shrink-0 justify-center">{header.glyph}</span>
      )}
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
  const prefix = useId()
  const wide = useContext(WideLead)
  const lead = wide || items.some((row) => leads(row, checks))
  const runs = segments(items)
  return (
    <Lead.Provider value={lead}>
      {runs.map((segment, index) => {
        if (segment.group === null) {
          return segment.rows.map((row) => (
            <Row key={row.id} row={row} checks={checks} headingId={`${prefix}-${row.id}`} />
          ))
        }
        // A radio group right under a heading takes its name from it ("Eenheid"), so a reader hears
        // what is being chosen rather than a bare "group".
        const before = runs[index - 1]?.rows.at(-1)
        const named = before !== undefined && kindOf(before) === 'heading'
        return (
          <RadioGroup
            key={`group-${segment.rows[0]?.id}`}
            value={segment.rows.find((row) => row.checked)?.id ?? ''}
            {...(named ? { 'aria-labelledby': `${prefix}-${before.id}` } : {})}
          >
            {segment.rows.map((row) => (
              <Row key={row.id} row={row} checks={checks} />
            ))}
          </RadioGroup>
        )
      })}
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

/**
 * The mark of a choice row, shown only while it is on: a check for a switch, a dot for one choice
 * of a group, so a pair of switches and a single choice never look alike (Law of Similarity).
 */
function Check({ radio }: { radio: boolean }) {
  const { ItemIndicator } = useContext(Parts)
  const wide = useContext(WideLead)
  // The slot keeps its 14px when the row is off, so the labels of a group stay in one column
  // with each other and with the icons of the plain rows.
  return (
    <span
      data-nt-menu-check
      className={`flex ${wide ? 'h-(--nt-icon-sm) w-7.5' : 'size-(--nt-icon-sm)'} shrink-0 items-center justify-center`}
    >
      <ItemIndicator className="contents">
        {radio ? (
          <span data-nt-menu-dot aria-hidden="true" className="size-1.5 rounded-full bg-current" />
        ) : (
          <Icon name="check" size="sm" />
        )}
      </ItemIndicator>
    </span>
  )
}

/** The empty lead slot of a row without a glyph, in a panel where other rows have one. */
function Blank() {
  const wide = useContext(WideLead)
  return (
    <span
      data-nt-menu-lead
      aria-hidden="true"
      className={`${wide ? 'h-(--nt-icon-sm) w-7.5' : 'size-(--nt-icon-sm)'} shrink-0`}
    />
  )
}

/** The lead slot under a head: 30px, its glyph centred under the head's avatar. */
function Wide({ children }: { children: ReactNode }) {
  const wide = useContext(WideLead)
  return wide ? <span className="flex w-7.5 shrink-0 justify-center">{children}</span> : children
}

/**
 * The glyph slot of a row: the caller's own drawing, its icon, or for a choice with the checks at
 * the start a check that shows only when it is on; empty but kept when another row has one.
 */
function Glyph({ row, checks }: { row: DropdownMenuItem; checks: 'start' | 'end' }) {
  const density = useContext(Density)
  const lead = useContext(Lead)
  if (row.glyph !== undefined) return <Wide>{row.glyph}</Wide>
  if (isChoice(row) && checks === 'start') return <Check radio={kindOf(row) === 'radio'} />
  if (isChoice(row) || row.icon === undefined) return lead ? <Blank /> : null
  // In a comfortable menu the icon steps back to `muted` and the words lead (design A); a danger
  // row keeps its icon in its own tone, so the one destructive act is one mark in either density.
  return density === 'comfortable' ? (
    <Wide>
      <span
        data-nt-menu-icon
        className={row.tone === 'danger' ? 'flex text-danger' : 'flex text-muted'}
      >
        <Icon name={row.icon} size="sm" />
      </span>
    </Wide>
  ) : (
    <Wide>
      <Icon name={row.icon} size="sm" />
    </Wide>
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
function Heading({ row, id }: { row: DropdownMenuItem; id: string }) {
  const lead = useContext(Lead)
  return (
    <>
      {row.separated ? <Separator /> : null}
      <div
        id={id}
        data-nt-menu-heading
        aria-hidden="true"
        className="flex h-(--nt-control-md) items-center gap-2 px-2 text-[12px] text-muted select-none"
      >
        {row.glyph !== undefined ? (
          <Wide>{row.glyph}</Wide>
        ) : row.icon !== undefined ? (
          <Wide>
            <Icon name={row.icon} size="sm" />
          </Wide>
        ) : lead ? (
          // On the column the labels start on, so a heading reads as the name of the rows under it.
          <Blank />
        ) : null}
        <span className="min-w-0 truncate">{row.label}</span>
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
  const { Sub, SubTrigger, SubContent, Portal, tallPanel, subWidth } = useContext(Parts)
  return (
    <>
      {row.separated ? <Separator /> : null}
      <Sub>
        <SubTrigger
          {...(row.disabled ? { disabled: true } : {})}
          {...(row.value === undefined ? {} : { 'aria-label': nameOf(row), textValue: row.label })}
          className={`${item({ tone: 'default', density })} data-[state=open]:bg-surface-hover`}
        >
          {row.glyph !== undefined ? (
            <Wide>{row.glyph}</Wide>
          ) : row.icon === undefined ? (
            lead ? (
              <Blank />
            ) : null
          ) : (
            <Wide>
              <Icon name={row.icon} size="sm" />
            </Wide>
          )}
          <span className="min-w-0 truncate">{row.label}</span>
          {row.value === undefined ? null : (
            <span
              data-nt-menu-value
              className="ml-auto flex min-w-0 items-center gap-1.5 ps-4 text-muted"
            >
              {row.valueGlyph}
              <span className="truncate">{row.value}</span>
            </span>
          )}
          {/* `muted`, not `faint`: the chevron is the only sign that a row opens rows of its own,
              so it owes the 3:1 of WCAG 1.4.11 (faint measured 2.5:1 on the panel). */}
          <span
            data-nt-menu-chevron
            className={
              row.value === undefined
                ? 'ml-auto flex shrink-0 ps-4 text-muted'
                : 'flex shrink-0 text-muted'
            }
          >
            <Icon name="chevron-right" size="sm" />
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
            className={`${tallPanel} ${subWidth}`}
          >
            <Rows items={row.items ?? []} checks={checks} />
          </SubContent>
        </Portal>
      </Sub>
    </>
  )
}

/** One row of the menu, in whichever Radix form its kind asks for. */
function Row({
  row,
  checks,
  headingId,
}: {
  row: DropdownMenuItem
  checks: 'start' | 'end'
  headingId?: string
}) {
  const kind = kindOf(row)
  if (kind === 'heading') return <Heading row={row} id={headingId ?? row.id} />
  if (kind === 'submenu') return <Submenu row={row} checks={checks} />
  return <Choice row={row} checks={checks} />
}

/** A row that does something when chosen: an action, a checkbox or a radio. */
function Choice({ row, checks }: { row: DropdownMenuItem; checks: 'start' | 'end' }) {
  const reasonId = useId()
  const density = useContext(Density)
  const { Item, CheckboxItem, RadioItem } = useContext(Parts)
  // The key a reader hears for the row, from the same port that draws it: the row's name stays its
  // label, and the key reaches assistive tech as a key (as on `Button` and `ChoiceCard`).
  const { shortcuts } = useUi()
  const keys = row.shortcut === undefined ? undefined : shortcuts.aria(row.shortcut)
  // A row that is `disabled` *and* carries a reason (`hint`) stays a real stop of the menu instead:
  // Radix's own `disabled` both removes a row from the roving-
  // focus walk — so ArrowDown skips straight over it — and sets `pointer-events: none` on it (the
  // `item` class below), so neither a real keyboard walk nor a hover could ever reach the row
  // whose reason they were meant to read. Guarded by hand instead, the same shape `PickTools`'s own
  // point button already uses: `aria-disabled` for assistive tech, `aria-describedby` at the
  // quiet line under it (`Reason`, a sibling: inside the row it would join the row's own accessible
  // *name*, not just its description), dimmed without Radix's own hook, and the action itself
  // refused in `onSelect`.
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
    ...(keys === undefined ? {} : { 'aria-keyshortcuts': keys }),
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
      <span className="min-w-0 truncate">{row.label}</span>
      {row.count === undefined ? null : (
        // A column of its own at the end, right-aligned in tabular figures, so the counts of a menu
        // stand under each other (5, 24, 41) instead of trailing each label at its own length.
        <span
          data-nt-menu-count
          className="ml-auto min-w-6 shrink-0 ps-4 text-end font-mono text-[11px] text-muted tabular-nums"
        >
          {row.count}
        </span>
      )}
      {row.shortcut === undefined ? null : (
        // Plain quiet text, right-aligned as in a native menu, no cap around it: a cap per row put
        // three or four frames inside the frame of the panel. Gone under a coarse pointer, where
        // nobody has the keys (the row's accessible name never held them). After a count it
        // follows it, rather than splitting the free room with it.
        <span
          data-nt-menu-shortcut
          className={`${row.count === undefined ? 'ml-auto ' : ''}flex shrink-0 ps-4 tabular-nums pointer-coarse:hidden`}
        >
          <Kbd tone="quiet" shortcut={row.shortcut} />
        </span>
      )}
      {checks === 'end' && isChoice(row) ? (
        <span className="ml-auto flex shrink-0 ps-4">
          <Check radio={kindOf(row) === 'radio'} />
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
  // A guarded row shows its reason in sight (`Reason`, under it); a tooltip would only say it again.
  const hinted =
    row.hint === undefined || guarded ? element : <Tooltip label={row.hint}>{element}</Tooltip>
  return (
    <>
      {row.separated ? <Separator /> : null}
      {hinted}
      {guarded ? <Reason id={reasonId} text={row.hint ?? ''} /> : null}
    </>
  )
}

/**
 * Why a row is out of reach for now, in a quiet 12px line under it: a dimmed row with its reason
 * out of sight did not tell a reader what to wait for. Not dimmed with the row, so it stays legible
 * (`muted`, 5:1 and more on the panel), and on the column of the labels.
 *
 * A sibling of the row, never a child (inside it the accessible-name algorithm would fold this into
 * the row's own name), and `aria-hidden`, like a `Heading`: a text child of `role="menu"` is what
 * axe reports as `aria-required-children`, and a reader hears it once, as the row's
 * `aria-describedby`, which reads hidden text.
 */
function Reason({ id, text }: { id: string; text: string }) {
  const lead = useContext(Lead)
  const wide = useContext(WideLead)
  const inset = !lead ? 'ps-2' : wide ? 'ps-11.5' : 'ps-7.5'
  return (
    <div
      id={id}
      data-nt-menu-reason
      aria-hidden="true"
      className={`-mt-1 pe-2 pb-1.5 text-[12px] leading-4 text-muted select-none ${inset}`}
    >
      {text}
    </div>
  )
}
