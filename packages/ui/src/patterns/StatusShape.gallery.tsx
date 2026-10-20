import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { StatusShape } from './StatusShape'
import type { RunStatusKind } from './status-kind'

/** Every kind with the word it stands for; a chat that never started keeps an empty slot. */
const kinds: [RunStatusKind | null, string][] = [
  ['running', 'Running'],
  ['attention', 'Waiting for you'],
  ['failed', 'Failed'],
  ['interrupted', 'Interrupted'],
  ['queued', 'Queued'],
  ['done', 'Done'],
  ['closed', 'Closed (after a restart)'],
  [null, 'Never started'],
]

/** Every kind beside its word, plain and — beside it — with a message standing ready. */
function Kinds() {
  return (
    <div className="flex flex-col text-[13px] text-fg">
      {kinds.map(([kind, word]) => (
        <span key={word} className="flex h-7 items-center gap-2">
          <StatusShape kind={kind} />
          <StatusShape kind={kind} pending />
          {word}
        </span>
      ))}
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'StatusShape',
  states: {
    'Every kind beside its word, plain and dotted': () => <Kinds />,
    'Enlarged four times, to judge the drawing': () => (
      // Scaled by a wrapper rather than drawn larger: what shows here is what
      // the sidebar renders, magnified. The top row plain, the bottom row dotted.
      <div className="flex flex-col gap-6">
        {[false, true].map((pending) => (
          <div key={String(pending)} className="flex flex-wrap gap-6">
            {kinds.map(([kind, word]) => (
              <div key={word} className="flex size-14 items-center justify-center">
                <div className="scale-[4]">
                  <StatusShape kind={kind} pending={pending} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
    // With `label` a shape is named by its status word and shows it as a tooltip on hover;
    // the drawing is the same. Waiting for you is an amber outline, only failed is filled.
    'Named by its status word, for a tooltip': () => (
      <TooltipProvider>
        <div className="flex items-center gap-3">
          {kinds
            .filter((entry): entry is [RunStatusKind, string] => entry[0] !== null)
            .map(([kind, word]) => (
              <StatusShape key={word} kind={kind} label={word} />
            ))}
        </div>
      </TooltipProvider>
    ),
  },
} satisfies Story
