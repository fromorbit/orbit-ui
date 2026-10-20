import type { Story } from '../gallery/story'
import { Icon } from '../primitives/Icon'
import { Shimmer } from './Shimmer'

export default {
  group: 'patterns',
  title: 'Shimmer',
  states: {
    Quiet: () => (
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <Shimmer active={false}>Waiting for its turn</Shimmer>
      </div>
    ),
    Running: () => (
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <Shimmer active={true}>Fetching a very long imaginary changelog</Shimmer>
      </div>
    ),
    'Running over an icon': () => (
      // The band also has to read over a shape, not only over letters — the reason background
      // clipped text was rejected. A glyph of the registry, as every icon in the app.
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <Shimmer active={true}>
          <span className="flex items-center gap-2">
            <Icon name="file-text" size="sm" />
            Reading three imaginary files
          </span>
        </Shimmer>
      </div>
    ),
  },
} satisfies Story
