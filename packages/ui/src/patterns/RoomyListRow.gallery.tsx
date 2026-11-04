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
  title: 'RoomyListRow',
  states: {
    'Een titel over een of twee regels, en een notitie': () => (
      <div className="w-full max-w-80">
        <List label="Subagenten">
          <RoomyListRow
            title="Zoekt de korting"
            kind="done"
            status="Klaar"
            meta="4 stappen · 00:12"
            note="De korting wordt berekend in src/cart.ts."
          />
          <RoomyListRow
            title="Leest de tests van de winkelmand en noteert elk geval dat de korting niet dekt"
            kind="running"
            status="Loopt"
            meta="6 stappen · 00:31"
            note="Leest tests/cart.test.ts"
          />
          <RoomyListRow
            title="Controleert de prijzen"
            kind="failed"
            status="Mislukt"
            meta="1 stap · 00:02"
            note="Kon data/prices.json niet lezen."
          />
          <RoomyListRow
            title="Wacht op zijn beurt"
            kind="queued"
            status="In de wachtrij"
            meta="0 stappen"
          />
        </List>
      </div>
    ),
    // The menu of a row stands beside it, quiet until hover or focus: the picture shows its room.
    'Met acties ernaast en iets eronder': () => (
      <div className="w-full max-w-80">
        <List label="Subagenten">
          <RoomyListRow
            title="Tests voor de winkelmand"
            kind="running"
            status="Loopt"
            meta="groot · +48 −3 · 4"
            actions={
              <Tooltip label="Acties">
                <IconButton icon="more-horizontal" size="sm" label="Acties" />
              </Tooltip>
            }
            below={<p className="ps-8 pb-2 text-[12px] text-muted">Hier opent een veld.</p>}
          />
        </List>
      </div>
    ),
  },
} satisfies Story
