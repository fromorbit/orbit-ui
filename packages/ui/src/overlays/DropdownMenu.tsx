import { cva } from 'class-variance-authority'
import { DropdownMenu as RadixDropdownMenu } from 'radix-ui'
import { createContext, type ReactElement, type ReactNode, useContext, useId } from 'react'
import { handBackOnlyLostFocus } from '../primitives/hand-back'
import { Icon, type IconName } from '../primitives/Icon'
import { Kbd } from '../primitives/Kbd'
import type { ShortcutLabel } from '../primitives/shortcut'
import { PANEL } from './panel'
import { usePortalContainer } from './portal'
import { Tooltip } from './Tooltip'

/** One row of the menu: the handful of things a caller may do to whatever the trigger sits on. */
export interface DropdownMenuItem {
  id: string
  label: string
  /**
   * The glyph in front of a plain row. **Ignored on a choice row** (a `checkbox` or `radio`, or a
   * row with `checked`): its slot holds the check instead, so the rows of a menu stay aligned.
   */
  icon?: IconName
  /**
   * A drawing of the caller's own in front of the label, for what `Icon` has no glyph for: the mark
   * of an agent's maker (`BrandIcon`). Unlike `icon` it stays on a choice row, since with
   * `checks="end"` the check has a slot of its own at the end.
   */
  glyph?: ReactNode
  /**
   * `danger` colours the row for a destructive action, e.g. "Verwijderen"; `quiet` dims a row that
   * closes the menu off without being its point, in `text-secondary` (Afmelden at the foot of the
   * account menu, design A); `default` is the rest.
   */
  tone?: 'default' | 'danger' | 'quiet'
  disabled?: boolean
  /**
   * The command whose key is shown right-aligned in a `Kbd`, e.g. `'browser.hardReload'`, read
   * through the host's `ShortcutPort` (which may also take a written-out key, `"⌘N"`).
   *
   * **This is a label, not a binding.** Nothing in this component listens for the key it names —
   * a caller that wires the real shortcut does so elsewhere, and this only shows what it is. It is
   * kept out of the row's accessible name (`aria-label`) and out of its typeahead text
   * (`textValue`): Radix's own `MenuItem` falls back to the rendered text content for both, which
   * would otherwise let a reader reach "Hernoemen R" by typing the key it merely displays.
   */
  shortcut?: ShortcutLabel
  /**
   * How many things this row stands for, drawn after its label in quiet mono — the scope picker of
   * Specs lists "Open 24". It joins the row's accessible name ("Open, 24"),
   * as a pill's count does, but never its typeahead text: typing "O" still reaches "Open".
   */
  count?: number
  /**
   * A setting rather than an act: `checkbox` is a switch that is on or off (`menuitemcheckbox`),
   * `radio` is one of the adjacent rows with the same {@link group}, of which exactly one is
   * `checked`. `action` is a plain row.
   *
   * Left out, the kind follows from {@link checked}: a row that carries it is a `checkbox`, one
   * without it an `action` — so a menu of switches (the changes tab's `⋯`) needs no `kind` at all.
   * A choice row shows a check in the place of its icon, never the accent (the accent is kept for the one primary act), and keeps the
   * room of that check while off, so the labels of a menu start on one line whether a row is on
   * or not. `onSelect` stays the one callback: the caller owns the state and flips it there.
   */
  kind?: 'action' | 'checkbox' | 'radio' | 'heading' | 'submenu'
  /** Whether a `checkbox` or `radio` row is on; on a row without `kind` it makes it a `checkbox`. */
  checked?: boolean
  /** The radio group a `radio` row belongs to; adjacent rows with the same group form one. */
  group?: string
  /** Draws a line above this row, to set a group of rows apart from the ones before it. */
  separated?: boolean
  /**
   * What choosing this row costs, in a `Tooltip` rather than as a line in the menu: explanation
   * stays out of sight until someone hovers or walks to the row.
   */
  hint?: string
  /**
   * The rows of a `submenu` row, opened with a hover, a click or ArrowRight (Radix `Sub`). One
   * level deep in practice; a row chosen in it closes the whole menu, as a row of the menu does.
   */
  items?: readonly DropdownMenuItem[]
  /**
   * What a `submenu` row stands at now, quiet on its right before the chevron ("Agent  Claude
   * Code"); it joins the row's accessible name after a colon, never its typeahead text.
   */
  value?: string
  /**
   * A drawing before the {@link value}, inside its quiet part: the mark of the agent in force
   * ("Agent  ✳ Claude Code"). Decorative, since the value says it in words.
   */
  valueGlyph?: ReactNode
  /** Not called for a `heading` or a `submenu` row: the one is text, the other opens its rows. */
  onSelect?(): void
}

