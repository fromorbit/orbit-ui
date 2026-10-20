import { cva } from 'class-variance-authority'
import {
  Fragment,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { Icon, type IconName } from '../primitives/Icon'
import { Input } from '../primitives/Input'
import { Kbd } from '../primitives/Kbd'
import { SectionHeading } from '../primitives/SectionHeading'
import { Skeleton } from '../primitives/Skeleton'
import { Spinner } from '../primitives/Spinner'
import type { ShortcutLabel } from '../primitives/shortcut'
import { Tag } from '../primitives/Tag'
import { isCommandClick, isCommandLetter } from '../provider/platform'
import { useUi } from '../provider/UiProvider'
import { ErrorState } from './ErrorState'
import { useDelayed } from './use-delayed'

export interface SearchListItem {
  /**
   * Unique within one list: it becomes the React key and, encoded, the DOM id of the row that
   * `aria-activedescendant` points at. Two rows sharing an id would make the field point at
   * whichever one the browser found first, and ↵ would take the other.
   */
  id: string
  label: string
  /** Shown muted behind the label: the folder a project sits in, a count, a provider's own word. */
  detail?: ReactNode
  /**
   * The whole truth behind a row that shows a shorter one, in the row's `title`.
   *
   * A project row names its project and the folder holding it, never the path: a column of
   * `/home/…/…/default` says nothing and puts a home directory on screen in every row. The path
   * is still one hover away, which is what this is for — not a tooltip and not a second label, so
   * it is deliberately not part of the option's accessible name.
   */
  title?: string
  icon?: IconName
  /** Rows with the same group, next to each other, get one heading above them. */
  group?: string
  /**
   * Whether this row is one of the current choices — for a list that holds more than one.
   *
   * `selectedId` is the everyday shorthand: one list, one choice, one tick. A list with a group per
   * setting has a choice per group, and no single id can say which those are, so there the caller
   * ticks its rows itself. Given here, it decides for this row; left out, the row follows
   * `selectedId` as it always did.
   *
   * **A tick spelled out here is `aria-checked`, and such a list has no `aria-selected` at all.**
   * `option` allows both attributes and requires neither (axe-core 4.13.0, `axe.js`: `option` has
   * `allowedAttrs: ['aria-selected', 'aria-checked', 'aria-posinset', 'aria-setsize']`, a
   * `type: 'widget'` entry with no `requiredAttrs`), so leaving one out is valid. `aria-checked` is
   * the honest one of the two here: two rows that said "selected" would make this a multi-select
   * listbox, which promises a reader a space bar that toggles and a set they can add to, and this
   * list has neither — a choice replaces the one of its own group and closes the panel. Saying both
   * was worse than saying one: every row of such a panel reported `aria-selected="false"` while one
   * per group reported `aria-checked="true"`, so a reader heard "not selected" about the very row
   * they had just picked. Which row the keyboard stands on is `aria-activedescendant`, as it always
   * was, and `selectedId` keeps its other job of closing the panel when it changes from outside.
   */
  selected?: boolean
  /**
   * A short badge after the label: what is special about this row rather than what it is.
   *
   * One word, from the catalogue — "Standaard" for the value a provider applies when nothing is
   * asked. It is text inside the row, so it is part of the name a screen reader reads out: a badge
   * that only the eye can see would leave the default unfindable without one.
   */
  tag?: string
  disabled?: boolean
  /**
   * What the query hit, as `[start, end)` ranges of `label`, when someone else did the matching:
   * core ranks the `@` list by letters in order and hands the positions along.
   * Given, it replaces the list's own marking of the query's words.
   */
  ranges?: readonly (readonly [number, number])[]
  /**
   * The command of the shortcut register this row runs, whose key stands on the right as `Kbd` —
   * a row of the command palette. Drawn as the host's catalogue spells it for this platform
   * (`ShortcutPort`), so a row can never promise a key nobody listens for.
   */
  shortcut?: ShortcutLabel
  /**
   * A few quiet words on the right edge of the row, 11px: what a model can do ("denkt · 1M"), or
   * the agent it belongs to where no heading says so.
   *
   * Beside `detail` rather than instead of it: a detail takes whatever room is left and truncates,
   * where this keeps its own width, so it may only ever be a word or two. Muted like a detail, and
   * for the same reason brightened on the active row. Plain text, so it is part of the name a
   * screen reader hears.
   */
  trailing?: string
  /**
   * More words the query finds this row by — the agent and the provider of a model — which are not
   * on screen. The query marks the label only, since a keyword has no letters to mark.
   */
  keywords?: readonly string[]
  /**
   * Draws this item as a group heading that can be taken instead of a choice: an agent that is not
   * ready, with the reason on the right and a way to its settings.
   *
   * It is an option of the walk — ↓ reaches it and ↵ opens it — because `aria-activedescendant`
   * may only point at an option, and a heading nobody can reach with the keyboard is the dead row
   * this replaces. Like the action row it is not one of the choices: no tick, and not counted.
   */
  head?: SearchListHead
  /**
   * One action on the row itself, beside choosing it: the star that makes a model a favourite.
   *
   * Never a tab stop and hidden from the tree — a control inside an option is a nested
   * interactive a screen reader cannot reach — so the keyboard takes it with the list's
   * `secondaryKey` on the active row, and the row says it is on in its `aria-description`.
   */
  secondary?: SearchListRowAction
}

/** What makes an item a heading that can be taken; see `SearchListItem.head`. */
export interface SearchListHead {
  /** Why the rows under it are missing, in a word or two ("Niet aangemeld"), from the catalogue. */
  reason?: string
  /** What ↵ or a click on the heading does: open the place where the reason can be fixed. */
  onOpen(): void
}

/** The action a row carries besides being chosen; see `SearchListItem.secondary`. */
export interface SearchListRowAction {
  /**
   * What the action is on the row, from the catalogue ("Favoriet"): its `title`, and the row's
   * `aria-description` while it is on.
   */
  label: string
  icon: IconName
  /**
   * Whether it is on for this row. An action that is on shows on every row, filled; one that is
   * off only on the active row, so a list of thirty models does not carry thirty outlines.
   */
  on: boolean
  onRun(): void
}

/** What the list has to show: its rows, or one of the two things that happen instead. */
export type SearchListState = 'ready' | 'loading' | 'error'

/**
 * Where the `detail` of a row goes.
 *
 * `inline` is the everyday shape: a path, a count, a word from the provider, right-aligned behind
 * the label and cut off before it pushes the label aside. `stacked` puts it on a line of its own
 * under the label, where it wraps instead of truncating — for a detail that is a sentence the
 * reader came for, such as what an access level actually allows. A truncated explanation explains
 * nothing.
 */
export type SearchListLayout = 'inline' | 'stacked'

/** Exported for `PickerPill`, which hands one straight through to the list it opens. */
export interface SearchListAction {
  label: string
  icon?: IconName
  /**
   * The command whose key stands on the right, drawn by `Kbd` as the catalogue spells it for this
   * platform, like every other key in the app; the handler is the
   * caller's, and only while the list is open. Read through the host's `ShortcutPort`, which may
   * also take a written-out key.
   */
  shortcut?: ShortcutLabel
  /** The host is busy with it (a folder dialog is up): the row waits and the rest goes off. */
  busy?: boolean
  onRun(): void
}

/** The props of `SearchList`. */
export interface SearchListProps {
  items: readonly SearchListItem[]
  /**
   * The current choice: it gets the check, and the walk starts on it.
   *
   * The shorthand for a list that holds one choice. A list that holds more than one (a group per
   * setting) ticks its rows with `SearchListItem.selected` instead, and then this id says nothing
   * about the rows at all — the walk starts on the first ticked row either way (see the component's
   * own note), and here this is only the value whose change closes the panel around the list.
   */
  selectedId?: string | null
  onSelect(id: string): void
  /** Accessible name of the list and placeholder of the field. */
  label: string
  /** The list's own sentences, in the host's language; see {@link SearchListLabels}. */
  labels: SearchListLabels
  /** Off for a handful of items: then the list itself takes focus. */
  searchable?: boolean
  state?: SearchListState
  /** A row under a separator that is not a choice: "Add folder…". */
  action?: SearchListAction
  /**
   * A quiet sentence above the rows about the list as a whole: why the level that applies is not
   * the one from the settings.
   *
   * Deliberately not a row. A row is a choice — it is walked to with ↓, taken with ↵ and counted
   * in `aria-posinset` — and this is a remark about the choices, which none of those are true of.
   * It is also not a live region: it is here from the moment the panel opens, and a reader who
   * opens a list hears it in place.
   */
  notice?: ReactNode
  /** Where the `detail` of every row goes; `inline` (beside the label) by default. */
  layout?: SearchListLayout
  /**
   * The query, for a caller that needs it — the command palette reads a prefix from it and asks
   * core for files. Left out, the list keeps the query itself.
   */
  query?: string
  /** Hears every change of the query, controlled or not. */
  onQueryChange?(query: string): void
  /**
   * `false` for a list the caller already filtered and ranked (fuzzy, or by core): every row is
   * shown as given, marked by its own `ranges`. `true` by default: the list matches the words.
   */
  filter?: boolean
  /**
   * The second way to take a row, with ⌘↵ (Ctrl+↵): a file of the palette opens in the editor
   * rather than in a tab. Left out, the command key changes nothing about ↵.
   */
  onSelectAlt?(id: string): void
  /** Caps the rows at 360px with a scroll of their own, for a list that stands in a large layer. */
  scroll?: boolean
  /** What an empty result says instead of the list's own sentence; words, never a sentence. */
  emptyText?: string
  /**
   * `false` for a list that holds no choice at all — the command palette goes somewhere, it never
   * ticks a row — so the rows drop the empty slot of the check and their glyphs stand on the line
   * of the group headings. `true` by default.
   */
  checkSlot?: boolean
  /**
   * Draws the group headings as `SectionHeading` (11px capitals, 28px), the heading of every column,
   * instead of the quiet 24px line of a small picker. For a list that stands in a
   * large layer — the command palette.
   */
  sectionHeadings?: boolean
  /**
   * The letter that runs the `secondary` action of the active row, taken with the platform's
   * command modifier (⌘ on macOS, Ctrl elsewhere) and nothing else: `d` for ⌘D.
   *
   * A key of this one control while it is open, like its arrows, so it stays out of the register;
   * the caller names the letter because only it knows what the action is.
   */
  secondaryKey?: string
}

/**
 * The three fixed states of a `SearchList` in words. "Niets om te kiezen" and "Geen treffers" are
 * two on purpose: the first is about the list, the second about what was typed, and only the
 * second can be corrected by the reader, so it repeats the query.
 */
export interface SearchListLabels {
  /** Nothing to choose from, with no query: "Niets om te kiezen". */
  empty: string
  /** Nothing matches the query: "Geen treffers voor ‘netwerk’". */
  noResults(query: string): string
  /** What a screen reader hears while rows are coming: "Laden…". */
  loading: string
  /** The list could not be had: "Kon de lijst niet laden". */
  error: string
}

/** The placeholder rows of a loading list; three is enough to read as "a list is coming". */
const SKELETON_ROWS = [
  { id: 'a', width: 'lg' },
  { id: 'b', width: 'md' },
  { id: 'c', width: 'lg' },
] as const

/**
 * The DOM id of the row for `id`.
 *
 * Keyed on the item's own id, never on its place in `items`. The list changes while the panel is
 * open — the action row adds a project, an @-list may stream its items in — and an
 * index-based id would leave the active row pointing at whatever slid into that slot, so ↵ would
 * take something the reader never highlighted. Encoded because `aria-activedescendant` holds a
 * single IDREF and an IDREF may not contain whitespace, while an item id is often a path.
 * `encodeURIComponent` also escapes its own `%`, so two different ids can never meet in one id.
 */
function rowId(base: string, id: string): string {
  return `${base}-o-${encodeURIComponent(id)}`
}

/** The words of a query: whitespace-separated and lowercased, so matching ignores both. */
function terms(query: string): string[] {
  const trimmed = query.trim().toLowerCase()
  return trimmed ? trimmed.split(/\s+/) : []
}

/**
 * Every stretch of `label` covered by one of the query's words, merged and in order.
 *
 * Every occurrence, not just the first: a query of "s" in "design system" marks both, and anything
 * less looks like the filter found something the reader cannot see. Overlapping words ("sys" and
 * "system") merge into one range, or the marks would nest and the text would be doubled.
 */
function marks(label: string, words: readonly string[]): [number, number][] {
  const haystack = label.toLowerCase()
  const found: [number, number][] = []
  for (const word of words) {
    for (let at = haystack.indexOf(word); at !== -1; at = haystack.indexOf(word, at + 1)) {
      found.push([at, at + word.length])
    }
  }
  found.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const [start, end] of found) {
    const last = merged.at(-1)
    if (last && start <= last[1]) last[1] = Math.max(last[1], end)
    else merged.push([start, end])
  }
  return merged
}

