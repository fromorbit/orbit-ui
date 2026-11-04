import type { Story } from '../gallery/story'
import { ProgressBar } from './ProgressBar'

export default {
  group: 'primitives',
  title: 'ProgressBar',
  states: {
    Onderweg: () => (
      <div className="w-full max-w-72">
        <ProgressBar label="Uploaden" value={64} />
      </div>
    ),
    Gedeeltelijk: () => (
      <div className="w-full max-w-72">
        <ProgressBar label="Image bouwen" />
      </div>
    ),
    Klaar: () => (
      <div className="w-full max-w-72">
        <ProgressBar label="Kopiëren" value={100} />
      </div>
    ),
  },
} satisfies Story
