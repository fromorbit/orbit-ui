import {
  type AriaAttributes,
  type ComponentPropsWithRef,
  createContext,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useContext,
} from 'react'
import { Tooltip } from '../overlays/Tooltip'
import type { ShortcutLabel } from '../primitives/shortcut'
import { useUi } from '../provider/UiProvider'
import { navClick } from './nav-click'

/** Whether the rail around an item is the narrow one: icons only. */
const NarrowContext = createContext(false)

/** The props of `AppRail`. */
export interface AppRailProps {
  /** The name of the landmark, in the host's words ("Apps"). */
  label: string
  /** The apps, as `AppRailItem`s, from the top. */
  children: ReactNode
  /** What stands at the foot of the rail, as `AppRailItem`s: help, settings. */
  foot?: ReactNode
  /**
   * The narrow rail of 56px: only the icons, each item still named by its label and showing it
   * in a tooltip. For a host whose window is short of room; the host switches it itself. The
   * default is the rail of 72px with a label under each icon.
   */
  narrow?: boolean
}

/**
 * The rail of the apps of the family: the leftmost column of the shell, on the frame
 * (`docs/family-style.md`, "The shell").
 *
 * A `nav` landmark with two lists, the apps from the top and the foot (help, settings) pushed to
 * the bottom. 72px wide, each item 60px (6px of inset on either side) with an icon of 20px over
 * its label in 11px, never cut off; the narrow rail of 56px keeps only the icons. The rail
 * scrolls in a short window, so the foot stays within reach. The open app is shown once: a neutral plane (`row-active`), its words
 * at full strength, `aria-current="page"`, and the satellite of that app as a 4px dot beside the
 * plane. The satellite is never the plane or the words (it is a mark, not a role). Every word
 * and every icon comes in as a prop: the kit draws no symbol of an app.
 */
export function AppRail({ label, children, foot, narrow = false }: AppRailProps) {
  return (
    <NarrowContext.Provider value={narrow}>
      <nav
        aria-label={label}
        data-nt-app-rail
        className={
          narrow
            ? 'flex h-full w-14 shrink-0 flex-col items-center overflow-y-auto pt-1.5 pb-3'
            : 'flex h-full w-18 shrink-0 flex-col items-center overflow-y-auto pt-1.5 pb-3'
        }
      >
        <ul className="m-0 flex list-none flex-col items-center gap-1 p-0">{children}</ul>
        {foot === undefined ? null : (
          <ul className="m-0 mt-auto flex list-none flex-col items-center gap-1 p-0 pt-1">
            {foot}
          </ul>
        )}
      </nav>
    </NarrowContext.Provider>
  )
}

/** The products of the family, each with a satellite in `tokens.css` (`data-product`). */
export type FamilyProduct = 'orbit' | 'halo' | 'fold' | 'lens' | 'trail' | 'comet'

/**
 * What a host may not hand the control: the kit draws its look, its words and its click. `onSelect`
 * is the item's own action; the DOM's `select` event means nothing on a link or a button.
 */
type OwnProps = 'className' | 'style' | 'children' | 'onSelect' | 'aria-current'

/** What every `AppRailItem` has, a link or a button. */
interface AppRailItemBase {
  /** The name of the app or place, under the icon; on a narrow rail its name and tooltip. */
  label: string
  /** The app's symbol or a glyph from `Icon`, drawn at 20px; decorative, the label names it. */
  icon: ReactNode
  /** The app that is open: the neutral plane, `aria-current="page"` and the satellite beside it. */
  current?: boolean
  /**
   * The product of this app, set as `data-product` on the item, so the dot beside the open item
   * is that app's satellite. Without it the dot takes the satellite of the page.
   */
  product?: FamilyProduct
  /**
   * The command that opens this item, read through the `ShortcutPort` of `UiProvider`, as `Button`
   * does: a tooltip beside the item then shows its label with the key (`Kbd`), and the key reaches a
   * screen reader as `aria-keyshortcuts`. On the wide rail the tooltip stands only when the port
   * knows a key, since the label already stands under the icon; the narrow rail always has one.
   */
  shortcut?: ShortcutLabel
}

/** An item that leads somewhere: a real link, so a new tab still works. */
interface AppRailLink extends AppRailItemBase, Omit<ComponentPropsWithRef<'a'>, OwnProps | 'href'> {
  href: string
  /** Takes a plain click instead of the browser, so the host routes without a reload. */
  onNavigate?: (href: string) => void
  /** Called on hover and on focus with the `href`, so the host can prefetch what it leads to. */
  onIntent?: (href: string) => void
  onSelect?: never
}

/**
 * An item that opens something in place (help in a dialog or a menu): a button of the same shape.
 *
 * Every other prop goes to the `<button>`, its `ref` too, so the item can be the `trigger` of a
 * `DropdownMenu` or `Popover` (Radix `asChild`): the trigger then wires `aria-haspopup`,
 * `aria-expanded` and the click itself, and `onSelect` may be left out.
 */