/**
 * Who or what the menu is about, as one block above its rows: a glyph (an `Avatar`) and on two
 * lines a title and a quiet detail — the account menu's name and teams.
 *
 * Data rather than a free slot, like the rows: a head is never chosen and never a stop of the walk.
 * It is not a row either: it names the group of rows under it (`aria-labelledby`), so a reader
 * hears it once on entering, where two `heading` rows were text a reader could not reach at all.
 */
export interface DropdownMenuHeader {
  title: string
  /** The line under the title, quiet and cut off with an ellipsis; left out, the head is one line. */
  detail?: string
  /** A drawing in front of both lines, decorative: the title says it in words. */
  glyph?: ReactNode
}

/** The props of `DropdownMenu`. */
export interface DropdownMenuProps {
  /**
   * The element that opens it; must be one focusable control.
   *
   * Rendered `asChild`, exactly like `Popover`'s trigger: it keeps its own looks and receives the
   * aria wiring plus the ref the panel returns focus to.
   */
  trigger: ReactElement
  /** Accessible name of the menu. */
  label: string
  /**
   * The rows, in order. Deliberately data rather than `children`: a menu with free-form content is
   * no longer a menu of actions, and a `danger` row styled by every caller would look different in
   * every screen it appears in.
   */
  items: readonly DropdownMenuItem[]
  side?: 'top' | 'bottom'
  align?: 'start' | 'end'
  /**
   * Starts the menu open, once, then leaves it uncontrolled from there (the gallery's `Open` state).
   */
  defaultOpen?: boolean
  /**
   * Drives the menu from outside, with `onOpenChange`: for a menu a key of the page opens, not
   * only its trigger (⌘/ opens the model menu, H snoozes in the inbox).
   * Left out, Radix keeps the state. Pass both or neither.
   */
  open?: boolean
  onOpenChange?(open: boolean): void
  /**
   * Where a choice row draws its check: `start`, in the slot of the icon (the default, every row
   * menu of the app), or `end`, after the label — the model menu, whose rows lead with a label or
   * a mark and whose checks line up on the right.
   */
  checks?: 'start' | 'end'
  /**
   * How tall the panel may grow: `default` is the 288px of every layer (`PANEL`), `available` the
   * room Radix measured between the trigger and the edge of the window — for a menu of choices in
   * groups that would otherwise scroll a handful of rows out of sight.
   */
  height?: 'default' | 'available'
  /**
   * A head above the rows, with a line under it; the panel then grows to 232px at least, so a name
   * and the teams beside a 30px glyph never stand cramped.
   */
  header?: DropdownMenuHeader
  /**
   * `comfortable` gives the rows 30px instead of the 28px of a control, with their icons in
   * `muted` so the words lead: a short menu of places to go (the account menu, design A) rather
   * than the dense actions of a row. `default` is every other menu.
   */
  density?: 'default' | 'comfortable'
  /**
   * A tooltip on the trigger, for one that is an icon alone (the `⋯` of a row): it says what the
   * menu is for on hover and on focus. Usually the trigger's own name.
   */
  tooltip?: string
}

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
        comfortable: 'h-[30px]',
      },
    },
    defaultVariants: { tone: 'default', density: 'default' },
  },
)

/** How roomy the rows of the menu at hand are; read by every row below, submenus included. */
const Density = createContext<'default' | 'comfortable'>('default')

