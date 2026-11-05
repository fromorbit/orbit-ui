import type { Story } from '../gallery/story'
import { nl } from '../testing/labels'
import { SeverityBar } from './SeverityBar'

export default {
  group: 'patterns',
  title: 'SeverityBar',
  states: {
    'Bevindingen van een review': () => (
      <div className="w-full max-w-96">
        <SeverityBar
          label="Bevindingen naar ernst"
          counts={{ blocking: 1, problem: 2, note: 1 }}
          labels={nl.severity}
        />
      </div>
    ),
    'Veel bevindingen: aantallen van vier cijfers': () => (
      <div className="w-full max-w-96">
        <SeverityBar
          label="Bevindingen naar ernst"
          counts={{ blocking: 128, problem: 1204, note: 37 }}
          labels={nl.severity}
        />
      </div>
    ),
    'Smal: 320px, de legenda loopt door': () => (
      <div className="w-full max-w-[288px]">
        <SeverityBar
          label="Bevindingen naar ernst"
          counts={{ blocking: 128, problem: 1204, note: 37 }}
          labels={nl.severity}
        />
      </div>
    ),
    'Alleen opmerkingen: geen balk': () => (
      <div className="w-full max-w-96">
        <SeverityBar label="Bevindingen naar ernst" counts={{ note: 3 }} labels={nl.severity} />
      </div>
    ),
    'Niets gevonden': () => (
      <div className="w-full max-w-96">
        <SeverityBar label="Bevindingen naar ernst" counts={{}} labels={nl.severity} />
      </div>
    ),
  },
} satisfies Story
