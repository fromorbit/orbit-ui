import type { Story } from '../gallery/story'
import { AvatarGroup } from './AvatarGroup'

const TEAM = [
  'Noor de Vries',
  'Sem Jansen',
  'Lotte Bakker',
  'Daan Visser',
  'Eva Smit',
  'Finn de Boer',
]

export default {
  group: 'primitives',
  title: 'AvatarGroup',
  states: {
    'With a count': () => <AvatarGroup names={TEAM} label="6 leden" />,
    'All fit': () => <AvatarGroup names={TEAM.slice(0, 3)} label="3 leden" />,
    Small: () => <AvatarGroup names={TEAM} label="6 leden" size="sm" max={3} />,
    'On a card': () => (
      <div className="rounded-lg border border-border bg-overlay p-3">
        <AvatarGroup names={TEAM} label="6 leden" on="overlay" />
      </div>
    ),
  },
} satisfies Story
