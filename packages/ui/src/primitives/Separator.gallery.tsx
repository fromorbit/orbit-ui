import type { Story } from '../gallery/story'
import { Separator } from './Separator'

export default {
  group: 'primitives',
  title: 'Separator',
  states: {
    Horizontaal: () => (
      <div className="w-64">
        <p className="m-0 text-[13px] text-fg">Boven</p>
        <div className="my-2">
          <Separator />
        </div>
        <p className="m-0 text-[13px] text-fg">Onder</p>
      </div>
    ),
    Verticaal: () => (
      <div className="flex h-8 items-center gap-2">
        <p className="m-0 text-[13px] text-fg">Links</p>
        <Separator orientation="vertical" />
        <p className="m-0 text-[13px] text-fg">Rechts</p>
      </div>
    ),
  },
} satisfies Story
