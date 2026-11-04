import type { Story } from '../gallery/story'
import { Tag } from './Tag'

export default {
  group: 'primitives',
  title: 'Tag',
  states: {
    Tonen: () => (
      <div className="flex flex-wrap gap-2">
        <Tag>Concept</Tag>
        <Tag tone="success" icon="check-circle">
          Klaar
        </Tag>
        <Tag tone="attention">Wacht</Tag>
        <Tag tone="danger" icon="alert-triangle">
          Mislukt
        </Tag>
      </div>
    ),
    Mono: () => <Tag mono>a1b2c3</Tag>,
  },
} satisfies Story
