import type { Story } from '../gallery/story'
import { StepChips } from './StepChips'

export default {
  group: 'primitives',
  title: 'StepChips',
  states: {
    'Done, open and skipped': () => (
      <StepChips
        label="Questions"
        steps={[
          { id: 'place', label: 'Place', state: 'done', stateLabel: 'answered' },
          { id: 'contents', label: 'Contents' },
          { id: 'form', label: 'Form', state: 'skipped', stateLabel: 'skipped' },
        ]}
        selected="contents"
        onSelect={() => {}}
      />
    ),
  },
} satisfies Story