interface AppRailButton
  extends AppRailItemBase,
    Omit<ComponentPropsWithRef<'button'>, OwnProps | 'type'> {
  href?: never
  onNavigate?: never
  onIntent?: never
  /** What the button does; left out only on the trigger of a menu, which opens it itself. */
  onSelect?: () => void
  /** What it opens, as `aria-haspopup` on the button (`dialog`, `menu`). */
  'aria-haspopup'?: AriaAttributes['aria-haspopup']
  /** Whether what it opens is open, for a host that drives a menu or dialog itself. */
  'aria-expanded'?: AriaAttributes['aria-expanded']
}

/** The props of `AppRailItem`: a link with `href`, or a button with `onSelect`. */
export type AppRailItemProps = AppRailLink | AppRailButton

/**
 * One app or place on the `AppRail`: a link of 60px wide and at least 52px high (44px square on
 * the narrow rail), radius 8px; or, without `href`, a `<button>` of the same shape (help that
 * opens a dialog or a menu). At rest in muted, under the pointer on `surface-hover` (the hover of
 * `SideNav` too, one role for the whole shell), open on `row-active` in `fg`. On the narrow rail
 * the label shows in a tooltip beside the icon; with a `shortcut` the tooltip names its key too.
 *
 * Its `ref` and every other prop reach the link or the button, never the list item around it, so
 * it can stand as the `asChild` trigger of a menu. The host's `onClick` runs first; the item's own
 * `onSelect` or `onNavigate` only when that click was not prevented.
 */
export function AppRailItem(props: AppRailItemProps) {
  const { label, icon, current = false, product, shortcut } = props
  const narrow = useContext(NarrowContext)
  const { shortcuts } = useUi()
  const shape = narrow
    ? 'no-drag flex size-11 items-center justify-center rounded-md text-[11px] font-medium no-underline outline-focus transition-colors duration-(--nt-duration-fast) ease-(--nt-ease) focus-visible:outline-2 focus-visible:outline-offset-2'
    : 'no-drag flex min-h-[52px] w-15 flex-col items-center gap-1 rounded-md pt-2 pb-1.5 text-[11px] leading-4 font-medium no-underline outline-focus transition-colors duration-(--nt-duration-fast) ease-(--nt-ease) focus-visible:outline-2 focus-visible:outline-offset-2'
  const tone = current ? 'bg-row-active text-fg' : 'text-muted hover:bg-surface-hover hover:text-fg'
  const key = shortcut === undefined || shortcut === '' ? undefined : shortcut
  const knownKey = key !== undefined && shortcuts.label(key) !== undefined
  const keyshortcuts = key === undefined ? undefined : shortcuts.aria(key)
  const body = (
    <>
      <span aria-hidden="true" className="flex size-5 items-center justify-center [&_svg]:size-5">
        {icon}
      </span>
      <span className={narrow ? 'sr-only' : 'whitespace-nowrap'}>{label}</span>
    </>
  )
  let control: ReactNode
  if (props.href === undefined) {
    const {
      label: _label,
      icon: _icon,
      current: _current,
      product: _product,
      shortcut: _shortcut,
      href: _href,
      onNavigate: _onNavigate,
      onIntent: _onIntent,
      onSelect,
      onClick,
      ...rest
    } = props
    const {
      className: _className,
      style: _style,
      ...attributes
    } = rest as typeof rest & {
      className?: string
      style?: unknown
    }
    control = (
      <button
        type="button"
        aria-keyshortcuts={keyshortcuts}
        {...attributes}
        aria-current={current ? 'page' : undefined}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event)
          if (!event.defaultPrevented) onSelect?.()
        }}
        className={`${shape} ${tone}`}
      >
        {body}
      </button>
    )
  } else {
    const {
      label: _label,
      icon: _icon,
      current: _current,
      product: _product,
      shortcut: _shortcut,
      href,
      onNavigate,
      onIntent,
      onSelect: _onSelect,
      onClick,
      onMouseEnter,
      onFocus,
      ...rest
    } = props
    const {
      className: _className,
      style: _style,
      ...attributes
    } = rest as typeof rest & {
      className?: string
      style?: unknown
    }
    const navigate = navClick(href, onNavigate)
    control = (
      <a
        aria-keyshortcuts={keyshortcuts}
        {...attributes}
        href={href}
        aria-current={current ? 'page' : undefined}
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented) navigate?.(event)
        }}
        onMouseEnter={(event) => {
          onMouseEnter?.(event)
          onIntent?.(href)
        }}
        onFocus={(event) => {
          onFocus?.(event)
          onIntent?.(href)
        }}
        className={`${shape} ${tone}`}
      >
        {body}
      </a>
    )
  }
  return (
    <li className="relative" {...(product === undefined ? {} : { 'data-product': product })}>
      {current ? (
        <span
          aria-hidden="true"
          data-nt-app-rail-satellite
          className="absolute top-1/2 -start-[5px] size-1 -translate-y-1/2 rounded-full bg-satellite"
        />
      ) : null}
      {narrow || knownKey ? (
        <Tooltip label={label} side="right" {...(knownKey ? { shortcut: key } : {})}>
          {control as ReactElement}
        </Tooltip>
      ) : (
        control
      )}
    </li>
  )
}
