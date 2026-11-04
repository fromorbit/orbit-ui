import type { Story } from '../gallery/story'
import { TrendBadge } from './TrendBadge'

export default {
  group: 'primitives',
  title: 'TrendBadge',
  states: {
    'Omhoog, goed': () => (
      <TrendBadge value="12%" direction="up" tone="good" description="12% gestegen" />
    ),
    'Omlaag, goed': () => (
      <TrendBadge value="8" direction="down" tone="good" description="8 minder mislukte builds" />
    ),
    'Omhoog, slecht': () => (
      <TrendBadge value="€ 240" direction="up" tone="bad" description="€ 240 meer kosten" />
    ),
    Gelijk: () => (
      <TrendBadge value="0%" direction="flat" tone="neutral" description="Gelijk gebleven" />
    ),
  },
} satisfies Story
