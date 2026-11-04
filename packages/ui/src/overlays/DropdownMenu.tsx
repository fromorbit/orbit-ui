import { DropdownMenu as RadixDropdownMenu } from 'radix-ui'
import type { ReactElement, ReactNode } from 'react'
import { handBackOnlyLostFocus } from '../primitives/hand-back'
import type { IconName } from '../primitives/Icon'
import type { ShortcutLabel } from '../primitives/shortcut'
import { DROPDOWN_PARTS, MenuBody } from './menu-rows'
import { PANEL } from './panel'
import { usePortalContainer } from './portal'
import { Tooltip } from './Tooltip'

/**
 * One row of the menu: the handful of things a caller may do to whatever the trigger sits on.
 *
 * The item model of `ContextMenu` as well: one array can feed the `⋯` of a row and a right click
 * on it, which then offer the same acts in the same order, drawn the same way.
 */
export interface DropdownMenuItem {
  id: string
  label: string
  /**
   * The glyph in front of a plain row. **Ignored on a choice row** (a `checkbox` or `radio`, or a
   * row with `checked`): its slot holds the check instead, so the rows of a menu stay aligned.
   * A row without one, in a panel where another row has an icon, a glyph or a check at the start,
   * keeps the slot empty, so every label of the panel starts on one line.
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
   * `comfortable` gives the rows 36px instead of the 32px of a control, with their icons in
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
  const frame = height === 'available' ? DROPDOWN_PARTS.tallPanel : PANEL
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
          <MenuBody
            parts={DROPDOWN_PARTS}
            items={items}
            checks={checks}
            density={density}
            header={header}
          />
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  )
}
