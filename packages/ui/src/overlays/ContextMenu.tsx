import { ContextMenu as RadixContextMenu } from 'radix-ui'
import {
  type ReactElement,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { handBackOnlyLostFocus } from '../primitives/hand-back'
import type { DropdownMenuHeader, DropdownMenuItem } from './DropdownMenu'
import { MENU_WIDTH, MenuBody, type MenuParts } from './menu-rows'
import { PANEL } from './panel'
import { usePortalContainer } from './portal'

/** The props of `ContextMenu`. */
export interface ContextMenuProps {
  /**
   * The region the menu belongs to: a row, a card, a file in a tree. One element, rendered
   * `asChild`: it keeps its own looks and receives the handlers that open the menu (a right click,
   * a long press on a touch screen, and the context-menu key or Shift+F10 on what is focused in it,
   * on macOS as well, where the browser does not turn those keys into a right click).
   *
   * A region that takes the focus itself (a drawing, a card) gives the keyboard something to press
   * those keys on: `tabIndex={0}`, `role="group"` with an `aria-label` naming it,
   * `aria-describedby` at the line that says how to open its menu, and
   * `aria-keyshortcuts="Shift+F10"`, so a reader hears that a menu lives there.
   */
  children: ReactElement
  /** Accessible name of the menu. */
  label: string
  /**
   * The rows, exactly the item model of `DropdownMenu` ({@link DropdownMenuItem}): icons, a
   * `danger` or `quiet` tone, shortcuts, counts, choices, headings and submenus. One array can feed
   * both menus, so the `⋯` of a row and a right click on it offer the same acts in the same order.
   */
  items: readonly DropdownMenuItem[]
  /** A head above the rows, as on `DropdownMenu`: who or what the menu is about. */
  header?: DropdownMenuHeader
  /** Where a choice row draws its check: `start` (the default) or `end`, as on `DropdownMenu`. */
  checks?: 'start' | 'end'
  /** `comfortable` rows of 36px with quiet icons, as on `DropdownMenu`; `default` rows of 32px. */
  density?: 'default' | 'comfortable'
  /**
   * How tall the panel may grow: `default` is the 288px of every layer, `available` the room
   * Radix measured between the pointer and the edge of the window.
   */
  height?: 'default' | 'available'
  /**
   * Leaves the region to the browser: a right click shows the system's own menu again. For a
   * region that is busy for a moment, rather than unmounting the menu around it.
   */
  disabled?: boolean
  /** Told when the menu opens or closes, e.g. to keep the region marked while its menu is up. */
  onOpenChange?(open: boolean): void
}

/**
 * Keeps the panel 8px inside the window across, which Radix does not: a context menu opens on the
 * right of the pointer and only flips to its left, so on a phone, where a press in the middle
 * leaves room on neither side, the panel spilled past the edge. Radix measures the room on the side
 * it opened to (`available-width`, already less the 8px); the panel slides back by what it lacks,
 * to the left on the right side and to the right on the left side, never further than it must.
 * A submenu does the same, over its parent, when neither side has room for it.
 */
const CLAMP =
  'data-[side=right]:translate-x-[min(0px,calc(var(--radix-context-menu-content-available-width)-100%))] data-[side=left]:translate-x-[max(0px,calc(100%-var(--radix-context-menu-content-available-width)))]'

/** The parts of a `ContextMenu`: the same rows, in Radix' context menu. */
const CONTEXT_PARTS: MenuParts = {
  Item: RadixContextMenu.Item,
  CheckboxItem: RadixContextMenu.CheckboxItem,
  RadioGroup: RadixContextMenu.RadioGroup,
  RadioItem: RadixContextMenu.RadioItem,
  ItemIndicator: RadixContextMenu.ItemIndicator,
  Separator: RadixContextMenu.Separator,
  Group: RadixContextMenu.Group,
  Sub: RadixContextMenu.Sub,
  SubTrigger: RadixContextMenu.SubTrigger,
  SubContent: RadixContextMenu.SubContent,
  Portal: RadixContextMenu.Portal,
  tallPanel: PANEL.replace('max-h-72', 'max-h-(--radix-context-menu-content-available-height)'),
  subWidth: `max-w-[min(16rem,var(--radix-context-menu-content-available-width))] ${CLAMP}`,
}

/**
 * Whether a key asks for the context menu: the context-menu key, or Shift+F10. Windows and Linux
 * turn either into a `contextmenu` event of their own; macOS never does, so the menu listens for
 * them itself and the way in a hint names works on every platform.
 */
function asksForMenu(event: ReactKeyboardEvent): boolean {
  if (event.key === 'ContextMenu') return true
  return event.key === 'F10' && event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey
}

/** Whether a key lands in a field, whose own menu (paste, spelling) the key is left to. */
function inField(target: EventTarget): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target.matches('input, textarea, select')
}

