import type { Story } from '../gallery/story'
import { Input } from './Input'

export default {
  group: 'primitives',
  title: 'Input',
  states: {
    Empty: () => <Input label="Search" placeholder="Search…" />,
    Filled: () => <Input label="Search" defaultValue="agent orchestration" />,
    'With icon': () => <Input label="Search" icon="search" defaultValue="agent" />,
    Sizes: () => (
      <div className="flex items-center gap-2">
        <Input label="Small" size="sm" placeholder="Small" />
        <Input label="Medium" placeholder="Medium" />
        <Input label="Large" size="lg" placeholder="Large" />
      </div>
    ),
    Disabled: () => <Input label="Search" disabled defaultValue="agent" />,
    // Last, so the states above keep their reference images.
    'With icon and a cross to clear': () => (
      <Input label="Search" icon="search" clearLabel="Wissen" defaultValue="network" />
    ),
  },
} satisfies Story
