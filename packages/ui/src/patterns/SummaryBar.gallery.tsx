import type { Story } from '../gallery/story'
import { nl } from '../testing/labels'
import { SummaryBar } from './SummaryBar'

export default {
  group: 'patterns',
  title: 'SummaryBar',
  states: {
    // Under an answer in the column of 680px.
    'Onder een antwoord': () => (
      <div className="w-full max-w-170 bg-canvas p-4">
        <SummaryBar labels={nl.summary} files={4} added={128} removed={41} onOpen={() => {}} />
      </div>
    ),
    'Eén bestand': () => (
      <div className="w-full max-w-170 bg-canvas p-4">
        <SummaryBar labels={nl.summary} files={1} added={3} removed={0} onOpen={() => {}} />
      </div>
    ),
    // In the narrowest docked panel (320px) the count loses its tail before the figures or the
    // button move.
    'In een smalle kolom': () => (
      <div className="w-full max-w-80 bg-canvas p-4">
        <SummaryBar
          labels={nl.summary}
          files={1240}
          added={51203}
          removed={48710}
          onOpen={() => {}}
        />
      </div>
    ),
  },
} satisfies Story
