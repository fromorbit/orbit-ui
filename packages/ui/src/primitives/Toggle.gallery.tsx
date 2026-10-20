import type { Story } from '../gallery/story'
import { Toggle } from './Toggle'

export default {
  group: 'primitives',
  title: 'Toggle',
  states: {
    States: () => (
      <div className="flex gap-2">
        <Toggle icon="wrap-text" label="Off" pressed={false} onPressedChange={() => {}} />
        <Toggle icon="wrap-text" label="On" pressed onPressedChange={() => {}} />
      </div>
    ),
    Sizes: () => (
      <div className="flex items-center gap-2">
        <Toggle icon="wrap-text" label="Small" pressed size="sm" onPressedChange={() => {}} />
        <Toggle icon="wrap-text" label="Medium" pressed size="md" onPressedChange={() => {}} />
        <Toggle icon="wrap-text" label="Large" pressed size="lg" onPressedChange={() => {}} />
      </div>
    ),
    Disabled: () => (
      <div className="flex gap-2">
        <Toggle icon="wrap-text" label="Off" pressed={false} disabled onPressedChange={() => {}} />
        <Toggle icon="wrap-text" label="On" pressed disabled onPressedChange={() => {}} />
      </div>
    ),
  },
} satisfies Story
