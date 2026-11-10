import {
  type AriaAttributes,
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
} from 'react'
import { Tooltip } from '../overlays/Tooltip'
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
}

/** An item that leads somewhere: a real link, so a new tab still works. */
interface AppRailLink extends AppRailItemBase {
  href: string
  /** Takes a plain click instead of the browser, so the host routes without a reload. */
  onNavigate?: (href: string) => void
  /** Called on hover and on focus with the `href`, so the host can prefetch what it leads to. */
  onIntent?: (href: string) => void
  onSelect?: never
}

/** An item that opens something in place (help in a dialog): a button of the same shape. */
interface AppRailButton extends AppRailItemBase {
  href?: never
  onNavigate?: never
  onIntent?: never
  /** What the button does. */
  onSelect: () => void
  /** What it opens, as `aria-haspopup` on the button (`dialog`, `menu`). */
  'aria-haspopup'?: AriaAttributes['aria-haspopup']
}

/** The props of `AppRailItem`: a link with `href`, or a button with `onSelect`. */
export type AppRailItemProps = AppRailLink | AppRailButton

/**
 * One app or place on the `AppRail`: a link of 60px wide and at least 52px high (44px square on
 * the narrow rail), radius 8px; or, without `href` and with `onSelect`, a `<button>` of the same
 * shape (help that opens a dialog). At rest in muted, under the pointer on `surface-hover` (the
 * hover of `SideNav` too, one role for the whole shell), open on `row-active` in `fg`. On the
 * narrow rail the label shows in a tooltip beside the icon.
 */
export function AppRailItem(props: AppRailItemProps) {
  const { label, icon, current = false, product } = props
  const narrow = useContext(NarrowContext)
  const shape = narrow
    ? 'no-drag flex size-11 items-center justify-center rounded-md text-[11px] font-medium no-underline outline-focus transition-colors duration-(--nt-duration-fast) ease-(--nt-ease) focus-visible:outline-2 focus-visible:outline-offset-2'
    : 'no-drag flex min-h-[52px] w-15 flex-col items-center gap-1 rounded-md pt-2 pb-1.5 text-[11px] leading-4 font-medium no-underline outline-focus transition-colors duration-(--nt-duration-fast) ease-(--nt-ease) focus-visible:outline-2 focus-visible:outline-offset-2'
  const tone = current ? 'bg-row-active text-fg' : 'text-muted hover:bg-surface-hover hover:text-fg'
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
    control = (
      <button
        type="button"
        aria-current={current ? 'page' : undefined}
        aria-haspopup={props['aria-haspopup']}
        onClick={props.onSelect}
        className={`${shape} ${tone}`}
      >
        {body}
      </button>
    )
  } else {
    const { href, onNavigate, onIntent } = props
    const intent = onIntent === undefined ? undefined : () => onIntent(href)
    control = (
      <a
        href={href}
        aria-current={current ? 'page' : undefined}
        onClick={navClick(href, onNavigate)}
        onMouseEnter={intent}
        onFocus={intent}
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
      {narrow ? (
        <Tooltip label={label} side="right">
          {control as ReactElement}
        </Tooltip>
      ) : (
        control
      )}
    </li>
  )
}
