import type { Story } from '../gallery/story'
import { Skeleton } from './Skeleton'

export default {
  group: 'primitives',
  title: 'Skeleton',
  states: {
    Breedtes: () => (
      <div className="flex flex-col gap-2">
        <Skeleton width="sm" />
        <Skeleton width="md" />
        <Skeleton width="lg" />
        <Skeleton width="full" />
      </div>
    ),
    'Rij regels': () => (
      <div className="flex flex-col gap-2">
        <Skeleton width="full" />
        <Skeleton width="full" />
        <Skeleton width="lg" />
      </div>
    ),
    Cirkel: () => <Skeleton width="sm" shape="circle" />,
  },
} satisfies Story
