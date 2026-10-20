import type { Story } from '../gallery/story'
import { CiteRow } from './CiteRow'

const jump = () => {}

export default {
  group: 'primitives',
  title: 'CiteRow',
  states: {
    Rows: () => (
      <div className="flex w-[400px] flex-col">
        <CiteRow icon="check" tone="success" label="Gift cards sit beside cash" onJump={jump} />
        <CiteRow
          icon="alert-triangle"
          tone="attention"
          label="Goal is missing"
          description="Why this is needed is written nowhere"
        />
        <CiteRow
          icon="check-circle"
          label="A card of 25 on a basket of 40 leaves 15 to pay, and a wrong code is refused"
          description="14 criteria"
          onJump={jump}
        />
      </div>
    ),
    Framed: () => (
      <div className="flex w-[400px] flex-col gap-1.5">
        <CiteRow
          framed
          label="A card is valid for a year"
          description="Otherwise: valid forever"
          tag="High impact"
          onJump={jump}
        />
        <CiteRow framed label="You log in yourself" description="Otherwise: in the app" />
      </div>
    ),
  },
} satisfies Story
