import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { literalShortcuts, UiProvider } from '../provider/UiProvider'
import { SearchFieldButton } from './SearchFieldButton'

/** The middle of a top bar on the frame: the field as wide as the bar gives it, up to 460px. */
function Bar({ children }: { children: ReactNode }) {
  return (
    <UiProvider shortcuts={literalShortcuts}>
      <div className="flex h-12 w-[560px] max-w-full items-center justify-center rounded-lg bg-frame px-4">
        <div className="flex w-full max-w-115 min-w-0">{children}</div>
      </div>
    </UiProvider>
  )
}

/**
 * The button in the shape of a search field in the top bar: at rest with its key, in a narrow
 * bar where the words lose their tail before the key, and on Paper.
 */
export default {
  group: 'primitives',
  title: 'SearchFieldButton',
  states: {
    'In de topbalk': () => (
      <Bar>
        <SearchFieldButton placeholder="Zoek of spring naar…" shortcut="⌘K" />
      </Bar>
    ),
    Smal: () => (
      <UiProvider shortcuts={literalShortcuts}>
        <div className="flex w-44 rounded-lg bg-frame p-2">
          <SearchFieldButton placeholder="Zoek of spring naar…" shortcut="⌘K" />
        </div>
      </UiProvider>
    ),
    'Op Papier': () => (
      <div data-theme="light" className="w-fit rounded-lg bg-canvas p-4 text-fg shadow-plane">
        <Bar>
          <SearchFieldButton placeholder="Zoek of spring naar…" shortcut="⌘K" />
        </Bar>
      </div>
    ),
  },
} satisfies Story
