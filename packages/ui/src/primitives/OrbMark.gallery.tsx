import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { OrbMark } from './OrbMark'

/** The three sizes beside one another, large to small, as the design shows them. */
function Sizes(): ReactNode {
  return (
    <div className="flex items-center gap-4">
      <OrbMark size="lg" />
      <OrbMark />
      <OrbMark size="sm" />
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'OrbMark',
  states: {
    'Drie maten': () => <Sizes />,
    'Naast een naam': () => (
      <span className="flex items-center gap-2 text-[13px] font-medium text-fg">
        <OrbMark size="sm" />
        Orb
      </span>
    ),
    'In licht': () => (
      <div data-theme="light" className="w-fit rounded-lg bg-canvas p-4 text-fg shadow-plane">
        <Sizes />
      </div>
    ),
  },
} satisfies Story
