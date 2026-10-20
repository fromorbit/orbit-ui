import type { Story } from '../gallery/story'
import { Skeleton } from './Skeleton'

export default {
  group: 'primitives',
  title: 'Skeleton',
  states: {
    Widths: () => (
      <div className="flex flex-col gap-2">
        <Skeleton width="sm" />
        <Skeleton width="md" />
        <Skeleton width="lg" />
        <Skeleton width="full" />
      </div>
    ),
    'Row of lines': () => (
      <div className="flex flex-col gap-2">
        <Skeleton width="full" />
        <Skeleton width="full" />
        <Skeleton width="lg" />
      </div>
    ),
    Circle: () => <Skeleton width="sm" shape="circle" />,
  },
} satisfies Story
