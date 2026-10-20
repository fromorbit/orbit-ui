import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { SelectionBar } from './SelectionBar'

/** A few lines of a document with the bar over the second, where a selection would put it. */
function Page({ sendDisabled }: { sendDisabled: string | null }) {
  // The gallery has no provider of its own; the off state carries its reason as a tooltip.
  return (
    <TooltipProvider>
      <div className="relative w-[420px] bg-canvas px-4 pt-12 pb-4 text-[14px] text-fg">
        <p className="m-0">Een klant rekent af met een cadeaubon.</p>
        <p className="m-0 mt-2">Een bon van 2500 op een mand van 4000 laat 1500 te betalen.</p>
        <SelectionBar
          label="Selectie"
          commentLabel="Opmerking"
          sendLabel="Meesturen"
          commentShortcut="document.comment"
          sendShortcut="document.sendSelection"
          at={{ top: 8, left: 16 }}
          sendDisabled={sendDisabled}
          onComment={() => {}}
          onSendAlong={() => {}}
        />
      </div>
    </TooltipProvider>
  )
}

export default {
  group: 'patterns',
  title: 'SelectionBar',
  states: {
    // The same two buttons in Specs and in the tab Bestanden.
    'Beside a selection': () => <Page sendDisabled={null} />,
    'Without a chat to send along to': () => <Page sendDisabled="Geen SDD-chat bij dit document" />,
  },
} satisfies Story
