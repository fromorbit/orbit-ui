import type { Story } from '../gallery/story'
import { IconSegmentedControl } from './IconSegmentedControl'

const options = [
  { value: 'stacked', icon: 'rows', label: 'Onder elkaar' },
  { value: 'split', icon: 'columns', label: 'Naast elkaar' },
] as const

export default {
  group: 'primitives',
  title: 'IconSegmentedControl',
  states: {
    Staten: () => (
      <IconSegmentedControl
        label="Weergave van het verschil"
        value="stacked"
        options={options}
        onValueChange={() => {}}
      />
    ),
    Maten: () => (
      <div className="flex items-center gap-2">
        <IconSegmentedControl
          label="Weergave van het verschil"
          value="stacked"
          options={options}
          size="sm"
          onValueChange={() => {}}
        />
        <IconSegmentedControl
          label="Weergave van het verschil"
          value="stacked"
          options={options}
          size="md"
          onValueChange={() => {}}
        />
        <IconSegmentedControl
          label="Weergave van het verschil"
          value="stacked"
          options={options}
          size="lg"
          onValueChange={() => {}}
        />
      </div>
    ),
    Uitgeschakeld: () => (
      <IconSegmentedControl
        label="Weergave van het verschil"
        value="stacked"
        options={options}
        disabled
        onValueChange={() => {}}
      />
    ),
  },
} satisfies Story