/**
 * A label with the query's words in `<mark>`.
 *
 * `<mark>` and not a `<span>` with a colour: highlighting a search result is exactly what the
 * element means, and it survives a user stylesheet or a future light theme. It carries its own
 * classes because the browser's default is a yellow no token in this design system can explain.
 * The text itself is untouched, so the option's accessible name stays the whole label.
 *
 * The tint is the one accent left in an open panel — what the query selected is a selection, and
 * that is the role the accent has (see the guidelines). Its letters are not: `--nt-accent-text` on
 * this tint over the active row's fill is 4.37:1, just under AA, where the foreground colour is
 * 8.41:1 there and 12.06:1 on a quiet row.
 */
function Marked({
  label,
  words,
  ranges,
}: {
  label: string
  words: readonly string[]
  ranges?: readonly (readonly [number, number])[] | undefined
}): ReactElement {
  return (
    <>
      {(ranges ? highlightPieces(label, ranges) : pieces(label, words)).map((piece) => {
        if (!piece.hit) return <Fragment key={piece.at}>{piece.text}</Fragment>
        return (
          <mark key={piece.at} className={searchListMark}>
            {piece.text}
          </mark>
        )
      })}
    </>
  )
}

/**
 * The label cut into alternating plain and matched pieces, each remembering where it started.
 *
 * Data rather than nodes, and built without a comparison beside the JSX: the scan that guards
 * against hardcoded copy (`findLiteralText`) reads source with a regex, and a `>` standing between
 * two JSX tags reads to it as text a user could see.
 */