/**
 * A menu at the pointer, for the acts on whatever was right-clicked: a row, a card, a file. The
 * sibling of `DropdownMenu`, with the same rows drawn the same way (one item model, one frame):
 * only where it opens differs. Radix `ContextMenu` underneath, wrapped once here.
 *
 * A right click is a shortcut, never the only way: whatever a context menu offers is also on a
 * visible control (usually the `⋯` of the row, a `DropdownMenu` fed the same `items`), since a
 * menu nobody sees is a menu nobody finds (Jakob's law cuts both ways: a right click is familiar
 * on a desktop and unknown on a phone, where a long press opens it).
 *
 * **`modal={false}`, as on `DropdownMenu`**, for the same reason: a modal menu hides the rest of
 * the window from a reader while leaving it in the tab order (axe: `focusable-disabled`). Escape
 * and an outside click still close it, and the focus goes back to what held it before. A scroll
 * that moves the region closes it too, as a native menu does, so a panel never outlives its subject.
 */
export function ContextMenu({
  children,
  label,
  items,
  header,
  checks = 'start',
  density = 'default',
  height = 'default',
  disabled,
  onOpenChange,
}: ContextMenuProps) {
  const container = usePortalContainer()
  const frame = height === 'available' ? CONTEXT_PARTS.tallPanel : PANEL
  const region = useRef<HTMLElement>(null)
  // Where the menu was opened, and whether a press has landed in the panel since.
  const press = useRef({ x: 0, y: 0, inside: false })
  const [open, setOpen] = useState(false)
  const change = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
  }

  // Closed when the region moves away under it, as a native context menu does: a scroll of the page
  // or of any box around the region left the panel floating over whatever scrolled into its place.
  // A scroll inside the panel (a long list) or elsewhere on the page leaves it open.
  useEffect(() => {
    if (!open) return
    const onScroll = (event: Event) => {
      const target = event.target
      const own = region.current
      if (own && target instanceof Node && target.contains(own)) {
        setOpen(false)
        onOpenChange?.(false)
      }
    }
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => window.removeEventListener('scroll', onScroll, { capture: true })
  }, [open, onOpenChange])

  // The keyboard's way in, at the bottom left of what holds the focus: a `contextmenu` of our own,
  // which Radix opens on as on a right click (and which, coming after a key, puts the focus on the
  // first row). The key's own default is stopped, so Windows does not open the menu a second time.
  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (disabled || !asksForMenu(event) || inField(event.target)) return
    if (!(event.target instanceof Element)) return
    event.preventDefault()
    const box = event.target.getBoundingClientRect()
    event.target.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: box.left,
        clientY: box.bottom,
      }),
    )
  }

  return (
    <RadixContextMenu.Root modal={false} open={open} onOpenChange={change}>
      <RadixContextMenu.Trigger
        asChild
        ref={region}
        onKeyDown={onKeyDown}
        onContextMenu={(event) => {
          press.current = { x: event.clientX, y: event.clientY, inside: false }
        }}
        onPointerDown={(event) => {
          // A long press opens on a timer with the point of its pointerdown.
          if (event.pointerType !== 'mouse') {
            press.current = { x: event.clientX, y: event.clientY, inside: false }
          }
        }}
        {...(disabled ? { disabled } : {})}
      >
        {children}
      </RadixContextMenu.Trigger>
      <RadixContextMenu.Portal container={container}>
        <RadixContextMenu.Content
          aria-label={label}
          collisionPadding={8}
          // A short menu of acts wraps at its ends, as a native one does.
          loop
          className={`${header === undefined ? frame : frame.replace('min-w-40', 'min-w-58')} ${MENU_WIDTH} ${CLAMP}`}
          onPointerDownCapture={() => {
            press.current.inside = true
          }}
          onPointerUpCapture={(event) => {
            // The release of the press that opened the menu (a long press, or a right click
            // where the panel was slid under the pointer) is not a choice: Radix would click the
            // row under it. A release after a drag away from that point still chooses, as natively.
            const { x, y, inside } = press.current
            if (!inside && Math.hypot(event.clientX - x, event.clientY - y) < 8) {
              event.stopPropagation()
            }
          }}
          // The focus goes back to what held it before the menu, but only when it went down with
          // the menu; one a row has put somewhere on purpose stays there (see `DropdownMenu`).
          onCloseAutoFocus={handBackOnlyLostFocus}
        >
          <MenuBody
            parts={CONTEXT_PARTS}
            items={items}
            checks={checks}
            density={density}
            header={header}
          />
        </RadixContextMenu.Content>
      </RadixContextMenu.Portal>
    </RadixContextMenu.Root>
  )
}
