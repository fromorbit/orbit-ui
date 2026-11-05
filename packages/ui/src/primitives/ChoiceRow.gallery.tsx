import type { Story } from '../gallery/story'
import { ChoiceRow } from './ChoiceRow'

export default {
  group: 'primitives',
  title: 'ChoiceRow',
  states: {
    'Eén uit meerdere': () => (
      <div className="flex w-full max-w-[360px] flex-col gap-0.5">
        <ChoiceRow
          kind="radio"
          number={1}
          label="Per tarief"
          tag="Aanbevolen"
          description="De btw per tarief is leidend."
          checked
          tabbable
          onChoose={() => {}}
        />
        <ChoiceRow
          kind="radio"
          number={2}
          label="Elke regel apart"
          description="Kan een cent afwijken."
          checked={false}
          tabbable={false}
          onChoose={() => {}}
        />
      </div>
    ),
    'Elk aantal': () => (
      <div className="flex w-full max-w-[360px] flex-col gap-0.5">
        <ChoiceRow kind="checkbox" number={1} label="Koppen" checked tabbable onChoose={() => {}} />
        <ChoiceRow
          kind="checkbox"
          number={2}
          label="Openstaande punten"
          checked={false}
          tabbable={false}
          onChoose={() => {}}
        />
      </div>
    ),
  },
} satisfies Story
