import type { Story } from '../gallery/story'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import { Timeline, TimelineItem } from './Timeline'

export default {
  group: 'primitives',
  title: 'Timeline',
  states: {
    Activity: () => (
      <div className="w-[28rem]">
        <Timeline label="Activiteit">
          <TimelineItem marker={<Icon name="plus" size="sm" />} time="3 d">
            Noor de Vries maakte de spec
          </TimelineItem>
          <TimelineItem marker={<Icon name="git-branch" size="sm" />} time="1 d">
            Een agent begon op feat/restant-tonen
          </TimelineItem>
          <TimelineItem marker={<Icon name="check" size="sm" />} time="5 u">
            Alle criteria slagen
          </TimelineItem>
          <TimelineItem marker={<Avatar name="Sem Jansen" size="sm" />} time="2 u">
            <span className="flex w-full flex-col gap-1 rounded-lg bg-surface px-3 py-2">
              <span className="font-medium text-fg">Sem Jansen</span>
              <span className="text-fg">
                Moet het restant ook in het account van de klant staan?
              </span>
            </span>
          </TimelineItem>
        </Timeline>
      </div>
    ),
  },
} satisfies Story
