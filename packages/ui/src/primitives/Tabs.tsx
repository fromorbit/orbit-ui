import { cva } from 'class-variance-authority'
import { Tabs as RadixTabs } from 'radix-ui'
import { type ReactElement, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from './Icon'

/** How the list sits next to its panel; see `Tabs`. */
export type TabsOrientation = 'vertical' | 'horizontal'

/**
 * The look of a horizontal tab strip; see `Tabs`.
 *
 * Only meaningful with `orientation: 'horizontal'` — the vertical section list (the settings
 * screen) has no use for a pill fill and ignores this prop entirely.
 */
export type TabsVariant = 'line' | 'pill'

/**
 * Where a horizontal pill strip stands; see `Tabs`.
 *
 * `'titlebar'` is a strip at the top of the window, level with `TitleBar` beside it: it moves the
 * window like the bar does, and it may hold the window controls of Windows.
 */
export type TabsStrip = 'plain' | 'titlebar'

/**
 * The row around the list and the `after` slot, per strip.
 *
 * A titlebar strip is exactly as tall as the title bar (`--nt-titlebar-height`, the height the
 * window controls of Windows are drawn at, `chrome.test.ts`), a drag region, and `min-w-0` so the
 * pills inside can give way instead of widening the row under the reserved room.
 * `nt-titlebar-strip` is what `index.css` hangs the room for the window controls on.
 */
const stripRow = cva('@container/tabs flex items-center', {
  variants: {
    strip: {
      plain: '',
      titlebar: 'nt-titlebar-strip drag-region h-(--nt-titlebar-height) min-w-0 shrink-0',
    },
  },
  defaultVariants: { strip: 'plain' },
})

/**
 * The pill list, per strip. A plain strip keeps its width; a titlebar strip lets its pills shrink
 * to 72px each and scrolls sideways — without a scrollbar, the active
 * pill brought into view — what still does not fit, so nothing ever runs under the window
 * controls and no pill is cut to an icon and two letters.
 */
const pillList = cva('flex flex-row gap-1 px-2 py-1.5', {
  variants: {
    strip: {
      plain: 'shrink-0',
      titlebar: 'min-w-0 overflow-x-auto [scrollbar-width:none]',
    },
  },
  defaultVariants: { strip: 'plain' },
})

/**
 * When an inactive pill folds to its icon: a container rule on the strip (`@container/tabs`), one
 * threshold per number of pills, after the model of `COLLAPSE_BELOW` of the composer's pills.
 *
 * A pill cut to "W…" or "b…" says less than its icon alone: an icon and one letter are no
 * name. So a strip that cannot give every pill 96px — plus 96px for what stands beside the pills
 * (the panel button, the `+`, full screen) — shows only the icon of every pill but the active one,
 * whose label is where the reader is; the label stays the tab's name and becomes its tooltip
 * (`tip`). Derived from the count, never guessed per screen: 360px holds two pills in full, not
 * three. Complete class strings, because Tailwind reads the source text; past eight pills every
 * inactive one folds.
 */
const FOLD_LABEL: Readonly<Record<number, string>> = {
  2: '@max-[288px]/tabs:sr-only',
  3: '@max-[384px]/tabs:sr-only',
  4: '@max-[480px]/tabs:sr-only',
  5: '@max-[576px]/tabs:sr-only',
  6: '@max-[672px]/tabs:sr-only',
  7: '@max-[768px]/tabs:sr-only',
  8: '@max-[864px]/tabs:sr-only',
}

/**
 * The same thresholds for the box of a folded pill: no minimum width, and no shrinking either —
 * an icon squeezed under its own width would lie under the cross of the pill.
 */
const FOLD_WIDTH: Readonly<Record<number, string>> = {
  2: '@max-[288px]/tabs:min-w-0 @max-[288px]/tabs:shrink-0',
  3: '@max-[384px]/tabs:min-w-0 @max-[384px]/tabs:shrink-0',
  4: '@max-[480px]/tabs:min-w-0 @max-[480px]/tabs:shrink-0',
  5: '@max-[576px]/tabs:min-w-0 @max-[576px]/tabs:shrink-0',
  6: '@max-[672px]/tabs:min-w-0 @max-[672px]/tabs:shrink-0',
  7: '@max-[768px]/tabs:min-w-0 @max-[768px]/tabs:shrink-0',
  8: '@max-[864px]/tabs:min-w-0 @max-[864px]/tabs:shrink-0',
}

/**
 * A folded pill keeps no room for its cross, and its cross goes: closing it is Delete or a middle
 * click, or the cross once it is the active pill again. Otherwise the cross lay over the icon.
 */
const FOLD_PAD: Readonly<Record<number, string>> = {
  2: '@max-[288px]/tabs:pr-2.5',
  3: '@max-[384px]/tabs:pr-2.5',
  4: '@max-[480px]/tabs:pr-2.5',
  5: '@max-[576px]/tabs:pr-2.5',
  6: '@max-[672px]/tabs:pr-2.5',
  7: '@max-[768px]/tabs:pr-2.5',
  8: '@max-[864px]/tabs:pr-2.5',
}

/** The cross of a folded pill, gone below the same thresholds. */
const FOLD_CROSS: Readonly<Record<number, string>> = {
  2: '@max-[288px]/tabs:hidden',
  3: '@max-[384px]/tabs:hidden',
  4: '@max-[480px]/tabs:hidden',
  5: '@max-[576px]/tabs:hidden',
  6: '@max-[672px]/tabs:hidden',
  7: '@max-[768px]/tabs:hidden',
  8: '@max-[864px]/tabs:hidden',
}

/** The class that folds the label of an inactive pill among `count`; nothing for one alone. */
function foldOf(table: Readonly<Record<number, string>>, count: number, always: string): string {
  if (count < 2) return ''
  return table[count] ?? always
}

/**
 * The mask of a titlebar strip whose pills run past an edge: that edge fades out over 16px, so a
 * pill cut there reads as "more this way" rather than as a pill pushed under its neighbour — the
 * panel button at the start, the `+` at the end. Nothing while everything fits.
 */
function fadeMask(start: boolean, end: boolean): string | undefined {
  if (!start && !end) return undefined
  const from = start ? 'transparent, black 16px' : 'black, black'
  const to = end ? 'black calc(100% - 16px), transparent' : 'black'
  return `linear-gradient(to right, ${from}, ${to})`
}

/** One tab of the strip; the fields after `content` only mean something on a pill. */
export interface TabsItem {
  id: string
  label: string
  icon?: IconName
  /**
   * An icon drawn by a layer above this one, shown in place of `icon`: the type of a file, which
   * only `patterns/` can draw. `icon` stays the fallback a caller gives beside it.
   */
  glyph?: ReactNode
  /** A longer name for the pointer, as the pill's `title`: the whole path of a file tab. */
  hint?: string
  /**
   * Cut the label in the middle rather than at the end: a file name, whose end and extension say
   * more than a long start. A title keeps its end cut.
   */
  middle?: boolean
  content: ReactNode
  /**
   * Whether the pill can be closed: a cross at the right of the pill, always on the active one and
   * on hover or focus for the rest, a middle click, or Delete on the focused pill.
   * Only with `onClose` on the strip.
   */
  closable?: boolean
  /**
   * The name of the cross ("Sluit ‹titel›"). A prop, because this primitive does not know the
   * catalogue; required in practice whenever `closable` is.
   */
  closeLabel?: string
  /**
   * A quiet number after the title, or nothing: on a pill, and in the vertical list, where the
   * settings screen counts the hits of its search per category.
   */
  count?: number | null
  /**
   * Dimmed and not to be chosen: a category of the settings without a hit while it searches. The
   * tab stays in its place, so the list does not jump while the reader types.
   */
  dimmed?: boolean
  /**
   * The content fills the panel edge to edge and scrolls by itself, if at all.
   *
   * For a tab whose content lays out its own column — the browser tab, with its address bar above
   * a hosted view: the view may not lie inside a padded, scrolling box, because it measures the
   * rest of the column and main lays a native page exactly there.
   */
  flush?: boolean
}

/**
 * A label cut in the middle: the head gives way with an ellipsis, the tail — the last few letters
 * and the whole extension — never does. CSS alone, no measuring: "bestellingen-over…maand.test.tsx".
 */
function MiddleCut({ label }: { label: string }) {
  const dot = label.indexOf('.', 1)
  const keep = Math.min(label.length - 1, (dot === -1 ? 0 : label.length - dot) + 5)
  const cut = Math.max(1, label.length - keep)
  // The two halves are hidden from the name and the whole label stands beside them: a name
  // computed from two boxes may come out with a space in the middle of the file name.
  return (
    <>
      <span aria-hidden="true" className="flex min-w-0">
        <span className="min-w-0 truncate">{label.slice(0, cut)}</span>
        <span className="shrink-0">{label.slice(cut)}</span>
      </span>
      <span className="sr-only">{label}</span>
    </>
  )
}

/** The props of `Tabs`. */
export interface TabsProps {
  /** Accessible name of the tab list. */
  label: string
  tabs: readonly TabsItem[]
  defaultTab?: string
  /**
   * The tab to show, when someone other than the user moves it too — core, which makes a newly
   * opened tab the visible one.
   *
   * Not a fully controlled pair: a click still moves the strip at once, and a *changed* `value`
   * moves it again. The answer of core to that click arrives later, and a strip that waited for it
   * would stand still for a round trip.
   */
  value?: string
  /** Called with the id of a closable pill that the user closed; see `TabsItem.closable`. */
  onClose?(id: string): void
  /**
   * `'vertical'` (default) keeps the section list on the left, as the settings screen already has
   * it — every existing caller stays untouched and its reference image does not shift.
   * `'horizontal'` puts the list above the panel instead, for the right panel's tab strip.
   */
  orientation?: TabsOrientation
  /**
   * `'line'` (default) marks the active tab with an underline; `'pill'` fills it instead, for the
   * right panel's tab strip. Only meaningful at `orientation: 'horizontal'`.
   */
  variant?: TabsVariant
  /**
   * Lets a horizontal tab list use additional rows when its container is too narrow for one.
   *
   * The default stays a single row so existing strips keep their layout.
   */
  horizontalWrap?: boolean
  /**
   * Content right after the tab list, outside the `tablist`: a control that is not itself a tab
   * must not sit inside Radix's roving tabindex, or the arrow keys that walk the list would also
   * land on it. It sits directly beside the last tab, not pinned to the far edge of the strip — a
   * `+` at the panel's right edge reads as belonging to the panel rather than to the tabs.
   * `RightPanel` uses this for its "+" menu; which tabs exist is knowledge of the panel, not of
   * this component.
   */
  after?: ReactNode
  /**
   * Content at the very start of the strip, before the first tab and outside the `tablist`. In the
   * vertical list it stands *above* the tabs, in the same column: the search field of the settings.
   *
   * `RightPanel` uses this for the panel button, once a docked panel holds the corner of the window
   * (`windowControlsOwner`): at the start rather than the end, so it
   * stands in one place however many tabs there are, and never under the window controls that
   * Windows lays over the end of this strip.
   */
  before?: ReactNode
  /**
   * Content at the far end of the strip, pushed there with `ml-auto` and outside the `tablist`.
   *
   * `RightPanel` puts its full-screen button here, top right: an
   * action on the whole panel, so apart from the tabs and their `+`. Only the window controls of
   * Windows stand further right, and the strip's own reserved room keeps it clear of those.
   */
  end?: ReactNode
  /**
   * Called with the `id` of the tab that was just chosen, however it was chosen.
   *
   * Uncontrolled still: `defaultTab` says where the strip starts and Radix keeps the choice from
   * there, so a caller that only wants to *remember* which tab stood open needs this one callback
   * and no controlled pair. `RightPanel` stores it on the chat.
   */
  onTabChange?(id: string): void
  /**
   * `'plain'` (default) or `'titlebar'`: see {@link TabsStrip}. Only with `orientation:
   * 'horizontal'` and `variant: 'pill'`; the right panel's strip is the one titlebar strip.
   */
  strip?: TabsStrip
  /**
   * `true` when this titlebar strip is the strip at the top right of the window, where Windows lays
   * its window controls; it then carries `data-nt-reserve-window-controls` and `index.css` keeps
   * `--nt-window-controls-width` free at its end (0 on every platform but Windows). The caller
   * decides with `windowControlsOwner`, like `TitleBar`'s prop of the same name.
   */
  reserveWindowControls?: boolean
  /**
   * `true` when this titlebar strip starts at the window's left edge on macOS, under the traffic
   * lights: a panel in full screen beside a folded sidebar. It then carries
   * `data-nt-reserve-traffic-lights`, and `tokens.css` keeps the lights' room free at its start,
   * like `TitleBar`'s prop of the same name.
   */
  reserveTrafficLights?: boolean
  /**
   * What stands under the strip while there are no tabs at all: the right panel's choice of a
   * first tab. The strip itself stays, with only `after` in it, so it still moves
   * the window and still holds the `+`.
   */
  empty?: ReactNode
  /**
   * Places the list and the panels apart, for a vertical list only: the settings screen puts its
   * categories in the column of the chat sidebar and the panel beside it, both inside one Radix root so the tabs still control their panels. The list then has
   * the 32px rows of a column (`--nt-control-lg`), and the panel owns no padding: the caller's
   * column sets its width. `before` stays above the list. The root is `display: contents`, so the
   * two parts can be cells of the caller's own grid.
   */
  arrange?(parts: { list: ReactNode; panels: ReactNode }): ReactNode
  /**
   * Wraps the trigger of a pill in the tooltip of its label, for a pill folded to its icon (see
   * {@link FOLD_LABEL}). A slot rather than an import: the tooltip is a layer above this one
   * (`overlays/`), which a primitive may not reach; the caller hands it in.
   */
  tip?(label: string, trigger: ReactElement): ReactNode
}

/**
 * Tabs in either of two layouts: a section list on the left (vertical, the default) or above its
 * panel (horizontal). Radix drives the arrow-key direction and `aria-orientation` itself once
 * `orientation` reaches both `Root` and `List`; this component only supplies the two looks.
 *
 * The panel is no tab stop, in every variant and orientation. Radix makes it one (`tabIndex=0`) so
 * the keyboard can reach content that scrolls, but then a click on empty space leaves the focus on
 * the panel, and the next key — even Shift alone — puts the browser in keyboard mode and draws a
 * ring around the whole panel that tells the reader nothing. Everything
 * in a panel that the keyboard operates has its own stop and ring — buttons, list rows, a diff
 * block with `tabIndex=0` — so Tab from the list lands on the first of those, and a panel that
 * scrolls stays reachable because its rows and blocks scroll into view when they take the focus.
 * `outline-none` stays on the panel as well: a click still focuses an element with `tabIndex=-1`,
 * and the browser's own `:focus-visible` ring would otherwise come back after the next key.
 */
export function Tabs({
  label,
  tabs,
  defaultTab,
  orientation = 'vertical',
  variant = 'line',
  horizontalWrap = false,
  after,
  before,
  end,
  onTabChange,
  value,
  onClose,
  strip = 'plain',
  reserveWindowControls,
  reserveTrafficLights,
  empty,
  arrange,
  tip,
}: TabsProps) {
  const initial = value ?? defaultTab ?? tabs[0]?.id
  const horizontal = orientation === 'horizontal'
  const pill = horizontal && variant === 'pill'
  const titlebar = pill && strip === 'titlebar'
  // A vertical list with something above it is a column of its own: the slot, then the tabs.
  const arranged = !horizontal && arrange !== undefined
  const column = !horizontal && before !== undefined && !arranged
  const [shown, setShown] = useState(initial)
  // A new `value` from outside wins; one that did not change leaves the user's own choice standing.
  const lastValue = useRef(value)
  if (value !== lastValue.current) {
    lastValue.current = value
    if (value !== undefined && value !== shown) setShown(value)
  }
  // A shown tab that disappeared (closed) falls back to the first one, never to nothing.
  const active = tabs.some((tab) => tab.id === shown) ? shown : tabs[0]?.id
  const triggers = useRef(new Map<string, HTMLButtonElement>())
  // Which edges of a scrolling titlebar strip hide a pill, for the fade of `fadeMask`. Measured
  // after every render (a pill folded or came in), on a scroll, and when the strip is resized.
  const list = useRef<HTMLDivElement>(null)
  const [fade, setFade] = useState({ start: false, end: false })
  const measureFade = useCallback(() => {
    const element = list.current
    if (!titlebar || element === null) return
    const start = element.scrollLeft > 1
    const end = element.scrollLeft + element.clientWidth < element.scrollWidth - 1
    setFade((was) => (was.start === start && was.end === end ? was : { start, end }))
  }, [titlebar])
  useEffect(() => measureFade())
  useEffect(() => {
    const element = list.current
    if (!titlebar || element === null || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measureFade)
    observer.observe(element)
    return () => observer.disconnect()
  }, [titlebar, measureFade])
  const mask = titlebar ? fadeMask(fade.start, fade.end) : undefined
  // A strip that scrolls keeps the active pill in view, whoever chose it.
  useEffect(() => {
    if (!titlebar || active === undefined) return
    triggers.current.get(active)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [titlebar, active])
  const focusNext = useRef<string | null>(null)
  useEffect(() => {
    const id = focusNext.current
    if (id === null) return
    focusNext.current = null
    triggers.current.get(id)?.focus()
  })

  function close(id: string): void {
    const at = tabs.findIndex((tab) => tab.id === id)
    const tab = tabs[at]
    if (!tab?.closable || !onClose) return
    // The tab before it, as core shows it; the next one when it was the first.
    const next = tabs[at - 1] ?? tabs[at + 1]
    if (next) {
      focusNext.current = next.id
      if (id === active) setShown(next.id)
    }
    onClose(id)
  }

  const listPart = (
    <>
      {/* The slot sits beside the list, not inside it — see `after` above. */}
      <div
        className={
          horizontal
            ? stripRow({ strip: titlebar ? 'titlebar' : 'plain' })
            : arranged
              ? 'flex min-h-0 flex-1 flex-col'
              : column
                ? 'flex w-44 shrink-0 flex-col border-r border-border'
                : 'contents'
        }
        {...(titlebar && reserveWindowControls
          ? { 'data-nt-reserve-window-controls': 'true' }
          : {})}
        {...(titlebar && reserveTrafficLights ? { 'data-nt-reserve-traffic-lights': 'true' } : {})}
      >
        {/* `pl-2` puts the slot on the strip's own gutter; the list's `px-2` keeps the pills 8px
              after it, the spacing they keep between themselves and the `+`. */}
        {before ? (
          <div
            className={
              titlebar
                ? 'no-drag shrink-0 pl-2'
                : arranged
                  ? 'shrink-0 px-2'
                  : column
                    ? 'shrink-0 px-2 pt-2'
                    : 'shrink-0 pl-2'
            }
          >
            {before}
          </div>
        ) : null}
        <RadixTabs.List
          ref={list}
          aria-label={label}
          {...(titlebar
            ? {
                onScroll: measureFade,
                ...(fade.start ? { 'data-nt-fade-start': 'true' } : {}),
                ...(fade.end ? { 'data-nt-fade-end': 'true' } : {}),
                ...(mask === undefined ? {} : { style: { maskImage: mask } }),
              }
            : {})}
          className={
            pill
              ? // No `border-b`: the pills stand on their own rather than as a strip against a line.
                pillList({ strip: titlebar ? 'titlebar' : 'plain' })
              : horizontal
                ? horizontalWrap
                  ? 'flex w-full shrink-0 flex-row flex-wrap gap-1 border-b border-border px-2'
                  : 'flex w-full shrink-0 flex-row gap-1 border-b border-border px-2'
                : arranged
                  ? 'flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2'
                  : column
                    ? 'flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2'
                    : 'flex w-44 shrink-0 flex-col gap-0.5 border-r border-border p-2'
          }
        >
          {tabs.map((tab) => {
            const closable = pill && tab.closable === true && onClose !== undefined
            // A glyph drawn by a higher layer wins over a named icon.
            const named = tab.icon ? <Icon name={tab.icon} size="sm" /> : null
            const mark = tab.glyph ? <span className="flex shrink-0">{tab.glyph}</span> : named
            // An inactive pill of a strip too narrow for its labels shows its icon alone.
            const fold = pill && tab.id !== active ? foldOf(FOLD_LABEL, tabs.length, 'sr-only') : ''
            const foldWidth =
              titlebar && tab.id !== active
                ? foldOf(FOLD_WIDTH, tabs.length, 'min-w-0 shrink-0')
                : titlebar && tabs.length > 1
                  ? // The active pill never gives way: its label is where the reader is; the strip
                    // scrolls before it is cut.
                    'shrink-0'
                  : ''
            const foldPad = pill && tab.id !== active ? foldOf(FOLD_PAD, tabs.length, 'pr-2.5') : ''
            const foldCross =
              pill && tab.id !== active ? foldOf(FOLD_CROSS, tabs.length, 'hidden') : ''
            const trigger = (
              <RadixTabs.Trigger
                key={tab.id}
                value={tab.id}
                {...(tab.hint === undefined ? {} : { title: tab.hint })}
                // Heard as "Open, 2": from the content alone the name ran the word into the figure,
                // and a hidden comma is a box of its own that puts a space before it.
                {...((pill || !horizontal) && tab.count != null
                  ? { 'aria-label': `${tab.label}, ${tab.count}` }
                  : {})}
                {...(tab.dimmed ? { disabled: true } : {})}
                ref={(element) => {
                  if (element) triggers.current.set(tab.id, element)
                  else triggers.current.delete(tab.id)
                }}
                {...(closable
                  ? {
                      'aria-keyshortcuts': 'Delete',
                      onAuxClick: (event: React.MouseEvent) => {
                        if (event.button === 1) close(tab.id)
                      },
                      onKeyDown: (event: React.KeyboardEvent) => {
                        if (event.key === 'Delete') {
                          event.preventDefault()
                          close(tab.id)
                        }
                      },
                    }
                  : {})}
                className={
                  pill
                    ? // The fill is the second carrier of "active", beside the label: colour alone
                      // would fail a reader who cannot tell the two text colours apart.
                      // `peer`: the cross beside a closable pill reads this trigger's `data-state`
                      // through `peer-data-[state=active]`, and a closable pill keeps extra room on
                      // the right for that cross, so the icon never makes way for it.
                      `no-drag peer flex h-(--nt-control-md) items-center gap-1.5 rounded-md ${closable ? 'pr-6 pl-2.5' : 'px-2.5'} text-[13px] text-muted outline-focus hover:bg-surface hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 data-[state=active]:bg-surface-hover data-[state=active]:text-fg${titlebar ? ' min-w-18 max-w-36' : ''}${foldWidth ? ` ${foldWidth}` : ''}${closable && foldPad ? ` ${foldPad}` : ''}`
                    : horizontal
                      ? `no-drag flex${horizontalWrap ? ' shrink-0' : ''} h-(--nt-control-md) items-center border-b-2 border-transparent px-3 text-[13px] text-muted outline-focus hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 data-[state=active]:border-accent data-[state=active]:text-fg`
                      : `no-drag flex ${arranged ? 'h-(--nt-control-lg) gap-2 [&>svg]:shrink-0' : 'h-(--nt-control-md)'} items-center rounded-md px-2 text-left text-[13px] text-muted outline-focus hover:bg-surface hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[state=active]:bg-surface-hover data-[state=active]:text-fg`
                }
              >
                {/* Stays put whether the pill can close or not: the cross has its own
                      room at the right of the pill, so the icon never has to make way for it. */}
                {/* The icon names the pill in a tooltip (`tip`): what a pill folded to its icon has
                    left. On the icon, not the trigger: the tooltip's own `data-state` on the
                    trigger would overwrite the tab's `active`. */}
                {pill && tip && mark
                  ? tip(tab.label, <span className="flex shrink-0">{mark}</span>)
                  : mark}
                {pill ? (
                  // One line whatever the name: cut with an ellipsis, never wrapped beside the icon;
                  // folded away whole on an inactive pill of a narrow strip, never to one letter.
                  <span
                    data-nt-tab-label
                    className={fold ? `flex min-w-0 ${fold}` : 'flex min-w-0'}
                  >
                    {tab.middle ? (
                      <MiddleCut label={tab.label} />
                    ) : (
                      <span className="min-w-0 max-w-36 truncate">{tab.label}</span>
                    )}
                  </span>
                ) : arranged ? (
                  <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                ) : (
                  tab.label
                )}
                {pill && tab.count != null ? (
                  <span
                    className={
                      fold
                        ? `text-[12px] text-muted tabular-nums ${fold}`
                        : 'text-[12px] text-muted tabular-nums'
                    }
                  >
                    {tab.count}
                  </span>
                ) : null}
                {!horizontal && tab.count != null ? (
                  <span className="ml-auto pl-2 font-mono text-[11px] text-muted tabular-nums">
                    {tab.count}
                  </span>
                ) : null}
              </RadixTabs.Trigger>
            )
            if (!closable) return trigger
            // A wrapper, because the cross is a button of its own and a button may not stand inside
            // the trigger (which is a button too). It lies at the right of the pill
            // and is no tab stop: the keyboard closes with Delete on the
            // pill itself.
            return (
              // `presentation` and an `aria-hidden` cross: a tablist may hold tabs only (axe
              // `aria-required-children`), so the keyboard and assistive tech close with Delete on
              // the pill, which says so in `aria-keyshortcuts`; the cross is for the pointer.
              <div
                key={tab.id}
                role="presentation"
                className={
                  titlebar
                    ? `group relative flex min-w-18${foldWidth ? ` ${foldWidth}` : ''}`
                    : 'group relative flex'
                }
              >
                {trigger}
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  aria-label={tab.closeLabel}
                  onClick={() => close(tab.id)}
                  // Right, not on the icon's place: always
                  // there on the active pill, on the others only while hovered or focused — `peer`
                  // reads the trigger's own `data-state` a row up.
                  className={`no-drag absolute top-1/2 right-1 flex size-4 -translate-y-1/2 items-center justify-center rounded-sm text-muted opacity-0 hover:bg-surface-hover hover:text-fg peer-data-[state=active]:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 ${foldCross}`}
                >
                  <Icon name="x" size="sm" />
                </button>
              </div>
            )
          })}
        </RadixTabs.List>
        {/* No `ml-auto`: the slot follows the list in normal flow, so it sits right behind the
              last tab. Both the `pill` and `line` list already carry their own trailing padding
              (`px-2`), which reads as the same spacing the tabs keep between themselves. */}
        {after ? <div className={titlebar ? 'no-drag shrink-0' : 'shrink-0'}>{after}</div> : null}
        {/* `pr-2` mirrors the `pl-2` of `before`: the strip's own gutter at its far end. */}
        {end ? <div className="no-drag ml-auto shrink-0 pr-2">{end}</div> : null}
      </div>
    </>
  )
  const panelsPart = (
    <>
      {tabs.map((tab) => (
        <RadixTabs.Content
          key={tab.id}
          value={tab.id}
          // Overrides Radix's own `tabIndex=0`; why the panel is no tab stop is in the JSDoc above.
          tabIndex={-1}
          className={
            tab.flush
              ? 'flex min-h-0 flex-1 flex-col outline-none'
              : pill
                ? // No room on top: the strip already keeps 6px under its pills, and with the 2px
                  // the changes toolbar keeps around its 28px picker, that picker stands 8px under
                  // the active pill. No stable scrollbar gutter
                  // here, unlike the other shapes: the rows and diffs of the changes tab run from
                  // edge to edge of the panel, and a gutter would leave an empty 8px strip at their
                  // right end whenever nothing scrolls.
                  'min-h-0 flex-1 overflow-y-auto px-3 pt-0 pb-4 outline-none'
                : horizontal
                  ? 'min-h-0 flex-1 overflow-y-auto px-6 py-4 outline-none [scrollbar-gutter:stable]'
                  : arranged
                    ? // The caller's column sets the reading width; this only scrolls it.
                      'min-h-0 min-w-0 flex-1 overflow-y-auto px-6 pt-2 pb-10 outline-none [scrollbar-gutter:stable]'
                    : 'min-w-0 flex-1 overflow-y-auto px-8 py-6 outline-none [scrollbar-gutter:stable]'
          }
        >
          {tab.content}
        </RadixTabs.Content>
      ))}
    </>
  )

  return (
    <RadixTabs.Root
      orientation={orientation}
      {...(active ? { value: active } : {})}
      onValueChange={(id) => {
        setShown(id)
        onTabChange?.(id)
      }}
      // Arranged, the root draws no box of its own: the caller's layout places the two parts.
      className={
        horizontal ? 'flex min-h-0 flex-1 flex-col' : arranged ? 'contents' : 'flex min-h-0 flex-1'
      }
    >
      {arranged ? (
        arrange({ list: listPart, panels: panelsPart })
      ) : (
        <>
          {listPart}
          {panelsPart}
        </>
      )}
      {tabs.length === 0 ? empty : null}
    </RadixTabs.Root>
  )
}
