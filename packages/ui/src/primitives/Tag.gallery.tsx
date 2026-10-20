import type { Story } from '../gallery/story'
import { Tag } from './Tag'

export default {
  group: 'primitives',
  title: 'Tag',
  states: {
    Tones: () => (
      <div className="flex gap-2">
        <Tag>Draft</Tag>
        <Tag tone="success" icon="check-circle">
          Ready
        </Tag>
        <Tag tone="attention">Pending</Tag>
        <Tag tone="danger" icon="alert-triangle">
          Failed
        </Tag>
      </div>
    ),
    Mono: () => <Tag mono>a1b2c3</Tag>,
  },
} satisfies Story