function pieces(
  label: string,
  words: readonly string[],
): { at: number; text: string; hit: boolean }[] {
  return highlightPieces(label, marks(label, words))
}

/**
 * A text cut into alternating plain and matched pieces by sorted, non-overlapping `[start, end)`
 * ranges, each piece remembering where it started.
 *
 * Exported for `MentionList`, which marks the ranges core hands along on a path it draws in two
 * tones; the tint of a `<mark>` is `searchListMark`.
 */
export function highlightPieces(
  label: string,
  ranges: readonly (readonly [number, number])[],
): { at: number; text: string; hit: boolean }[] {
  const parts: { at: number; text: string; hit: boolean }[] = []
  let at = 0
  for (const [rawStart, rawEnd] of ranges) {
    const start = Math.max(at, Math.min(rawStart, label.length))
    const end = Math.max(start, Math.min(rawEnd, label.length))
    if (end === start) continue
    if (start !== at) parts.push({ at, text: label.slice(at, start), hit: false })
    parts.push({ at: start, text: label.slice(start, end), hit: true })
    at = end
  }
  if (at !== label.length) parts.push({ at, text: label.slice(at), hit: false })
  return parts
}

/**
 * One row of the list, at the `md` control height.
 *
 * 28px, not the 32px of a `List` row: a `List` is a column of chats in the sidebar, where a row is
 * a destination and the eye travels slowly; this is a panel of 230–280px where the reader is
 * picking one of a handful of names and wants to see them all at once. Every class sits in a
 * variant rather than in the base, so exactly one background and one text colour is ever emitted —
 * this project has no class-merging tool (see the note in `ErrorState.tsx`).
 *
 * **The active row is where the keyboard stands, and it says so with two things at once.** A fill
 * the reader can see (`--nt-surface-active`, which composites to rgb(53,54,57) on a panel) *and*
 * the full foreground colour, while every row around it stays muted. Measured, because the pair is
 * the whole argument: the fill alone is 1.39:1 against the panel, where a non-text indicator wants
 * 3:1 (WCAG 1.4.11); the two text colours differ by 3.08:1, and the words of the active row sit at
 * 11.5:1 on their own fill. The fill says *where*, the brightness says *this one*.
 *
 * It used to be a fill of half that strength plus an accent outline while the focus was inside the
 * list, and the reader who opened a pill in the real app called the result an ugly opener: two cyan
 * frames at once, one around the search field and one around this row. An open panel now carries no
 * accent at all, and the indicator no longer flickers with Chromium's modality heuristic — a list
 * reached with the mouse looks exactly like one reached with ↹, which is what a reader expects of a
 * panel they just clicked open.
 */
/** The classes of a `<mark>` around what a query hit; see `Marked`. */
export const searchListMark = 'rounded-sm bg-accent-subtle text-fg'

const row = cva('flex cursor-default gap-2 rounded-md px-2', {
  variants: {
    active: {
      true: 'bg-surface-active text-[12px] text-fg-strong',
      false: 'text-[12px] text-muted hover:bg-surface hover:text-fg',
    },
    off: { true: 'pointer-events-none opacity-40', false: '' },
    // The fixed height belongs to the one-line row; a stacked row is as tall as its explanation
    // needs, and never shorter than a row beside it. Both classes complete, because this project
    // has no class-merging tool and two competing heights would be settled by Tailwind's order.
    layout: {
      inline: 'h-(--nt-control-md) items-center',
      stacked: 'min-h-(--nt-control-md) items-start py-1.5',
    },
  },
  defaultVariants: { active: false, off: false, layout: 'inline' },
})

/**
 * The classes of one row of this list, for a list that draws rows of the same kind without being a
 * `SearchList` — the `@` list of the composer, whose field is the composer's own.
 */
export const searchListRow = row

