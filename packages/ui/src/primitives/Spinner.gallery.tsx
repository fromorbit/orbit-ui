import type { Story } from '../gallery/story'
import { Spinner } from './Spinner'

export default {
  group: 'primitives',
  title: 'Spinner',
  states: {
    Sizes: () => (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-1 text-[12px] text-muted">
          <Spinner size="sm" label="Laden…" />
          <span>sm</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-[12px] text-muted">
          <Spinner size="md" label="Laden…" />
          <span>md</span>
        </div>
      </div>
    ),
    'Custom label': () => <Spinner label="Loading chats" />,
  },
} satisfies Story
