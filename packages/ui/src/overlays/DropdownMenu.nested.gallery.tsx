import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { Icon } from '../primitives/Icon'
import { DropdownMenu, type DropdownMenuItem } from './DropdownMenu'

/** A choice in a group, with its check on the right: the shape of the model menu. */
function choice(id: string, label: string, group: string, checked: boolean): DropdownMenuItem {
  return { id, label, kind: 'radio', group, checked, onSelect: () => {} }
}

/**
 * A quiet heading with a glyph, three choices, a submenu with the rest, a line, a second group
 * of choices under a heading of its own, and a submenu that names its value on the right.
 */
const ITEMS: DropdownMenuItem[] = [
  { id: 'heading', label: 'Model', kind: 'heading', glyph: <Icon name="bot" size="sm" /> },
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
 * Open from the first render, with the checks at the end and the panel as tall as there is room.
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
        checks="end"
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
