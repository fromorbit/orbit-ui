import type { Story } from '../gallery/story'
import { TrendBadge } from './TrendBadge'

export default {
  group: 'primitives',
  title: 'TrendBadge',
  states: {
    'Up, good': () => (
      <TrendBadge value="12%" direction="up" tone="good" description="12% gestegen" />
    ),
    'Down, good': () => (
      <TrendBadge value="8" direction="down" tone="good" description="8 minder mislukte builds" />
    ),
    'Up, bad': () => (
      <TrendBadge value="€ 240" direction="up" tone="bad" description="€ 240 meer kosten" />
    ),
    Flat: () => (
      <TrendBadge value="0%" direction="flat" tone="neutral" description="Gelijk gebleven" />
    ),
  },
} satisfies Story
