import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { DropdownMenu, type DropdownMenuItem } from './DropdownMenu'

/** A choice in a group, its dot in the column before the label, as in every menu of the family. */
function choice(id: string, label: string, group: string, checked: boolean): DropdownMenuItem {
  return { id, label, kind: 'radio', group, checked, onSelect: () => {} }
}

/**
 * A quiet heading on the column of the labels, three choices, a submenu with the rest, a line, a second group
 * of choices under a heading of its own, and a submenu that names its value on the right.
 */
const ITEMS: DropdownMenuItem[] = [
  { id: 'heading', label: 'Model', kind: 'heading' },
  choice('north', 'Noord 5', 'model', true),
  choice('south', 'Zuid Pro 2', 'model', false),
  choice('east', 'Oost 3', 'model', false),
  {
    id: 'more',
    label: 'Meer modellen',
    kind: 'submenu',
    items: [choice('west', 'West 1', 'more', false), choice('mid', 'Midden 2', 'more', false)],
  },
  { id: 'level', label: 'Denkniveau', kind: 'heading', separated: true },
  choice('low', 'Laag', 'level', false),
  choice('medium', 'Gemiddeld', 'level', true),
  choice('high', 'Hoog', 'level', false),
  {
    id: 'agent',
    label: 'Agent',
    kind: 'submenu',
    value: 'Relay',
    separated: true,
    items: [choice('relay', 'Relay', 'agent', true), choice('anker', 'Anker', 'agent', false)],
  },
]

/**
 * Open from the first render, with the panel as tall as there is room. The choices keep their mark
 * at the start, where the `ContextMenu` and the menu with counts have it too: one place for the
 * selected mark across the family (`checks="end"` remains for a menu whose rows lead with marks of
 * their own).
 *
 * A story of its own rather than a state of `DropdownMenu`: a page of the gallery holds one open
 * menu at most, and a second `defaultOpen` there would close the one of its `Open` state.
 */
function Open() {
  return (
    <div className="h-96 w-64">
      <DropdownMenu
        trigger={<Button>Model</Button>}
        label="Model"
        items={ITEMS}
        height="available"
        defaultOpen
      />
    </div>
  )
}

export default {
  group: 'overlays',
  title: 'DropdownMenu with submenus',
  states: { Open },
} satisfies Story
