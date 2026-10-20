import type { Story } from '../gallery/story'
import { Icon, iconNames } from './Icon'

export default {
  group: 'primitives',
  title: 'Icon',
  states: {
    Icons: () => (
      // Wrapping, and capped: the registry grows, and one endless row would push the gallery's
      // stage wider than the window — which axe reports, rightly, as a scrollable region no
      // keyboard can reach. 1008px is the width this row had while it still fitted on one line, so
      // the story keeps its own size and the other two states of it keep their reference images.
      <div className="flex max-w-[1008px] flex-wrap gap-4">
        {iconNames.map((name) => (
          <div key={name} className="flex flex-col items-center gap-1 text-[12px] text-muted">
            <Icon name={name} />
            <span>{name}</span>
          </div>
        ))}
      </div>
    ),
    Tones: () => (
      // A tone never stands alone: what turns red also changes shape, and the word that goes with
      // it lives wherever the caller keeps its accessible name.
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-1 text-[12px] text-muted">
          <Icon name="alert-triangle" />
          <span>default</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-[12px] text-muted">
          <Icon name="alert-triangle" tone="danger" />
          <span>danger</span>
        </div>
      </div>
    ),
    Sizes: () => (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-1 text-[12px] text-muted">
          <Icon name="chevron-down" size="xs" />
          <span>xs</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-[12px] text-muted">
          <Icon name="search" size="sm" />
          <span>sm</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-[12px] text-muted">
          <Icon name="search" size="md" />
          <span>md</span>
        </div>
      </div>
    ),
  },
} satisfies Story
