import type { Story } from '../gallery/story'
import { Tooltip } from '../overlays/Tooltip'
import { IconButton } from '../primitives/IconButton'
import { List } from './List'
import { RoomyListRow } from './RoomyListRow'

/**
 * Roomy rows at the width of a docked panel: done, running with a long title, failed, and one
 * without a note.
 */
export default {
  group: 'patterns',
  title: 'Roomy list row',
  states: {
    'A title over one or two lines, and a note': () => (
      <div className="w-80">
        <List label="Subagents">
          <RoomyListRow
            title="Finds the discount"
            kind="done"
            status="Done"
            meta="4 actions · 00:12"
            note="The discount is computed in src/cart.ts."
          />
          <RoomyListRow
            title="Reads the tests of the cart and notes every case that the discount leaves uncovered"
            kind="running"
            status="Running"
            meta="6 actions · 00:31"
            note="Reading tests/cart.test.ts"
          />
          <RoomyListRow
            title="Checks the prices"
            kind="failed"
            status="Failed"
            meta="1 action · 00:02"
            note="Could not read data/prices.json."
          />
          <RoomyListRow title="Waits in line" kind="queued" status="Queued" meta="0 actions" />
        </List>
      </div>
    ),
    // The menu of a row stands beside it, quiet until hover or focus: the picture shows its room.
    'With actions beside it, and something under it': () => (
      <div className="w-80">
        <List label="Subagents">
          <RoomyListRow
            title="Tests for the cart"
            kind="running"
            status="Running"
            meta="large · +48 −3 · 4"
            actions={
              <Tooltip label="Actions">
                <IconButton icon="more-horizontal" size="sm" label="Actions" />
              </Tooltip>
            }
            below={<p className="ps-8 pb-2 text-[12px] text-muted">A field opens here.</p>}
          />
        </List>
      </div>
    ),
  },
} satisfies Story
