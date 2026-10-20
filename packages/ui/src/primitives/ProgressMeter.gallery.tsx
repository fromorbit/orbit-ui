import type { Story } from '../gallery/story'
import { ProgressMeter } from './ProgressMeter'

/** What the app says for the figures, in Dutch as the gallery runs. */
const meterText = (value: number, max: number) => `${value} van ${max}`

export default {
  group: 'primitives',
  title: 'ProgressMeter',
  states: {
    // The plans under a spec: a fixed bar and the count, so the counts of a column line up.
    'Plans in a column': () => (
      <div className="flex flex-col gap-2">
        <ProgressMeter valueText={meterText} value={0} max={3} label="PLAN-11" />
        <ProgressMeter valueText={meterText} value={2} max={5} label="PLAN-10" />
        <ProgressMeter valueText={meterText} value={4} max={6} label="PLAN-9" />
        <ProgressMeter valueText={meterText} value={4} max={4} label="PLAN-8" />
      </div>
    ),
    // Acceptance: the bar takes its column, the count is said in words beside it.
    'Filling its column, without the count': () => (
      <div className="flex w-64">
        <ProgressMeter
          valueText={meterText}
          value={9}
          max={12}
          label="Acceptance"
          width="fill"
          count={false}
        />
      </div>
    ),
  },
} satisfies Story
