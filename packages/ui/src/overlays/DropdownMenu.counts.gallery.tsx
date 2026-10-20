import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { DropdownMenu, type DropdownMenuItem } from './DropdownMenu'

/** The scopes of the list in Specs, each with its count and its key. */
const SCOPES: DropdownMenuItem[] = [
  {
    id: 'forYou',
    label: 'Voor jou',
    kind: 'radio',
    group: 'scope',
    checked: true,
    count: 5,
    shortcut: 'sdd.scope.forYou',
    onSelect: () => {},
  },
  {
    id: 'open',
    label: 'Open',
    kind: 'radio',
    group: 'scope',
    checked: false,
    count: 24,
    shortcut: 'sdd.scope.open',
    onSelect: () => {},
  },
  {
    id: 'all',
    label: 'Alles',
    kind: 'radio',
    group: 'scope',
    checked: false,
    count: 41,
    shortcut: 'sdd.scope.all',
    onSelect: () => {},
  },
]

/**
 * A choice among scopes, open, each row with its count after its label and its key at the end.
 *
 * A story of its own rather than a state of `DropdownMenu`: a page of the gallery holds one open
 * menu at most, and a second `defaultOpen` there would close the one of its `Open` state.
 */
function Open() {
  return (
    <div className="h-48 w-64">
      <DropdownMenu trigger={<Button>Bereik</Button>} label="Bereik" items={SCOPES} defaultOpen />
    </div>
  )
}

export default {
  group: 'overlays',
  title: 'DropdownMenu with counts',
  states: { Open },
} satisfies Story
