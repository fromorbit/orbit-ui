import type { Story } from '../gallery/story'
import { Icon } from '../primitives/Icon'
import { Shimmer } from './Shimmer'

export default {
  group: 'patterns',
  title: 'Shimmer',
  states: {
    Rustig: () => (
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <Shimmer active={false}>Wacht op zijn beurt</Shimmer>
      </div>
    ),
    Bezig: () => (
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <Shimmer active={true}>Een heel lange verzonnen wijzigingslijst ophalen</Shimmer>
      </div>
    ),
    'Bezig over een icoon': () => (
      // The band also has to read over a shape, not only over letters — the reason background
      // clipped text was rejected. A glyph of the registry, as every icon in the app.
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <Shimmer active={true}>
          <span className="flex items-center gap-2">
            <Icon name="file-text" size="sm" />
            Drie verzonnen bestanden lezen
          </span>
        </Shimmer>
      </div>
    ),
  },
} satisfies Story