/**
 * What the listbox itself wears, which depends on whether it is a tab stop and on what it can show.
 *
 * With a search field the field holds the focus and the list is never focused at all. Without one
 * the list is the tab stop — and then the row the keyboard points at carries the indicator (see
 * `row` above), because a ring around the whole list reads as a selection of everything in it.
 *
 * But the walk is empty while the list is loading, while nothing matched and while the action row
 * waits, and the list is still the tab stop then, with no row to hand the indicator to. There the
 * ring goes back on the list itself: a focusable element that shows nothing at all when it is
 * focused is exactly what WCAG 2.4.7 forbids.
 *
 * Three complete class strings rather than pieces joined at runtime: Tailwind reads source text.
 */
function listbox(searchable: boolean, activeId: string | null, scroll: boolean): string {
  if (searchable) {
    // A capped list is a plain block, not a flex column: a column that runs out of height shrinks
    // its rows below 28px (they have a height, not a floor) instead of letting them scroll.
    return scroll ? 'max-h-90 overflow-y-auto overscroll-contain' : 'flex flex-col'
  }
  return activeId === null
    ? 'no-drag flex flex-col rounded-md outline-focus focus-visible:-outline-offset-2 focus-visible:outline-2'
    : // `outline-none` is not the absence of our ring but the removal of the browser's: a focused
      // element with a `tabindex` gets `outline: auto` from the user-agent stylesheet, and dropping
      // our own classes alone would simply swap our accent for Chromium's own ring. Measured, not
      // assumed — the gallery test read `auto` here before this class existed.
      'no-drag flex flex-col rounded-md outline-none'
}

/**
 * A searchable list of choices: the building block under every picker in this app.
 *
 * It fetches nothing — the caller hands it `items` and a `state`, and hears back an id. Its users
 * are the folder picker of the composer, the @-list and, later, the command menu.
 *
 * **The keyboard is the combobox model of the APG**, not a roving tabindex. The caret stays in the
 * search field, and what moves through the rows is the *active* option, named by
 * `aria-activedescendant`; ↑ ↓ Home End move it, ↵ takes it. Moving the real focus onto a row would
 * mean typing could never continue, which in a field whose whole purpose is typing is the wrong
 * trade. With `searchable={false}` there is no field, so the listbox itself is the tab stop and
 * carries the same attribute — and then wears a ring of its own only while no row can show the
 * focus for it (see `listbox()`). The walk does not wrap, like `List`: the ends of a list are
 * meaningful places, and arriving back at the top by surprise costs more than a keystroke.
 *
 * **Chosen and active are two different things** and are drawn as two different things. The choice
 * is the row that has the check and survives closing the panel; active is where the keyboard is
 * *right now* (a filled row). Conflating them is the common bug in hand-written listboxes: the
 * reader then cannot see which one they already have. A list that holds one choice says it with
 * `aria-selected`; a list with a choice per group says it with `aria-checked` on those rows, carries
 * no `aria-selected` at all, and never calls itself multi-select (see `SearchListItem.selected`).
 *
 * **The count runs across the groups.** A group is a heading over rows that belong together, not a
 * set of its own: `aria-posinset` counts every choice of the whole listbox, so a reader hears
 * "3 of 7" and knows where they are in the list rather than in one of its headings.
 *
 * **The action row is a row of the list, with `role="option"`.** It is not a choice — it carries no
 * `aria-selected` and running it changes nothing in the list — but it is the last stop of the walk,
 * and `aria-activedescendant` may only point inside the element the combobox controls. A `<button>`
 * next to the listbox would be honest about the role and dishonest about everything else: either it
 * becomes a second tab stop (so ↓ no longer reaches it) or the field points at an element outside
 * its own list, which no screen reader is obliged to follow.
 *
 * **Filtering matches the label only.** `detail` is a node — a `PathLabel`, a count, a provider's
 * own word — so there is nothing to match against that the reader could predict. Diacritics are not
 * folded either: `cafe` does not find `café`. Folding them would move the offsets `marks()` hands
 * back, so the highlight would land on the wrong characters; doing it properly means computing the
 * match and the offsets on one and the same normalised string, and nothing here needs it yet.
 *
 * **The highlight stays where the reader put it.** The walk starts on the first row that carries a
 * check, or on the first row when none does — on the tick rather than on `selectedId`, because a
 * list with a choice per group is handed an id that is a row in neither. From there the filter
 * decides: a row that survives a keystroke stays active — the reader is looking at it, and a
 * highlight that jumps back to the top on every letter is unusable — and only a row the filter
 * removes hands over to the first match. Clearing the field does not undo a deliberate move either:
 * the current choice says where the walk *starts*, no more.
 */
