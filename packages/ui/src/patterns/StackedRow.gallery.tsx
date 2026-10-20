import { useState } from 'react'
import type { Story } from '../gallery/story'
import { Tooltip, TooltipProvider } from '../overlays/Tooltip'
import { IconButton } from '../primitives/IconButton'
import { ProjectMark } from '../primitives/ProjectMark'
import { List } from './List'
import { StackedRow, StackedRowBranch } from './StackedRow'
import { StatusShape } from './StatusShape'
import type { RunStatusKind } from './status-kind'

/** One chat of the fixture of the chat list; every name in it is made up. */
interface Chat {
  project: string
  time: string
  title: string
  branch: string
  worktree: boolean
  status?: [RunStatusKind, string]
  pinned?: boolean
  pr?: string
  seen?: boolean
}

/** The chats of the chat list, top to bottom. */
const chats: Chat[] = [
  {
    project: 'webshop',
    time: '2m',
    title: 'Zoekfilter herbouwen',
    branch: 'nt/zoekfilter-server',
    worktree: true,
    status: ['running', 'Running'],
  },
  {
    project: 'boekhoud-api',
    time: '8m',
    title: 'Facturen importeren',
    branch: 'nt/import-facturen',
    worktree: true,
    status: ['attention', 'Waiting for you'],
  },
  {
    project: 'interne-tools',
    time: '11m',
    title: 'Slack-meldingen bundelen',
    branch: 'main',
    worktree: false,
    status: ['running', 'Running'],
  },
  {
    project: 'webshop',
    time: '1u',
    title: 'Prijsregels cachen',
    branch: 'nt/prijsregels-cache',
    worktree: true,
    pinned: true,
    pr: '#482',
    seen: true,
  },
  {
    project: 'webshop',
    time: '2u',
    title: 'Checkout-test repareren',
    branch: 'main',
    worktree: false,
    status: ['failed', 'Failed'],
  },
  {
    project: 'docs-site',
    time: 'gisteren',
    title: 'Zoekindex opnieuw bouwen',
    branch: 'nt/zoekindex',
    worktree: true,
    seen: true,
  },
  {
    project: 'interne-tools',
    time: '2d',
    title: 'CI-cache verkleinen',
    branch: 'main',
    worktree: false,
    status: ['queued', 'Queued'],
    seen: true,
  },
]

/** The name a feature would compose for the row: title, project, status, branch, time, pinned. */
function nameOf(chat: Chat): string {
  return [
    chat.title,
    chat.project,
    chat.status?.[1],
    chat.worktree ? `${chat.branch}, worktree` : chat.branch,
    chat.time,
    chat.pinned ? 'pinned' : undefined,
  ]
    .filter(Boolean)
    .join(', ')
}

/** One chat as a row: the project block and name, time, title, branch, status and PR. */
function ChatRow({
  chat,
  current,
  onChoose,
  menu = false,
}: {
  chat: Chat
  current: boolean
  onChoose(): void
  menu?: boolean
}) {
  return (
    <StackedRow
      {...(menu
        ? {
            actions: (
              <Tooltip label="More">
                <IconButton icon="more-horizontal" size="sm" label="More" />
              </Tooltip>
            ),
          }
        : {})}
      label={nameOf(chat)}
      meta={
        <>
          <ProjectMark name={chat.project} />
          <span className="truncate">{chat.project}</span>
        </>
      }
      trailingMeta={chat.time}
      pinned={chat.pinned ?? false}
      title={chat.title}
      status={chat.status ? <StatusShape kind={chat.status[0]} label={chat.status[1]} /> : null}
      detail={<StackedRowBranch name={chat.branch} worktree={chat.worktree} />}
      trailingDetail={
        chat.pr ? <span className="font-mono text-accent-text">{chat.pr}</span> : undefined
      }
      current={current}
      seen={chat.seen ?? false}
      onClick={onChoose}
    />
  )
}

/** The list in the sidebar's column: 264px minus 8px on either side, on the frame. */
function ChatList({
  items,
  width = 'w-62',
  menu = false,
}: {
  items: Chat[]
  width?: 'w-62' | 'w-48'
  menu?: boolean
}) {
  const [chosen, setChosen] = useState(0)
  return (
    <TooltipProvider>
      <div className={`${width} bg-frame p-2`}>
        <List label="Chats">
          {items.map((chat, index) => (
            <ChatRow
              key={chat.title}
              chat={chat}
              current={index === chosen}
              onChoose={() => setChosen(index)}
              menu={menu}
            />
          ))}
        </List>
      </div>
    </TooltipProvider>
  )
}

export default {
  group: 'patterns',
  title: 'StackedRow',
  states: {
    // The column of the sidebar: the first chat chosen (the soft card, no hairline beside it), a busy
    // arc, an amber outline, a pinned chat with its PR, a failure, and seen titles a step back.
    'The chat list of design 6c': () => <ChatList items={chats} />,
    // Unseen (bright), seen (secondary) and chosen (bright on the card), one after the other.
    'Unseen, seen and current': () => (
      <ChatList
        items={[
          { ...(chats[5] as Chat), title: 'Chosen', seen: true },
          { ...(chats[5] as Chat), title: 'Unseen: news since you looked', seen: false },
          { ...(chats[5] as Chat), title: 'Seen: nothing new', seen: true },
        ]}
      />
    ),
    // With a menu per row: `⋯` takes the place of the time under the pointer or the focus, beside
    // the button rather than inside it.
    'With a menu per row': () => <ChatList items={chats.slice(0, 3)} menu />,
    // Everything that could run long loses its tail; the time, the pin and the status stay.
    'Long words in a narrow column': () => (
      <ChatList
        width="w-48"
        items={[
          {
            project: 'een-project-met-een-lange-naam',
            time: 'gisteren',
            title: 'Een titel die veel langer is dan de kolom',
            branch: 'nt/een-branch-met-een-hele-lange-naam',
            worktree: true,
            status: ['attention', 'Waiting for you'],
            pinned: true,
            pr: '#1024',
          },
        ]}
      />
    ),
  },
} satisfies Story
