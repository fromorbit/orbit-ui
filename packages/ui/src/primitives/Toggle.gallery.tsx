import type { Story } from '../gallery/story'
import { Toggle } from './Toggle'

export default {
  group: 'primitives',
  title: 'Toggle',
  states: {
    Staten: () => (
      <div className="flex gap-2">
        <Toggle icon="wrap-text" label="Uit" pressed={false} onPressedChange={() => {}} />
        <Toggle icon="wrap-text" label="Aan" pressed onPressedChange={() => {}} />
      </div>
    ),
    Maten: () => (
      <div className="flex items-center gap-2">
        <Toggle icon="wrap-text" label="Klein" pressed size="sm" onPressedChange={() => {}} />
        <Toggle icon="wrap-text" label="Middel" pressed size="md" onPressedChange={() => {}} />
        <Toggle icon="wrap-text" label="Groot" pressed size="lg" onPressedChange={() => {}} />
      </div>
    ),
    Uitgeschakeld: () => (
      <div className="flex gap-2">
        <Toggle icon="wrap-text" label="Uit" pressed={false} disabled onPressedChange={() => {}} />
        <Toggle icon="wrap-text" label="Aan" pressed disabled onPressedChange={() => {}} />
      </div>
    ),
  },
} satisfies Story
