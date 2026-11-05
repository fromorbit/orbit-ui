import type { Story } from '../gallery/story'
import { Switch } from './Switch'

export default {
  group: 'primitives',
  title: 'Switch',
  states: {
    Aan: () => <Switch label="Network access" checked onCheckedChange={() => {}} />,
    Uit: () => <Switch label="Network access" checked={false} onCheckedChange={() => {}} />,
    Uitgeschakeld: () => (
      <Switch label="Network access" checked={false} disabled onCheckedChange={() => {}} />
    ),
    // Disabled keeps the colour of its state, on the lower opacity of every control (A52).
    'Uitgeschakeld, aan': () => (
      <Switch label="Network access" checked disabled onCheckedChange={() => {}} />
    ),
  },
} satisfies Story
