import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { OrbMark } from './OrbMark'
import { UnreadBadge } from './UnreadBadge'

/** The row of Orb at the top of the side panel of Chats, with its count at the end. */
function Row({ count }: { count: number }): ReactNode {
  return (
    <div className="flex w-[280px] items-center gap-2.5 rounded-md bg-row-active px-2.5 py-2">
      <OrbMark />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] font-semibold text-fg">Orb</span>
        <span className="truncate text-[12px] text-muted">Jesse vraagt je review op #479</span>
      </span>
      <UnreadBadge count={count} label={`${count} ongelezen berichten`} />
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'UnreadBadge',
  states: {
    'In een rij': () => <Row count={1} />,
    'Een groot aantal': () => (
      <div className="flex items-center gap-2">
        <UnreadBadge count={3} label="3 ongelezen berichten" />
        <UnreadBadge count={24} label="24 ongelezen berichten" />
        <UnreadBadge count={120} label="120 ongelezen berichten" />
      </div>
    ),
    'In licht': () => (
      <div data-theme="light" className="w-fit rounded-lg bg-side-panel p-4 text-fg shadow-plane">
        <Row count={2} />
      </div>
    ),
  },
} satisfies Story
