import type { Story } from '../gallery/story'
import { OrbitWordmark } from './OrbitWordmark'

/** The wordmark at the size of the sidebar head (16px), in the text colour of the dark theme. */
function Dark() {
  return (
    <div className="bg-frame p-4 text-fg">
      <OrbitWordmark className="h-4 w-auto" />
    </div>
  )
}

/**
 * The same on the light palette: the line turns dark with the text, the dot stays orange. The
 * story sets `data-theme="light"` on its own element, as the page "Licht" does.
 */
function Light() {
  return (
    <div data-theme="light" className="bg-frame p-4 text-fg">
      <OrbitWordmark className="h-4 w-auto" />
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'OrbitWordmark',
  states: { Donker: Dark, Licht: Light },
} satisfies Story
