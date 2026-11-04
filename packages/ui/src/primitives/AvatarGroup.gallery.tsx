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
    'Met een aantal': () => <AvatarGroup names={TEAM} label="6 leden" />,
    'Alles past': () => <AvatarGroup names={TEAM.slice(0, 3)} label="3 leden" />,
    Klein: () => <AvatarGroup names={TEAM} label="6 leden" size="sm" max={3} />,
    'Op een kaart': () => (
      <div className="rounded-lg bg-overlay p-3">
        <AvatarGroup names={TEAM} label="6 leden" on="overlay" />
      </div>
    ),
  },
} satisfies Story