/**
 * A menu at its trigger, for the handful of actions on one row: the second layer of
 * `shared/ui/overlays/`, beside `Popover`. Radix `DropdownMenu` underneath, wrapped once here; a
 * menu is for acts, a `Popover` for content that needs more room.
 *
 * Uncontrolled by default; `open` and `onOpenChange` drive it from outside where a key of the page
 * opens it. `items` gives a caller everything it needs to react to a choice through `onSelect`.
 *
 * **Do not add an `onOpenAutoFocus` here.** `@radix-ui/react-menu@2.1.24` already does, in
 * `MenuContentImpl`: on mount it calls `event.preventDefault()` and then
 * `contentRef.current?.focus()`, so opening puts the focus on the *panel* (`role="menu"`), not the
 * first item. The first item only gets it through ArrowDown, Home or typing to search — and, for a
 * `DropdownMenu` specifically, only when the menu was opened with the keyboard, because the
 * roving-focus group lets its entry focus through solely for a keystroke. That is Radix's own
 * behaviour and this wrapper's whole premise is "wrap once, never override it": fighting the roving
 * focus here would only break a test somewhere else that relies on it.
 *
 * **`modal={false}`, unlike Radix' own default.** A modal menu marks everything outside its panel
 * `aria-hidden` and `pointer-events: none` while leaving all of it in the tab order, which axe reads
 * as `focusable-disabled` (WCAG 4.1.2) — the gallery story of this layer failed on exactly that. A
 * handful of actions on one row is no reason to make the window unreachable, and `Popover` beside
 * this one is non-modal for the same reason (that is Radix' default there). Escape, an outside click
 * and the focus returning to the trigger all keep working: those come from `DismissableLayer` and
 * the focus scope, not from the modality.
 */
