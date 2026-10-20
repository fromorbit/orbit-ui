import type { Story } from '../gallery/story'
import { ChoiceRow } from './ChoiceRow'

export default {
  group: 'primitives',
  title: 'ChoiceRow',
  states: {
    'One of several': () => (
      <div className="flex w-[360px] flex-col gap-0.5">
        <ChoiceRow
          kind="radio"
          number={1}
          label="By rate"
          tag="Recommended"
          description="The tax per rate leads."
          checked
          tabbable
          onChoose={() => {}}
        />
        <ChoiceRow
          kind="radio"
          number={2}
          label="Every line apart"
          description="May be a cent off."
          checked={false}
          tabbable={false}
          onChoose={() => {}}
        />
      </div>
    ),
    'Any number': () => (
      <div className="flex w-[360px] flex-col gap-0.5">
        <ChoiceRow
          kind="checkbox"
          number={1}
          label="Headings"
          checked
          tabbable
          onChoose={() => {}}
        />
        <ChoiceRow
          kind="checkbox"
          number={2}
          label="Open items"
          checked={false}
          tabbable={false}
          onChoose={() => {}}
        />
      </div>
    ),
  },
} satisfies Story
