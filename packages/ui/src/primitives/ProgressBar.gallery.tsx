import type { Story } from '../gallery/story'
import { ProgressBar } from './ProgressBar'

export default {
  group: 'primitives',
  title: 'ProgressBar',
  states: {
    'Under way': () => (
      <div className="w-72">
        <ProgressBar label="Uploaden" value={64} />
      </div>
    ),
    Indeterminate: () => (
      <div className="w-72">
        <ProgressBar label="Image bouwen" />
      </div>
    ),
    Done: () => (
      <div className="w-72">
        <ProgressBar label="Kopiëren" value={100} />
      </div>
    ),
  },
} satisfies Story
