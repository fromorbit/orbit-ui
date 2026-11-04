import type { Story } from '../gallery/story'
import { SectionHeading } from './SectionHeading'

export default {
  group: 'primitives',
  title: 'SectionHeading',
  states: {
    // The groups of the Specs list, in the column's width.
    'Groups of the Specs list': () => (
      <div className="flex w-90 flex-col gap-3 bg-frame p-2">
        <SectionHeading>Wacht op jou</SectionHeading>
        <SectionHeading>In uitvoering</SectionHeading>
        <SectionHeading>Gepland</SectionHeading>
      </div>
    ),
    // Over the plans of a document with their total, and over the stream of activity with a rule.
    'With a count and a rule': () => (
      <div className="flex w-150 flex-col gap-3 bg-canvas p-2">
        <SectionHeading count="2/5">Plannen en besluiten</SectionHeading>
        <SectionHeading rule>Activiteit</SectionHeading>
      </div>
    ),
  },
} satisfies Story
