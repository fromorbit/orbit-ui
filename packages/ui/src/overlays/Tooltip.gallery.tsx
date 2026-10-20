import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { IconButton } from '../primitives/IconButton'
import { Tooltip, TooltipProvider } from './Tooltip'

/**
 * Room above and beside the trigger for the tooltip that opens on top of it.
 *
 * `Tooltip` has no story of its own to hover or focus, so every state opens with `defaultOpen`
 * instead — the still image the screenshot needs. `pt-10` is the air `side="top"` requires so the
 * panel does not get clipped by the stage's own edge.
 *
 * The fixed width is the other half of that: the tooltip is portalled, so it adds nothing to the
 * width the story shrink-wraps to, and a reference of the state's own box would have recorded the
 * longest label sliced off at both edges. 480px holds the widest one whole, centred on its trigger.
 */
function Stage({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex w-[480px] justify-center pt-10">{children}</div>
    </TooltipProvider>
  )
}

function Default() {
  return (
    <Stage>
      <Tooltip label="Verwijder bericht" defaultOpen>
        <IconButton icon="x" label="Verwijder bericht" />
      </Tooltip>
    </Stage>
  )
}

function WithAShortcut() {
  return (
    <Stage>
      <Tooltip label="Rechterpaneel" shortcut="⌘⌥B" defaultOpen>
        <IconButton icon="x" label="Rechterpaneel" />
      </Tooltip>
    </Stage>
  )
}

function OnALongLabel() {
  return (
    <Stage>
      <Tooltip
        label="Sluit dit paneel en onthoud dat het dicht stond bij de volgende start"
        defaultOpen
      >
        <IconButton icon="x" label="Sluit paneel" />
      </Tooltip>
    </Stage>
  )
}

export default {
  group: 'overlays',
  title: 'Tooltip',
  states: {
    Default,
    'With a shortcut': WithAShortcut,
    'On a long label': OnALongLabel,
  },
} satisfies Story
