import { type ReactNode, useState } from 'react'
import type { Story } from '../gallery/story'
import { Collapsible } from '../primitives/Collapsible'
import { Icon } from '../primitives/Icon'
import { Rail, RailInset } from './Rail'

/** The column an answer stands in, so the rails are seen where they really are: at its left edge. */
function Answer({ children }: { children: ReactNode }) {
  return <div className="flex w-[520px] flex-col gap-2 text-[13px]">{children}</div>
}

/** The thinking step: no chevron and no glyph, so both of those columns stand open. */
function Thinking() {
  return (
    <Rail>
      <article className="text-muted">
        <RailInset columns={2}>
          <p className="m-0 text-[11px] font-medium">Thinking</p>
          <p className="m-0">I am weighing two ways of doing this before I touch anything.</p>
        </RailInset>
      </article>
    </Rail>
  )
}

/** One line of a run: a glyph, a name, and whatever it was handed. */
function Step({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex h-6 items-center gap-2 font-mono text-[12px]">
      <span className="flex text-muted">
        <Icon name="check" size="sm" />
      </span>
      <span className="shrink-0">{name}</span>
      <span className="min-w-0 truncate text-muted">{detail}</span>
    </div>
  )
}

/** A run of steps, folded or open — the summary sentence sits in the same column as the names. */
function Steps({ start }: { start: boolean }) {
  const [open, setOpen] = useState(start)
  return (
    <Rail>
      <div className="flex flex-col gap-0.5">
        <Collapsible
          open={open}
          onOpenChange={setOpen}
          summary={
            <span className="flex items-center gap-2 text-[12px]">
              <span className="flex text-muted">
                <Icon name="check" size="sm" />
              </span>
              <span className="shrink-0">2 steps</span>
              <span className="min-w-0 truncate font-mono text-muted">read, bash</span>
            </span>
          }
        >
          <RailInset>
            <Step name="read" detail="src/main/index.ts" />
            <Step name="bash" detail="bun run test" />
          </RailInset>
        </Collapsible>
      </div>
    </Rail>
  )
}

/** The same column without a line: a technical event is not the work being done. */
function Technical() {
  return (
    <Rail line="hidden">
      <div className="flex flex-col gap-0.5">
        <RailInset>
          <p className="m-0 text-[11px] text-muted">2 technical events · status, limit</p>
        </RailInset>
      </div>
    </Rail>
  )
}

export default {
  group: 'patterns',
  title: 'Rail',
  states: {
    // The order that showed the bug: a run of steps, a thought, another run. One line, one indent
    // for the first text of each, whether a block is folded or open.
    'Steps, thinking, steps': () => (
      <Answer>
        <p className="m-0">Here is what I did.</p>
        <Steps start={false} />
        <Thinking />
        <Steps start={false} />
      </Answer>
    ),
    'An open run beside a folded one': () => (
      <Answer>
        <Steps start />
        <Thinking />
        <Steps start={false} />
      </Answer>
    ),
    'Without a line, for what is not the work': () => (
      <Answer>
        <Steps start={false} />
        <Technical />
      </Answer>
    ),
  },
} satisfies Story
