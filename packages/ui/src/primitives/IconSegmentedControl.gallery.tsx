import type { Story } from '../gallery/story'
import { IconSegmentedControl } from './IconSegmentedControl'

const options = [
  { value: 'stacked', icon: 'rows', label: 'Stacked' },
  { value: 'split', icon: 'columns', label: 'Split' },
] as const

export default {
  group: 'primitives',
  title: 'IconSegmentedControl',
  states: {
    States: () => (
      <IconSegmentedControl
        label="Diff layout"
        value="stacked"
        options={options}
        onValueChange={() => {}}
      />
    ),
    Sizes: () => (
      <div className="flex items-center gap-2">
        <IconSegmentedControl
          label="Diff layout"
          value="stacked"
          options={options}
          size="sm"
          onValueChange={() => {}}
        />
        <IconSegmentedControl
          label="Diff layout"
          value="stacked"
          options={options}
          size="md"
          onValueChange={() => {}}
        />
        <IconSegmentedControl
          label="Diff layout"
          value="stacked"
          options={options}
          size="lg"
          onValueChange={() => {}}
        />
      </div>
    ),
    Disabled: () => (
      <IconSegmentedControl
        label="Diff layout"
        value="stacked"
        options={options}
        disabled
        onValueChange={() => {}}
      />
    ),
  },
} satisfies Story
