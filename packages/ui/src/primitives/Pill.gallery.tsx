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
    'Model en toegang': () => (
      <div className="flex items-center gap-2">
        <Pill label="Model">Claude Sonnet</Pill>
        <Pill label="Toegang" icon="shield">
          Bewerken
        </Pill>
      </div>
    ),
    // After the first message: the same box without border and plane, and a
    // fact beside it as text in that box.
    Rustig: () => (
      <div className="flex items-center gap-2">
        <Pill label="Model" quiet>
          Claude Sonnet
        </Pill>
        <PillText label="Toegang" icon="shield">
          Bewerken
        </PillText>
      </div>
    ),
    // `aria-expanded` is what a trigger sets while its menu is open; the pill stays lit.
    Open: () => (
      <Pill label="Model" aria-expanded>
        Claude Sonnet
      </Pill>
    ),
    'Lange waarde in een smalle rij': () => (
      <div className="flex w-40 min-w-0">
        <Pill label="Model">Een heel lange modelnaam die niet past</Pill>
      </div>
    ),
    Uitgeschakeld: () => (
      <Pill label="Toegang" icon="shield" disabled>
        Bewerken
      </Pill>
    ),
    // The toolbar of the composer: the round "+", the pills, and on the
    // right the send button with its key. A composition of three primitives, to judge them together.
    'In de werkbalk van de invoer': () => (
      <div className="flex w-full max-w-[560px] items-center gap-2 rounded-lg border border-border-strong bg-composer p-3">
        <IconButton icon="plus" label="Toevoegen" shape="round" outlined />
        <Pill label="Model">Claude Sonnet</Pill>
        <Pill label="Toegang" icon="shield">
          Worktree
        </Pill>
        <span className="flex-1" />
        <Button variant="primary" shortcut="Enter">
          Versturen
        </Button>
      </div>
    ),
  },
} satisfies Story