export function SearchList({
  items,
  selectedId,
  onSelect,
  label,
  labels,
  searchable = true,
  state = 'ready',
  action,
  notice,
  layout = 'inline',
  query: controlledQuery,
  onQueryChange,
  filter = true,
  onSelectAlt,
  scroll = false,
  emptyText,
  checkSlot = true,
  sectionHeadings = false,
  secondaryKey,
}: SearchListProps): ReactElement {
  const { platform } = useUi()
  const base = useId()
  const [ownQuery, setOwnQuery] = useState('')
  const query = controlledQuery ?? ownQuery
  const setQuery = (next: string) => {
    setOwnQuery(next)
    onQueryChange?.(next)
  }
  const [active, setActive] = useState<string | null>(null)
  // Only a keyboard move scrolls a row into view. Doing it on every change of the active row would
  // scroll the page the moment this list mounts, which in the gallery moves the story under the
  // reader and in the app would fight the panel that is opening.
  const walked = useRef(false)
  const words = terms(query)
  const showSkeletons = useDelayed(state === 'loading')
  const ticked = ticks(items, selectedId)

  const rows = items.map((item) => ({ item, domId: rowId(base, item.id) }))
  // Numbered here, across the groups: `aria-posinset` counts the choices of the whole listbox, and
  // the action row is deliberately left out of that count (see `Action`).
  // A heading that can be taken is not one of the choices, so it holds no place in the count.
  let counted = 0
  const visible = (
    state === 'ready' ? (filter ? rows.filter(({ item }) => match(item, words)) : rows) : []
  ).map((entry) => ({ ...entry, position: entry.item.head ? 0 : ++counted }))
  const actionId = `${base}-a`
  const busy = action?.busy === true
  const walk = busy
    ? []
    : [
        ...visible.filter(({ item }) => !item.disabled).map(({ domId }) => domId),
        ...(action ? [actionId] : []),
      ]

  // Derived, not stored: after a keystroke the previously active row may be gone, and a stale id
  // would leave the field pointing at nothing. With no query the current choice leads, so ↵ on an
  // untouched list repeats what the user already has instead of picking the first name in it.
  // Always a row of the walk, so an empty walk (the action is busy, the list is loading, nothing
  // matched) leaves the field pointing at nothing at all rather than at a row ↵ could still take.
  //
  // Found by the tick and not by the id, and that is not the same question: a list with a group per
  // setting is handed one id carrying both values, which is a row in neither group, so the walk
  // would start at the top and ↵ would send the first level in the panel. For every list that holds
  // one choice the tick *is* the id, so this row is the one it always was.
  const chosen = visible.find(({ item }) => ticked(item) && !item.disabled)
  const leads = words.length === 0 && chosen && walk.includes(chosen.domId) ? chosen.domId : null
  const preferred = leads ?? walk[0] ?? null
  const activeId = active && walk.includes(active) ? active : preferred

  useEffect(() => {
    if (!walked.current || !activeId) return
    document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' })
  }, [activeId])

  // One gate for the keyboard and the mouse alike: whatever cannot be walked to cannot be taken
  // either, so a row that is off stays off however it is reached.
  function choose(domId: string, alt = false): void {
    if (!walk.includes(domId)) return
    if (domId === actionId) action?.onRun()
    else {
      const picked = rows.find((entry) => entry.domId === domId)
      if (!picked) return
      if (picked.item.head) picked.item.head.onOpen()
      else if (alt && onSelectAlt) onSelectAlt(picked.item.id)
      else onSelect(picked.item.id)
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>): void {
    // While an input method is composing a word, its Enter commits the candidate and its arrows
    // walk the candidate list. Both keys belong to the IME then, not to this list.
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Enter') {
      if (!activeId) return
      event.preventDefault()
      choose(activeId, isCommandClick(event, platform))
      return
    }
    if (secondaryKey && isCommandLetter(event.nativeEvent, secondaryKey, platform)) {
      const secondary = rows.find((entry) => entry.domId === activeId)?.item.secondary
      // Only a row that is part of the walk: a row that is off is off for its action too.
      if (!secondary || !activeId || !walk.includes(activeId)) return
      event.preventDefault()
      secondary.onRun()
      return
    }
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key]
    if (step === undefined && event.key !== 'Home' && event.key !== 'End') return
    if (walk.length === 0) return
    // Home and End belong to the list here, not to the caret: this field holds a query of a few
    // letters, and jumping to the ends of a list is worth more than jumping to the ends of those.
    event.preventDefault()
    walked.current = true
    const last = walk.length - 1
    const current = activeId ? walk.indexOf(activeId) : -1
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : Math.min(last, Math.max(0, current + (step ?? 0)))
    setActive(walk[next] ?? null)
  }

  const listId = `${base}-list`
  const groups = byGroup(visible)
  // Whether the caller ticks its rows itself, which decides how a tick is spelled: `aria-checked`
  // where a list holds a choice per group, `aria-selected` where it holds one choice in all (see
  // `SearchListItem.selected`).
  const checkable = isCheckable(items)
  // What the popup holds right now. The action row counts: it is an option of the listbox, so a
  // list that has nothing to choose from is still not empty while "Add folder…" stands in it.
  const hasOptions = visible.length > 0 || action !== undefined

  // One region for everything this list has to say in words, mounted from the first render. A live
  // region is only announced when it was already in the document before its text changed, so a
  // sentence that appears together with its own element is never read out (see the guidelines).
  // While rows are still coming the shapes say it and the word is for a screen reader alone; with
  // nothing left to show, this same element is the visible line.
  const nothing = state === 'ready' && visible.length === 0
  const says = nothing
    ? (emptyText ?? (words.length === 0 ? labels.empty : labels.noResults(query.trim())))
    : state === 'loading'
      ? labels.loading
      : ''

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {searchable ? (
        <>
          {/* Bare: the panel is the frame, and a field with a border of its own inside one is a
              box in a box. See `Input`'s `bare` variant for why it loses the ring with them. */}
          <Input
            label={label}
            placeholder={label}
            icon="search"
            variant="bare"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={hasOptions}
            aria-controls={listId}
            aria-autocomplete="list"
            {...(activeId ? { 'aria-activedescendant': activeId } : {})}
            autoComplete="off"
            spellCheck={false}
          />
          {/* What a border would have said, said once: one hair between what you type and what it
              filters. Decorative, so it is hidden from the tree — the field and the list already
              name each other with `aria-controls`. The column's own 4px gap gives it its air. */}
          <div aria-hidden="true" data-nt-searchlist-rule className="h-px shrink-0 bg-border" />
        </>
      ) : null}
      {/* Between the field and the rows, so it is read before the choice it is about. It takes
          the same `px-2` as a row, so it starts where the rows start — deliberately not where
          their labels start: a label sits behind a check slot and often a glyph too, and this
          sentence is about the list rather than about any row in it. `text-[11px]` for the same
          reason: an aside, not one of the choices. */}
      {notice ? (
        <p data-nt-searchlist-notice className="m-0 px-2 py-1 text-[11px] text-muted">
          {notice}
        </p>
      ) : null}
      <div
        id={listId}
        role="listbox"
        aria-label={label}
        {...(state === 'loading' ? { 'aria-busy': true } : {})}
        {...(searchable
          ? {}
          : { tabIndex: 0, onKeyDown, ...(activeId ? { 'aria-activedescendant': activeId } : {}) })}
        className={listbox(searchable, activeId, scroll)}
      >
        {groups.map((group) => {
          const body = group.rows.map(({ item, domId, position }) => {
            if (item.head) {
              return (
                <Head
                  key={domId}
                  domId={domId}
                  item={item}
                  head={item.head}
                  words={words}
                  active={domId === activeId}
                  off={item.disabled === true || busy}
                  onChoose={choose}
                />
              )
            }
            return (
              <Row
                key={domId}
                domId={domId}
                item={item}
                words={words}
                position={position}
                setSize={counted}
                {...(checkable ? { checked: ticked(item) } : { selected: ticked(item) })}
                active={domId === activeId}
                off={item.disabled === true || busy}
                layout={layout}
                tickSlot={checkSlot}
                onChoose={choose}
              />
            )
          })
          if (!group.name) return <Fragment key="ungrouped">{body}</Fragment>
          return (
            // biome-ignore lint/a11y/useSemanticElements: a fieldset is for forms; this is a named run of options inside a listbox, and a named section would be a landmark.
            <div key={group.name} role="group" aria-labelledby={`${base}-g${group.index}`}>
              {sectionHeadings ? (
                <SectionHeading level="label" id={`${base}-g${group.index}`}>
                  {group.name}
                </SectionHeading>
              ) : (
                <p
                  id={`${base}-g${group.index}`}
                  className="m-0 flex h-6 items-center px-2 text-[11px] font-medium text-muted"
                >
                  {group.name}
                </p>
              )}
              {body}
            </div>
          )
        })}
        {action ? (
          <>
            {/* Decorative, and hidden from the tree: a listbox owns options and groups, and a
                separator between them would be a child no screen reader knows what to do with. */}
            {visible.length > 0 ? <div aria-hidden="true" className="my-1 h-px bg-border" /> : null}
            <Action
              domId={actionId}
              action={action}
              active={actionId === activeId}
              busy={busy}
              onChoose={choose}
            />
          </>
        ) : null}
      </div>
      {/* The fixed states live beside the listbox, never inside it: an alert or a paragraph among
          the options would be a child the role does not allow. */}
      {state === 'loading' && showSkeletons ? (
        // Three rows, of two different widths: a column of identical bars reads as a table, and
        // what is coming is a list of names of different lengths.
        <div className="flex flex-col">
          {SKELETON_ROWS.map((bar) => (
            <span key={bar.id} className="flex h-(--nt-control-md) items-center px-2">
              <Skeleton width={bar.width} />
            </span>
          ))}
        </div>
      ) : null}
      {state === 'error' ? <ErrorState size="sm" title={labels.error} /> : null}
      <p
        role="status"
        // `sr-only` takes the element out of the flow, so a list with rows in it carries no empty
        // line under them — and the region is still standing there when its text arrives.
        className={nothing ? 'm-0 px-2 py-3 text-center text-[12px] text-muted' : 'sr-only'}
      >
        {says}
      </p>
    </div>
  )
}