export function DropdownMenu({
  trigger,
  label,
  items,
  side = 'bottom',
  align = 'start',
  defaultOpen,
  open,
  onOpenChange,
  tooltip,
  checks = 'start',
  height = 'default',
  header,
  density = 'default',
}: DropdownMenuProps) {
  const container = usePortalContainer()
  const headId = useId()
  const frame = height === 'available' ? TALL_PANEL : PANEL
  return (
    <RadixDropdownMenu.Root
      modal={false}
      {...(defaultOpen ? { defaultOpen } : {})}
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {tooltip === undefined ? (
        <RadixDropdownMenu.Trigger asChild>{trigger}</RadixDropdownMenu.Trigger>
      ) : (
        // The tooltip outside the trigger, so both hand their props to the one element inside.
        <Tooltip label={tooltip}>
          <RadixDropdownMenu.Trigger asChild>{trigger}</RadixDropdownMenu.Trigger>
        </Tooltip>
      )}
      <RadixDropdownMenu.Portal container={container}>
        <RadixDropdownMenu.Content
          aria-label={label}
          // `DropdownMenuContent` hardcodes `aria-labelledby: context.triggerId` before spreading
          // our own props over it, so without this the panel's accessible name would always be the
          // trigger's own name — per the accessible-name algorithm `aria-labelledby` wins over
          // `aria-label` whenever both are present. Clearing it here (our prop lands last) lets our
          // `label` through, so a caller's `<IconButton icon="more-horizontal" label="Meer" />` and
          // this menu can carry two different, correct names.
          aria-labelledby={undefined}
          side={side}
          align={align}
          // Same air and collision handling as Popover's panel; see its JSDoc.
          sideOffset={4}
          collisionPadding={8}
          className={header === undefined ? frame : frame.replace('min-w-40', 'min-w-58')}
          // Radix hands the focus back to the trigger one task after the menu is gone
          // (`FocusScope` defers it with a `setTimeout`), and by then the focus may be somewhere
          // on purpose: in the address of the tab the panel's `+` → Browser just opened, or — with
          // that task late under load — in this very menu, opened again, which a trigger that
          // takes the focus closes as a focus outside it. The hand-back only rescues a focus that
          // went down with the menu; one held elsewhere stays where it is.
          onCloseAutoFocus={handBackOnlyLostFocus}
        >
          <Density.Provider value={density}>
            {header === undefined ? (
              <Rows items={items} checks={checks} />
            ) : (
              <>
                <Head header={header} id={headId} />
                <Separator />
                <RadixDropdownMenu.Group
                  aria-labelledby={
                    header.detail === undefined
                      ? `${headId}-title`
                      : `${headId}-title ${headId}-detail`
                  }
                >
                  <Rows items={items} checks={checks} />
                </RadixDropdownMenu.Group>
              </>
            )}
          </Density.Provider>
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
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

/**
 * The panel of a menu or a submenu that may use the room there is: the frame of `PANEL` with the
 * height Radix measured instead of its 288px. Both variables are Radix' own; the submenu's panel is
 * a `SubContent` of the same menu and reads the same one.
 */
const TALL_PANEL = PANEL.replace(
  'max-h-72',
  'max-h-(--radix-dropdown-menu-content-available-height)',
)

/** The rows of a menu or a submenu, adjacent radio rows of one group in one `RadioGroup`. */
function Rows({ items, checks }: { items: readonly DropdownMenuItem[]; checks: 'start' | 'end' }) {
  return segments(items).map((segment) =>
    segment.group === null ? (
      segment.rows.map((row) => <Row key={row.id} row={row} checks={checks} />)
    ) : (
      <RadixDropdownMenu.RadioGroup
        key={`group-${segment.rows[0]?.id}`}
        value={segment.rows.find((row) => row.checked)?.id ?? ''}
      >
        {segment.rows.map((row) => (
          <Row key={row.id} row={row} checks={checks} />
        ))}
      </RadixDropdownMenu.RadioGroup>
    ),
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
  // The slot keeps its 14px when the row is off, so the labels of a group stay in one column
  // with each other and with the icons of the plain rows.
  return (
    <span
      data-nt-menu-check
      className="flex size-(--nt-icon-sm) shrink-0 items-center justify-center"
    >
      <RadixDropdownMenu.ItemIndicator className="contents">
        <Icon name="check" size="sm" />
      </RadixDropdownMenu.ItemIndicator>
    </span>
  )
}

/**
 * The glyph slot of a row: the caller's own drawing, its icon, or for a choice with the checks at
 * the start a check that shows only when it is on.
 */
function Glyph({ row, checks }: { row: DropdownMenuItem; checks: 'start' | 'end' }) {
  const density = useContext(Density)
  if (row.glyph !== undefined) return row.glyph
  if (isChoice(row)) return checks === 'start' ? <Check /> : null
  if (row.icon === undefined) return null
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
  return <RadixDropdownMenu.Separator className="-mx-1 my-1 h-px bg-border" />
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
  return (
    <>
      {row.separated ? <Separator /> : null}
      <RadixDropdownMenu.Sub>
        <RadixDropdownMenu.SubTrigger
          {...(row.disabled ? { disabled: true } : {})}
          {...(row.value === undefined ? {} : { 'aria-label': nameOf(row), textValue: row.label })}
          className={`${item({ tone: 'default', density })} data-[state=open]:bg-surface-hover`}
        >
          {row.glyph ?? (row.icon === undefined ? null : <Icon name={row.icon} size="sm" />)}
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
        </RadixDropdownMenu.SubTrigger>
        <RadixDropdownMenu.Portal container={container}>
          <RadixDropdownMenu.SubContent
            aria-label={row.label}
            // As on the menu itself: Radix names a submenu after its trigger, which here also
            // carries the value ("Agent: Relay"); the panel is named for what it lists.
            aria-labelledby={undefined}
            sideOffset={4}
            collisionPadding={8}
            className={TALL_PANEL}
          >
            <Rows items={row.items ?? []} checks={checks} />
          </RadixDropdownMenu.SubContent>
        </RadixDropdownMenu.Portal>
      </RadixDropdownMenu.Sub>
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
      <RadixDropdownMenu.CheckboxItem checked={row.checked === true} {...common}>
        {content}
      </RadixDropdownMenu.CheckboxItem>
    ) : kind === 'radio' ? (
      <RadixDropdownMenu.RadioItem value={row.id} {...common}>
        {content}
      </RadixDropdownMenu.RadioItem>
    ) : (
      <RadixDropdownMenu.Item {...common}>{content}</RadixDropdownMenu.Item>
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
