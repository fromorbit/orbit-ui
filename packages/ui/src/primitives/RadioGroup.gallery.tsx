import type { Story } from '../gallery/story'
import { RadioGroup } from './RadioGroup'

export default {
  group: 'primitives',
  title: 'RadioGroup',
  states: {
    Default: () => (
      <RadioGroup
        label="Toegangsniveau"
        value="edits"
        options={[
          { id: 'read', label: 'Lezen' },
          { id: 'edits', label: 'Bewerken' },
          { id: 'full', label: 'Volledig' },
        ]}
        onValueChange={() => {}}
      />
    ),
    'With descriptions': () => (
      <RadioGroup
        label="Toegangsniveau"
        value="edits"
        options={[
          { id: 'read', label: 'Lezen', description: 'Alleen bestanden inzien.' },
          { id: 'edits', label: 'Bewerken', description: 'Wijzigingen zonder ze te bevestigen.' },
          { id: 'full', label: 'Volledig', description: 'Elke actie zonder te vragen.' },
        ]}
        onValueChange={() => {}}
      />
    ),
    'Long option that wraps': () => (
      <div className="w-56">
        <RadioGroup
          label="Model"
          value="a"
          options={[
            {
              id: 'a',
              label: 'Een naam die ruim over de breedte van de rij heen loopt en dus omslaat',
              description: 'En een uitleg die net zo lang is en op zijn beurt ook weer omslaat.',
            },
            { id: 'b', label: 'Kort' },
          ]}
          onValueChange={() => {}}
        />
      </div>
    ),
    Disabled: () => (
      <RadioGroup
        label="Toegangsniveau"
        value="edits"
        disabled
        options={[
          { id: 'read', label: 'Lezen', description: 'Alleen bestanden inzien.' },
          { id: 'edits', label: 'Bewerken', description: 'Wijzigingen zonder ze te bevestigen.' },
          { id: 'full', label: 'Volledig', description: 'Elke actie zonder te vragen.' },
        ]}
        onValueChange={() => {}}
      />
    ),
  },
} satisfies Story
