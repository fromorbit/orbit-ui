import type { Story } from '../gallery/story'
import { StepChips } from './StepChips'

export default {
  group: 'primitives',
  title: 'StepChips',
  states: {
    'Klaar, open en overgeslagen': () => (
      <StepChips
        label="Questions"
        steps={[
          { id: 'place', label: 'Plaats', state: 'done', stateLabel: 'beantwoord' },
          { id: 'contents', label: 'Inhoud' },
          { id: 'form', label: 'Formulier', state: 'skipped', stateLabel: 'overgeslagen' },
        ]}
        selected="contents"
        onSelect={() => {}}
      />
    ),
  },
} satisfies Story
