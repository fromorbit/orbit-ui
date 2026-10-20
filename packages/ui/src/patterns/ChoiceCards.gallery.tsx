import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { type ChoiceCardItem, ChoiceCards } from './ChoiceCards'

/** The kinds of an empty panel: five cards, two of them not available yet. */
const KINDS: readonly ChoiceCardItem[] = [
  { id: 'changes', icon: 'file-diff', title: 'Changes', shortcut: 'panel.start.changes' },
  { id: 'browser', icon: 'globe', title: 'Browser', shortcut: 'panel.start.browser' },
  { id: 'subagents', icon: 'bot', title: 'Subagents', shortcut: 'panel.start.subagents' },
  {
    id: 'terminal',
    icon: 'terminal',
    title: 'Terminal',
    shortcut: 'panel.start.terminal',
    disabled: true,
    reason: 'Coming later',
  },
  {
    id: 'files',
    icon: 'folder',
    title: 'Files',
    shortcut: 'panel.start.files',
    disabled: true,
    reason: 'Coming later',
  },
]

function InPanel({ width }: { width: number }) {
  return (
    <TooltipProvider>
      <div className="px-3" style={{ width }}>
        <ChoiceCards label="Open a tab" items={KINDS} onChoose={() => {}} />
      </div>
    </TooltipProvider>
  )
}

export default {
  group: 'patterns',
  title: 'ChoiceCards',
  states: {
    'Narrow panel': () => <InPanel width={320} />,
    'Wide panel': () => <InPanel width={480} />,
  },
} satisfies Story
