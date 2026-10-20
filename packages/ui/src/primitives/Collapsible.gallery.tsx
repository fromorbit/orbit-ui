import { type ReactNode, useState } from 'react'
import type { Story } from '../gallery/story'
import { Collapsible } from './Collapsible'
import { Icon } from './Icon'

/** The width of the column a summary stands in, so a long one has an edge to be cut off at. */
function Pane({ children }: { children: ReactNode }) {
  return <div className="w-96">{children}</div>
}

/** The muted tick a finished row carries, inline before the sentence it belongs to. */
function Tick() {
  return (
    <span className="mr-2 inline-flex align-text-bottom text-muted">
      <Icon name="check" size="sm" />
    </span>
  )
}

/** The rows under a summary, indented by the chevron's slot so their glyphs form one column. */
function Rows({ names }: { names: string[] }) {
  return (
    <div className="flex gap-2">
      <span className="size-(--nt-icon-sm) shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {names.map((name) => (
          <div key={name} className="flex h-6 items-center gap-2 font-mono text-[12px]">
            <span className="flex text-muted">
              <Icon name="check" size="sm" />
            </span>
            <span className="text-fg">{name}</span>
            <span className="min-w-0 truncate text-muted">src/renderer/src/App.tsx</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** One collapsible whose state the caller keeps, which is the only way this component works. */
function Example({
  initial,
  summary,
  names = ['read', 'bash', 'grep'],
  chevron = true,
}: {
  initial: boolean
  summary: ReactNode
  names?: string[]
  chevron?: boolean
}) {
  const [open, setOpen] = useState(initial)
  return (
    <Pane>
      <Collapsible summary={summary} chevron={chevron} open={open} onOpenChange={setOpen}>
        <Rows names={names} />
      </Collapsible>
    </Pane>
  )
}

/**
 * The summary the timeline really renders: a glyph, the count, a middle dot and the names.
 *
 * The dot is punctuation, so it is hidden from assistive technology and takes the faint colour of
 * the names beside it; the room around it matches the row gap the feature uses (8px).
 *
 * Inline content rather than the feature's flex row, and deliberately so: the `A long summary
 * truncates` state is about the ellipsis `Collapsible` itself puts at the end of a row, and a flex
 * row would truncate inside its own names cell before that wrapper ever ran out of space.
 */
function Summary({ count, names }: { count: string; names: string }) {
  return (
    <>
      <Tick />
      {count}
      <span aria-hidden="true" className="px-2 text-muted">
        ·
      </span>
      <span className="font-mono text-muted">{names}</span>
    </>
  )
}

const short = <Summary count="6 steps" names="read, bash ×5" />

const long = <Summary count="12 steps" names="read ×4, bash ×3, grep, edit ×2, write, todo_write" />

export default {
  group: 'primitives',
  title: 'Collapsible',
  states: {
    Closed: () => <Example initial={false} summary={short} />,
    Open: () => <Example initial summary={short} />,
    'A long summary truncates': () => <Example initial={false} summary={long} />,
    // The other half of the contract: nothing to fold yet, so no trigger and the row simply
    // stands there. A single technical event in the timeline is this shape, and it stayed
    // invisible in the gallery as long as the story only showed summaries.
    'No summary': () => <Example initial summary={null} names={['read']} />,
    // The quiet lines of the timeline: the summary carries its own glyph and is the button on its
    // own, so the chevron is left out.
    'Without a chevron': () => <Example initial={false} summary={short} chevron={false} />,
  },
} satisfies Story
