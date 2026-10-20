import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { ChoiceCard } from './ChoiceCard'

function Plain() {
  return (
    <div className="w-80">
      <ChoiceCard icon="file-diff" title="Changes" />
    </div>
  )
}

function WithKey() {
  return (
    <div className="w-80">
      <ChoiceCard icon="globe" title="Browser" shortcut="panel.start.browser" />
    </div>
  )
}

function Dimmed() {
  return (
    <TooltipProvider>
      <div className="w-80">
        <ChoiceCard
          icon="terminal"
          title="Terminal"
          shortcut="panel.start.terminal"
          disabled
          reason="Coming later"
        />
      </div>
    </TooltipProvider>
  )
}

export default {
  group: 'patterns',
  title: 'ChoiceCard',
  states: {
    Plain,
    'With a key': WithKey,
    Dimmed,
  },
} satisfies Story
