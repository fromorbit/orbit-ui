import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { Tooltip } from '../overlays/Tooltip'
import { IconButton } from '../primitives/IconButton'
import { PanelTabHeader } from './PanelTabHeader'

/** The width of the right panel at its default, so a state looks the way it does there. */
function InPanel({ children }: { children: ReactNode }) {
  return <div className="w-[360px] bg-bg">{children}</div>
}

export default {
  group: 'patterns',
  title: 'PanelTabHeader',
  states: {
    // A tab whose head only names it: Subagents.
    'Title only': () => (
      <InPanel>
        <PanelTabHeader title="2 subagents" />
      </InPanel>
    ),
    // Wijzigingen: what the list holds on the left, its controls on the right.
    'With actions': () => (
      <InPanel>
        <PanelTabHeader
          title="Deze chat"
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
    Empty: () => (
      <InPanel>
        <PanelTabHeader />
      </InPanel>
    ),
  },
} satisfies Story
