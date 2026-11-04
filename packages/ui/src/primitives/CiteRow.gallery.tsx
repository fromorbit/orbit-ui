import type { Story } from '../gallery/story'
import { CiteRow } from './CiteRow'

const jump = () => {}

export default {
  group: 'primitives',
  title: 'CiteRow',
  states: {
    Rows: () => (
      <div className="flex w-full max-w-[400px] flex-col">
        <CiteRow icon="check" tone="success" label="Gift cards sit beside cash" onJump={jump} />
        <CiteRow
          icon="alert-triangle"
          tone="attention"
          label="Het doel ontbreekt"
          description="Nergens staat waarom dit nodig is"
        />
        <CiteRow
          icon="check-circle"
          label="Een bon van 25 op een mand van 40 laat 15 te betalen, en een verkeerde code wordt geweigerd"
          description="14 criteria"
          onJump={jump}
        />
      </div>
    ),
    Framed: () => (
      <div className="flex w-full max-w-[400px] flex-col gap-1.5">
        <CiteRow
          framed
          label="Een bon is een jaar geldig"
          description="Anders: altijd geldig"
          tag="Grote impact"
          onJump={jump}
        />
        <CiteRow framed label="Je logt zelf in" description="Anders: in de app" />
      </div>
    ),
  },
} satisfies Story