/** A row that passed the filter, with its place among the choices (1-based, across the groups). */
interface VisibleRow {
  item: SearchListItem
  domId: string
  position: number
}

/**
 * Which rows carry a check: the caller's own word where it gives one, otherwise the single id.
 *
 * Two ways to say one thing, and they are not mixed per row: as soon as *any* row carries
 * `selected`, that is what the list goes by, so a caller that ticks its rows itself never gets a
 * second tick from an id it passed for another reason (`selectedId` still closes the panel around
 * this list when it changes from outside). Nearly every list in the app holds one choice and says
 * so with that id alone.
 *
 * This is also where the keyboard starts, which is why it may not fall back to the id: the pill
 * with a group per setting passes both its values in one id, and a walk that looked for that id
 * would find no row and begin at the top of the panel.
 */
function ticks(
  items: readonly SearchListItem[],
  selectedId: string | null | undefined,
): (item: SearchListItem) => boolean {
  if (isCheckable(items)) return (item) => item.selected === true
  return (item) => item.id === selectedId
}

/**
 * Whether the caller ticks the rows of this list itself.
 *
 * One predicate for the two questions it answers — which rows carry a check, and whether the check
 * is spelled `aria-checked` or `aria-selected` — because they are one question: a row that showed a
 * glyph the ARIA of that same row did not report would be a row only the eye can read. Asked over
 * every item, not over the rows a query left standing: what a row means does not change while
 * someone types.
 */
function isCheckable(items: readonly SearchListItem[]): boolean {
  return items.some((item) => item.selected !== undefined)
}

/**
 * Whether every word of the query occurs in the label or the keywords; an empty query matches
 * everything.
 *
 * The words may be spread over both — "fake gr" finds the model "Groot" of the agent Fake — which
 * is what a reader means when they type an agent and a model after each other.
 */
function match(item: SearchListItem, words: readonly string[]): boolean {
  const haystack = [item.label, ...(item.keywords ?? [])].join('\n').toLowerCase()
  return words.every((word) => haystack.includes(word))
}

/**
 * Splits the visible rows into contiguous runs that share a `group`.
 *
 * Contiguous, not gathered: the caller decides the order of the list, and re-sorting it here would
 * move rows around behind their back. Two runs with the same name simply get two headings, which is
 * what a caller that interleaved them asked for.
 */
function byGroup(
  visible: readonly VisibleRow[],
): { name: string | undefined; index: number; rows: VisibleRow[] }[] {
  const runs: { name: string | undefined; index: number; rows: VisibleRow[] }[] = []
  for (const entry of visible) {
    const last = runs.at(-1)
    if (last && last.name === entry.item.group) last.rows.push(entry)
    else runs.push({ name: entry.item.group, index: runs.length, rows: [entry] })
  }
  return runs
}

/**
 * One choice.
 *
 * The check keeps a box of its own whether or not it is there, so the labels of a list line up
 * instead of shifting by 14px around the selected one — the same reason `StatusShape` draws an empty
 * slot. `detail` may shrink (a `PathLabel` truncates inside it) while the label keeps its place.
 *
 * **Stacked**, the detail moves under the label and wraps instead of truncating. Nothing else about
 * the row changes: the check and the glyph keep their slots, so the labels of a list still line up
 * whichever shape it is in. It is for a detail the reader came to read — what an access level
 * actually allows — where an ellipsis after four words is worse than no line at all.
 *
 * `aria-posinset` and `aria-setsize` are spelled out rather than left to the browser: the action row
 * is an option too, and without them a reader hears "Map toevoegen…, 4 of 4" — four things to pick
 * from, where there are three.
 */
