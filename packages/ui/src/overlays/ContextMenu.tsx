import { ContextMenu as RadixContextMenu } from 'radix-ui'
import type { ReactElement } from 'react'
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
   * a long press on a touch screen, and the context-menu key or Shift+F10 on what is focused in it).
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
  subWidth: 'max-w-[min(20rem,var(--radix-context-menu-content-available-width))]',
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
 * and an outside click still close it, and the focus goes back to what held it before.
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
  return (
    <RadixContextMenu.Root modal={false} {...(onOpenChange ? { onOpenChange } : {})}>
      <RadixContextMenu.Trigger asChild {...(disabled ? { disabled } : {})}>
        {children}
      </RadixContextMenu.Trigger>
      <RadixContextMenu.Portal container={container}>
        <RadixContextMenu.Content
          aria-label={label}
          // Same collision handling as every panel: 8px from the edge of the window.
          collisionPadding={8}
          className={`${header === undefined ? frame : frame.replace('min-w-40', 'min-w-58')} ${MENU_WIDTH}`}
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
