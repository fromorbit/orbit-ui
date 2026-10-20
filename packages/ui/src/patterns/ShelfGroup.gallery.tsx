import { useState } from 'react'
import type { Story } from '../gallery/story'
import { ProjectMark } from '../primitives/ProjectMark'
import { nl } from '../testing/labels'
import { List } from './List'
import { ShelfGroup } from './ShelfGroup'
import { StackedRow, StackedRowBranch } from './StackedRow'

/** Two finished chats that sank to the shelf; the names are made up. */
const settled = [
  { project: 'webshop', title: 'Kortingscodes valideren', branch: 'nt/kortingscodes', time: '4d' },
  { project: 'boekhoud-api', title: 'Btw-tarieven 2027', branch: 'main', time: '1w' },
]

/** The foot of the chat column: the last chat, then the shelf with its hairline to the edge. */
function Shelf({ initial }: { initial: boolean }) {
  const [open, setOpen] = useState(initial)
  return (
    <div className="w-66 bg-frame">
      <div className="px-2">
        <List label="Chats">
          <StackedRow
            label="CI-cache verkleinen, interne-tools, main, 2d"
            meta={
              <>
                <ProjectMark name="interne-tools" />
                <span className="truncate">interne-tools</span>
              </>
            }
            trailingMeta="2d"
            title="CI-cache verkleinen"
            detail={<StackedRowBranch name="main" />}
            seen
          />
        </List>
      </div>
      <List label="Settled">
        <ShelfGroup text={nl.shelf} title="Settled" count={143} open={open} onOpenChange={setOpen}>
          {settled.map((chat) => (
            <StackedRow
              key={chat.title}
              label={`${chat.title}, ${chat.project}, ${chat.branch}, ${chat.time}`}
              meta={
                <>
                  <ProjectMark name={chat.project} />
                  <span className="truncate">{chat.project}</span>
                </>
              }
              trailingMeta={chat.time}
              title={chat.title}
              detail={<StackedRowBranch name={chat.branch} worktree={chat.branch !== 'main'} />}
              seen
            />
          ))}
        </ShelfGroup>
      </List>
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'ShelfGroup',
  states: {
    // Design 6c: "Afgerond 143" folded at the foot of the list, the chevron pointing down.
    Folded: () => <Shelf initial={false} />,
    // Open, the chevron turned over and the settled chats under it, their titles a step back.
    Open: () => <Shelf initial />,
  },
} satisfies Story