function Row({
  domId,
  item,
  words,
  position,
  setSize,
  selected,
  checked,
  active,
  off,
  layout,
  tickSlot,
  onChoose,
}: {
  domId: string
  item: SearchListItem
  words: readonly string[]
  position: number
  setSize: number
  /**
   * What `aria-selected` says: the current choice of a list that holds exactly one.
   *
   * Absent on a checkable list, where the attribute is left out altogether rather than set to
   * `false` on every row (see `SearchListItem.selected`).
   */
  selected?: boolean
  /**
   * The tick of a list that holds a choice per group, as `aria-checked`.
   *
   * Absent for every other list, where the tick and the selection are the same fact and saying it
   * twice would only give a reader two words for one row. Exactly one of these two is ever passed.
   */
  checked?: boolean
  active: boolean
  off: boolean
  layout: SearchListLayout
  /** Whether the row keeps the slot of the check; see `SearchListProps.checkSlot`. */
  tickSlot: boolean
  onChoose(domId: string): void
}): ReactElement {
  // Whichever of the two this list spells its tick with; the glyph is the same glyph. One of them
  // is always passed, so the last fallback is only there to keep the type honest.
  const tick = checked ?? selected ?? false
  return (
    // biome-ignore lint/a11y/useFocusableInteractive: an option in the combobox pattern is never focused; the field keeps the caret and points here with aria-activedescendant.
    // biome-ignore lint/a11y/useKeyWithClickEvents: the keys live on the field that owns the walk, which is why no row is a tab stop.
    <div
      id={domId}
      role="option"
      {...(selected === undefined ? {} : { 'aria-selected': selected })}
      {...(checked === undefined ? {} : { 'aria-checked': checked })}
      aria-posinset={position}
      aria-setsize={setSize}
      {...(off ? { 'aria-disabled': true } : {})}
      {...(item.title ? { title: item.title } : {})}
      // The star itself is hidden from the tree (see `SearchListItem.secondary`), so the row says
      // that it is on; a description rather than part of the name, which stays the label.
      {...(item.secondary?.on ? { 'aria-description': item.secondary.label } : {})}
      // The shape as an attribute, because the height depends on it: a one-line row is exactly
      // `--nt-control-md`, a stacked one grows with its explanation, and the test that keeps the
      // panel on the 4px grid has to be able to tell them apart.
      data-nt-searchlist-row={layout}
      // Unconditional: `choose` refuses anything that is not part of the walk, so a row that is
      // off is off for a click as well, and not only because `pointer-events-none` hid it.
      onClick={() => onChoose(domId)}
      className={row({ active, off, layout })}
    >
      {/* In a stacked row the two slots on the left take the height of one line, so the check and
          the glyph sit beside the label rather than in the middle of a paragraph. Complete class
          strings per shape, never pieces joined at runtime: Tailwind scans source text.
          No colour of its own: never the accent (the check marks the choice a reader already
          made, not the thing to press), and not the foreground either — it takes the colour of
          its row, so a chosen row the keyboard has left behind is muted through, glyph and all. */}
      {tickSlot ? (
        <span
          className={
            layout === 'stacked'
              ? 'flex h-5 w-(--nt-icon-sm) shrink-0 items-center justify-center'
              : 'flex size-(--nt-icon-sm) shrink-0 items-center justify-center'
          }
        >
          {tick ? <Icon name="check" size="sm" /> : null}
        </span>
      ) : null}
      {/* A glyph in a flex row shrinks like everything else; the box keeps it round. */}
      {item.icon ? (
        <span className={layout === 'stacked' ? 'flex h-5 shrink-0 items-center' : 'flex shrink-0'}>
          <Icon name={item.icon} size="sm" />
        </span>
      ) : null}
      {layout === 'stacked' ? (
        <span className="flex min-w-0 flex-col">
          <span className="truncate leading-5">
            <Marked label={item.label} words={words} ranges={item.ranges} />
          </span>
          {/* Wraps, and that is the whole point: an explanation cut off after four words is not
              an explanation. The row grew to fit it (see `row`). */}
          {item.detail ? (
            <span data-nt-searchlist-detail className="text-[11px] leading-4">
              {item.detail}
            </span>
          ) : null}
        </span>
      ) : (
        <>
          <span className="min-w-0 truncate">
            <Marked label={item.label} words={words} ranges={item.ranges} />
          </span>
          {/* `flex-1` with a basis of zero: the detail takes the space that is left and gives it
              back first. Negative free space is shared out by base size, so a detail with a base
              of its own (a long path) would eat the label's width instead of its own — which it
              did, until this.

              A whisper beside the name — the folder a project sits in — so it is muted, where a
              stacked detail is the reason its row exists and simply follows it. But never muted on
              the active row: --nt-text-muted on --nt-surface-active is 3.71:1, under the 4.5:1 that
              body text owes, so on that row it brightens with everything else. Two complete class
              strings, because Tailwind reads source text. */}
          {item.detail ? (
            <span
              data-nt-searchlist-detail
              className={
                active
                  ? 'min-w-0 flex-1 truncate text-right text-[11px]'
                  : 'min-w-0 flex-1 truncate text-right text-[11px] text-muted'
              }
            >
              {item.detail}
            </span>
          ) : null}
        </>
      )}
      {item.trailing ? <Trailing text={item.trailing} active={active} /> : null}
      {/* Last in the row and hard against its right edge: a badge says something *about* the row,
          so it may never come between the reader and the name. `ml-auto` is what carries it there
          when nothing else claimed the space; beside a `detail` (which already takes what is left)
          it costs nothing. It keeps its own size while everything to its left truncates.
          The tone is the neutral one, which is the only one that is not muted: nothing on the
          active fill may be (see `row`), and `Tag`'s neutral face is the full foreground colour. */}
      {item.tag ? (
        <span data-nt-searchlist-tag className="ml-auto flex shrink-0">
          <Tag>{item.tag}</Tag>
        </span>
      ) : null}
      {/* Last, against the right edge, like the key of the action row; it comes forward with the
          row it is on, since nothing on the active fill may be muted (see `row`). */}
      {item.shortcut ? (
        <span data-nt-searchlist-shortcut className="ml-auto flex shrink-0">
          <Kbd shortcut={item.shortcut} tone={active ? 'menu-strong' : 'menu'} />
        </span>
      ) : null}
      {item.secondary ? <Secondary action={item.secondary} active={active} /> : null}
    </div>
  )
}

