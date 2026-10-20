import type { Story } from '../gallery/story'
import { Select } from './Select'

const options = [
  { value: 'a', label: 'Project A' },
  { value: 'b', label: 'Project B' },
]

export default {
  group: 'primitives',
  title: 'Select',
  states: {
    Closed: () => <Select label="Project" value="a" options={options} onValueChange={() => {}} />,
    Sizes: () => (
      <div className="flex items-center gap-2">
        <Select label="Project" value="a" size="sm" options={options} onValueChange={() => {}} />
        <Select label="Project" value="a" options={options} onValueChange={() => {}} />
        <Select label="Project" value="a" size="lg" options={options} onValueChange={() => {}} />
      </div>
    ),
    Disabled: () => (
      <Select label="Project" value="a" options={options} disabled onValueChange={() => {}} />
    ),
  },
} satisfies Story
