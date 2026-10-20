import type { Story } from '../gallery/story'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { Pill, PillText } from './Pill'

export default {
  group: 'primitives',
  title: 'Pill',
  states: {
    // The two pills of the composer: the model by its name alone, the access level with its shield.
    // The composer's model pill adds the mark of the agent as a `glyph`; see the story
    // of the model menu.
    'Model and access': () => (
      <div className="flex items-center gap-2">
        <Pill label="Model">Claude Sonnet</Pill>
        <Pill label="Access" icon="shield">
          Edits
        </Pill>
      </div>
    ),
    // After the first message: the same box without border and plane, and a
    // fact beside it as text in that box.
    Quiet: () => (
      <div className="flex items-center gap-2">
        <Pill label="Model" quiet>
          Claude Sonnet
        </Pill>
        <PillText label="Access" icon="shield">
          Edits
        </PillText>
      </div>
    ),
    // `aria-expanded` is what a trigger sets while its menu is open; the pill stays lit.
    Open: () => (
      <Pill label="Model" aria-expanded>
        Claude Sonnet
      </Pill>
    ),
    'Long value in a narrow row': () => (
      <div className="flex w-40 min-w-0">
        <Pill label="Model">A very long name of a model that does not fit</Pill>
      </div>
    ),
    Disabled: () => (
      <Pill label="Access" icon="shield" disabled>
        Edits
      </Pill>
    ),
    // The toolbar of the composer: the round "+", the pills, and on the
    // right the send button with its key. A composition of three primitives, to judge them together.
    'In the toolbar of the composer': () => (
      <div className="flex w-[560px] items-center gap-2 rounded-lg border border-border-strong bg-composer p-3">
        <IconButton icon="plus" label="Add" shape="round" outlined />
        <Pill label="Model">Claude Sonnet</Pill>
        <Pill label="Access" icon="shield">
          Worktree
        </Pill>
        <span className="flex-1" />
        <Button variant="primary" shortcut="Enter">
          Send
        </Button>
      </div>
    ),
  },
} satisfies Story
