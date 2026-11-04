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
          label="Bevindingen naar ernst"
          counts={{ blocking: 1, problem: 2, note: 1 }}
          labels={nl.severity}
        />
      </div>
    ),
    'Many findings: four-digit counts': () => (
      <div className="w-full max-w-96">
        <SeverityBar
          label="Bevindingen naar ernst"
          counts={{ blocking: 128, problem: 1204, note: 37 }}
          labels={nl.severity}
        />
      </div>
    ),
    'Narrow: 320px, the legend wraps': () => (
      <div className="w-full max-w-[288px]">
        <SeverityBar
          label="Bevindingen naar ernst"
          counts={{ blocking: 128, problem: 1204, note: 37 }}
          labels={nl.severity}
        />
      </div>
    ),
    'Only remarks: no bar': () => (
      <div className="w-full max-w-96">
        <SeverityBar label="Bevindingen naar ernst" counts={{ note: 3 }} labels={nl.severity} />
      </div>
    ),
    'Nothing found': () => (
      <div className="w-full max-w-96">
        <SeverityBar label="Bevindingen naar ernst" counts={{}} labels={nl.severity} />
      </div>
    ),
  },
} satisfies Story
