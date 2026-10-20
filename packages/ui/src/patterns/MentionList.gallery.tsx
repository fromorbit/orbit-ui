import { useState } from 'react'
import type { Story } from '../gallery/story'
import { MentionList, type MentionListItem } from './MentionList'

/** Hits for `tot` in a made-up shop, as core would rank and mark them. */
const HITS: MentionListItem[] = [
  { path: 'src/winkelmand/totaal.ts', kind: 'file', ranges: [[15, 18]] },
  { path: 'src/rapport/subtotaal.ts', kind: 'file', ranges: [[15, 18]] },
  { path: 'src/tot', kind: 'dir', ranges: [[4, 7]] },
  { path: 'docs/tot-slot.md', kind: 'file', ranges: [[5, 8]] },
]

/** An empty query: first what this chat changed, then the rest of the project. */
const OPENED: MentionListItem[] = [
  { path: 'notities.md', kind: 'file', group: 'Gewijzigd in deze chat' },
  { path: 'src/winkelmand/totaal.ts', kind: 'file', group: 'Gewijzigd in deze chat' },
  { path: 'README.md', kind: 'file', group: 'Bestanden' },
  { path: 'package.json', kind: 'file', group: 'Bestanden' },
  { path: 'src', kind: 'dir', group: 'Bestanden' },
]

/** A list the story walks with the mouse, as the composer walks it with the keys. */
function state(items: readonly MentionListItem[], truncated = false) {
  return function State() {
    const [active, setActive] = useState(0)
    return (
      <div className="w-[36rem]">
        <MentionList
          id="mention-galerij"
          label="Bestanden"
          items={items}
          activeIndex={active}
          onActiveChange={setActive}
          onPick={setActive}
          truncated={truncated}
          truncatedLabel="Niet alle bestanden van dit project staan in de lijst"
          emptyLabel="Geen bestanden"
          countLabel={`${items.length} bestanden`}
          anchor={null}
        />
      </div>
    )
  }
}

/**
 * The list of an `@` mention in the composer: hits with what matched, the two groups of an empty
 * query, a list core cut, and no hits at all.
 */
export default {
  group: 'patterns',
  title: 'MentionList',
  states: {
    Hits: state(HITS),
    'Empty query': state(OPENED),
    'A cut list': state(HITS, true),
    'No files': state([]),
  },
} satisfies Story
