import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { ChoiceCard } from './ChoiceCard'

function Plain() {
  return (
    <div className="w-full max-w-80">
      <ChoiceCard icon="file-diff" title="Wijzigingen" />
    </div>
  )
}

function WithKey() {
  return (
    <div className="w-full max-w-80">
      <ChoiceCard icon="globe" title="Browser" shortcut="panel.start.browser" />
    </div>
  )
}

function Dimmed() {
  return (
    <TooltipProvider>
      <div className="w-full max-w-80">
        <ChoiceCard
          icon="terminal"
          title="Terminal"
          shortcut="panel.start.terminal"
          disabled
          reason="Komt later"
        />
      </div>
    </TooltipProvider>
  )
}

export default {
  group: 'patterns',
  title: 'ChoiceCard',
  states: {
    Eenvoudig: Plain,
    'Met een toets': WithKey,
    Gedimd: Dimmed,
  },
} satisfies Story
