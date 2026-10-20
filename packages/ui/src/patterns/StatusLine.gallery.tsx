import { type ReactNode, useState } from 'react'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { StatusLine } from './StatusLine'

/** The width of the pane a status line sits under, so `meta` has a right edge to sit against. */
function Pane({ children }: { children: ReactNode }) {
  return <div className="w-96">{children}</div>
}

/** The three stages of saving, in the order the settings pane runs through them. */
const stages = [
  { tone: 'muted', busy: true, text: 'Saving…' },
  { tone: 'success', busy: false, text: 'Saved' },
  { tone: 'danger', busy: false, text: 'Could not save' },
] as const

/**
 * Saving, saved, failed — one mounted `StatusLine` whose children change.
 *
 * The point of the state: a screen reader announces a live region only when it was already in the
 * document before its text changed, so the pattern is used this way, not mounted per message. The
 * role stays `status` through all three stages, the failure included — only the words, the glyph
 * and the colour change, never the element's role.
 */
function Changing() {
  const [step, setStep] = useState(0)
  const stage = stages[step % stages.length] ?? stages[0]
  return (
    <Pane>
      <div className="flex items-center gap-3">
        <Button size="sm" variant="secondary" onClick={() => setStep(step + 1)}>
          Next stage
        </Button>
        <StatusLine tone={stage.tone} busy={stage.busy}>
          {stage.text}
        </StatusLine>
      </div>
    </Pane>
  )
}

export default {
  group: 'patterns',
  title: 'StatusLine',
  states: {
    Muted: () => (
      <Pane>
        <StatusLine>Ready</StatusLine>
      </Pane>
    ),
    Busy: () => (
      <Pane>
        <StatusLine busy>Saving…</StatusLine>
      </Pane>
    ),
    Success: () => (
      <Pane>
        <StatusLine tone="success">Saved</StatusLine>
      </Pane>
    ),
    Danger: () => (
      <Pane>
        <StatusLine tone="danger">Could not save</StatusLine>
      </Pane>
    ),
    'Busy with meta (above the composer)': () => (
      <Pane>
        <StatusLine busy meta="3,4k tokens">
          Working · reading translate.ts
        </StatusLine>
      </Pane>
    ),
    'Changing (the element stays mounted)': Changing,
  },
} satisfies Story
