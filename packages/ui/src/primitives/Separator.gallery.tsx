import type { Story } from '../gallery/story'
import { Separator } from './Separator'

export default {
  group: 'primitives',
  title: 'Separator',
  states: {
    Horizontal: () => (
      <div className="w-64">
        <p className="m-0 text-[13px] text-fg">Above</p>
        <div className="my-2">
          <Separator />
        </div>
        <p className="m-0 text-[13px] text-fg">Below</p>
      </div>
    ),
    Vertical: () => (
      <div className="flex h-8 items-center gap-2">
        <p className="m-0 text-[13px] text-fg">Left</p>
        <Separator orientation="vertical" />
        <p className="m-0 text-[13px] text-fg">Right</p>
      </div>
    ),
  },
} satisfies Story
