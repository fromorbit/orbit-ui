import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { Tooltip } from '../overlays/Tooltip'
import { IconButton } from '../primitives/IconButton'
import { PanelTabHeader } from './PanelTabHeader'

/** The width of the right panel at its default, so a state looks the way it does there. */
function InPanel({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-[360px] bg-bg">{children}</div>
}

export default {
  group: 'patterns',
  title: 'PanelTabHeader',
  states: {
    // A tab whose head only names it: Subagents.
    'Alleen een titel': () => (
      <InPanel>
        <PanelTabHeader title="2 subagents" />
      </InPanel>
    ),
    // Wijzigingen: what the list holds on the left, its controls on the right.
    'Met acties': () => (
      <InPanel>
        <PanelTabHeader
          title="Dit gesprek"
          actions={
            <>
              <Tooltip label="Meer">
                <IconButton icon="more-horizontal" size="sm" variant="ghost" label="Meer" />
              </Tooltip>
              <Tooltip label="Alles uitklappen">
                <IconButton
                  icon="chevrons-expand"
                  size="sm"
                  variant="ghost"
                  label="Alles uitklappen"
                />
              </Tooltip>
            </>
          }
        />
      </InPanel>
    ),
    // A terminal while its shell runs: the strip keeps its height with nothing in it.
    Leeg: () => (
      <InPanel>
        <PanelTabHeader />
      </InPanel>
    ),
  },
} satisfies Story
