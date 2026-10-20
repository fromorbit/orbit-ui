import type { Story } from '../gallery/story'
import { Switch } from './Switch'

export default {
  group: 'primitives',
  title: 'Switch',
  states: {
    On: () => <Switch label="Network access" checked onCheckedChange={() => {}} />,
    Off: () => <Switch label="Network access" checked={false} onCheckedChange={() => {}} />,
    Disabled: () => (
      <Switch label="Network access" checked={false} disabled onCheckedChange={() => {}} />
    ),
    // Disabled keeps the colour of its state, on the lower opacity of every control (A52).
    'Disabled, on': () => (
      <Switch label="Network access" checked disabled onCheckedChange={() => {}} />
    ),
  },
} satisfies Story
