import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { Button } from './Button'
import { TeamMark } from './TeamMark'

/** Made-up teams. */
const teams = ['Studio Noord', 'Sterrenwacht', 'Kade 12']

/** The team in the top bar: a quiet button with the mark and the name. */
function InTopBar(): ReactNode {
  return (
    <div className="flex h-12 w-fit items-center gap-2 rounded-lg bg-frame px-3">
      <Button variant="quiet" size="sm">
        <TeamMark name="Studio Noord" />
        Studio Noord
      </Button>
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'TeamMark',
  states: {
    'In de topbalk': () => <InTopBar />,
    'Naast de naam': () => (
      <div className="flex flex-col gap-2 text-[13px] text-fg">
        {teams.map((team) => (
          <span key={team} className="flex items-center gap-2">
            <TeamMark name={team} />
            {team}
          </span>
        ))}
      </div>
    ),
    'Op Papier': () => (
      <div data-theme="light" className="w-fit rounded-lg bg-canvas p-4 text-fg shadow-plane">
        <InTopBar />
      </div>
    ),
  },
} satisfies Story