/**
 * The few words on the right of a row (`SearchListItem.trailing`).
 *
 * `ml-auto` carries them to the edge when nothing else took the room; beside a `detail` (which
 * already does) it costs nothing. They keep their width while the label truncates, and are muted
 * on every row but the active one, where muted is 3.71:1. Two complete class strings, because
 * Tailwind reads source text.
 */
function Trailing({ text, active }: { text: string; active: boolean }): ReactElement {
  return (
    <span
      data-nt-searchlist-trailing
      className={
        active
          ? 'ml-auto shrink-0 whitespace-nowrap text-[11px]'
          : 'ml-auto shrink-0 whitespace-nowrap text-[11px] text-muted'
      }
    >
      {text}
    </span>
  )
}

/**
 * The action of a row (`SearchListItem.secondary`): a glyph against the right edge.
 *
 * Out of the tree and out of the tab order — a control inside an option is a nested interactive —
 * so the keyboard takes it with the list's `secondaryKey` and the row describes its state. A click
 * on it runs the action and stops there, so it never also chooses the row. Always in the layout,
 * `invisible` where it does not show, so the words beside it do not move when the walk arrives.
 * Filled where it is on; it takes the colour of its row like every other glyph.
 */
function Secondary({
  action,
  active,
}: {
  action: SearchListRowAction
  active: boolean
}): ReactElement {
  const shown = active || action.on
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the key is the list's `secondaryKey`, heard by the field that owns the walk; this glyph is for the mouse.
    // biome-ignore lint/a11y/noStaticElementInteractions: hidden from the tree on purpose — a control inside an option would be a nested interactive; the row describes the state instead.
    <span
      aria-hidden="true"
      data-nt-searchlist-secondary
      {...(action.on ? { 'data-on': 'true' } : {})}
      title={action.label}
      onClick={(event) => {
        event.stopPropagation()
        action.onRun()
      }}
      className={
        shown
          ? action.on
            ? 'flex shrink-0 [&_svg]:fill-current'
            : 'flex shrink-0'
          : 'invisible flex shrink-0'
      }
    >
      <Icon name={action.icon} size="sm" />
    </span>
  )
}

/**
 * A group heading that can be taken (`SearchListItem.head`): an agent that is not ready, with its
 * reason and an arrow to where it can be fixed.
 *
 * Drawn as a heading — 11px, medium — but at the height of a row, because it is a stop of the walk
 * and the panel stays on the 4px grid of its rows. Like the action row it is an option that is not
 * one of the choices: no tick, and `aria-setsize={-1}` so a reader is not told there is one more
 * model than there is. The active fill and the bright text travel onto it like onto any row.
 */
function Head({
  domId,
  item,
  head,
  words,
  active,
  off,
  onChoose,
}: {
  domId: string
  item: SearchListItem
  head: SearchListHead
  words: readonly string[]
  active: boolean
  off: boolean
  onChoose(domId: string): void
}): ReactElement {
  return (
    // biome-ignore lint/a11y/useFocusableInteractive: an option in the combobox pattern is never focused; the field points here with aria-activedescendant.
    // biome-ignore lint/a11y/useKeyWithClickEvents: the keys live on the field that owns the walk, which is why no row is a tab stop.
    <div
      id={domId}
      role="option"
      aria-setsize={-1}
      {...(off ? { 'aria-disabled': true } : {})}
      {...(item.title ? { title: item.title } : {})}
      data-nt-searchlist-row="inline"
      data-nt-searchlist-head
      onClick={() => onChoose(domId)}
      className={row({ active, off })}
    >
      <span className="min-w-0 truncate text-[11px] font-medium">
        <Marked label={item.label} words={words} ranges={item.ranges} />
      </span>
      {head.reason ? <Trailing text={head.reason} active={active} /> : null}
      <span className={head.reason ? 'flex shrink-0' : 'ml-auto flex shrink-0'}>
        <Icon name="arrow-right" size="sm" />
      </span>
    </div>
  )
}

/**
 * The row that is not a choice: it opens a folder dialog, and then waits for it.
 *
 * While it waits it says so with `aria-busy` and a `Spinner` in the slot the icon had, so the row
 * neither moves nor changes its name — a name that changes under the reader is announced twice.
 * The spinner is decorative for that same reason: `aria-busy` is the word for this, and a live
 * region inside a listbox would talk over the list.
 *
 * It carries no `aria-selected` and no `aria-posinset`: it is an option of the listbox, but it is
 * not one of the choices, and counting it would make every list one longer than it is. Leaving
 * `aria-setsize` off with it is not enough — a browser then computes the pair from the DOM and says
 * "4 of 4" again — so the row claims `aria-setsize={-1}`, the ARIA value for a set whose size is
 * not known.
 */
function Action({
  domId,
  action,
  active,
  busy,
  onChoose,
}: {
  domId: string
  action: SearchListAction
  active: boolean
  busy: boolean
  onChoose(domId: string): void
}): ReactElement {
  return (
    // biome-ignore lint/a11y/useFocusableInteractive: the last stop of the walk, reached with aria-activedescendant like every other row; nothing in this list is a tab stop.
    // biome-ignore lint/a11y/useKeyWithClickEvents: the keys live on the field that owns the walk, which is why no row is a tab stop.
    <div
      id={domId}
      role="option"
      aria-setsize={-1}
      {...(busy ? { 'aria-disabled': true, 'aria-busy': true } : {})}
      // Always one line: an action is a short label and a key, never an explanation.
      data-nt-searchlist-row="inline"
      data-nt-searchlist-action
      onClick={() => onChoose(domId)}
      className={row({ active, off: busy })}
    >
      <span className="flex size-(--nt-icon-sm) shrink-0 items-center justify-center">
        {busy ? <Spinner size="sm" decorative /> : null}
        {!busy && action.icon ? <Icon name={action.icon} size="sm" /> : null}
      </span>
      <span className="min-w-0 truncate">{action.label}</span>
      {action.shortcut ? (
        <span className="ml-auto shrink-0">
          {/* The keys come forward with the row they are on: muted on `--nt-surface-active` is
              3.40:1, and nothing on the active fill may be muted (see `row`). */}
          <Kbd shortcut={action.shortcut} tone={active ? 'menu-strong' : 'menu'} />
        </span>
      ) : null}
    </div>
  )
}
