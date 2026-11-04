import type { Story } from '../gallery/story'
import { ShareBar } from './ShareBar'

export default {
  group: 'primitives',
  title: 'ShareBar',
  states: {
    'Findings per weight': () => (
      <div className="w-full max-w-96">
        <ShareBar
          label="Bevindingen"
          segments={[
            {
              id: 'blocking',
              label: '1 blokkerend',
              value: 1,
              tone: 'danger',
              icon: 'octagon-alert',
            },
            {
              id: 'problem',
              label: '3 problemen',
              value: 3,
              tone: 'attention',
              icon: 'alert-triangle',
            },
            { id: 'note', label: '4 opmerkingen', value: 4, tone: 'neutral', icon: 'info' },
          ]}
        />
      </div>
    ),
    'Tests per outcome': () => (
      <div className="w-full max-w-96">
        <ShareBar
          label="Tests"
          segments={[
            { id: 'pass', label: '182 geslaagd', value: 182, tone: 'success' },
            { id: 'fail', label: '6 mislukt', value: 6, tone: 'danger' },
            { id: 'skip', label: '12 overgeslagen', value: 12, tone: 'neutral' },
          ]}
        />
      </div>
    ),
  },
} satisfies Story
