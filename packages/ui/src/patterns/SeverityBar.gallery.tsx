import type { Story } from '../gallery/story'
import { nl } from '../testing/labels'
import { SeverityBar } from './SeverityBar'

export default {
  group: 'patterns',
  title: 'SeverityBar',
  states: {
    'Findings of a review': () => (
      <div className="w-full max-w-96">
        <SeverityBar
          label="Bevindingen per gewicht"
          counts={{ blocking: 1, problem: 2, note: 1 }}
          labels={nl.severity}
        />
      </div>
    ),
    'Only remarks': () => (
      <div className="w-full max-w-96">
        <SeverityBar label="Bevindingen per gewicht" counts={{ note: 3 }} labels={nl.severity} />
      </div>
    ),
    'Nothing found': () => (
      <div className="w-full max-w-96">
        <SeverityBar label="Bevindingen per gewicht" counts={{}} labels={nl.severity} />
      </div>
    ),
  },
} satisfies Story
