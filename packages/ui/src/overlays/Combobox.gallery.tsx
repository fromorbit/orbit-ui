import { useState } from 'react'
import type { Story } from '../gallery/story'
import { FormField } from '../primitives/FormField'
import { Combobox, MultiCombobox } from './Combobox'

const REGIONS = [
  { value: 'ams', label: 'Amsterdam', detail: 'eu-west', keywords: ['nederland'] },
  { value: 'fra', label: 'Frankfurt', detail: 'eu-central' },
  { value: 'zrh', label: 'Zürich', detail: 'eu-central' },
  { value: 'lon', label: 'Londen', detail: 'eu-west' },
  { value: 'nyc', label: 'New York', detail: 'us-east', disabled: true },
  { value: 'sfo', label: 'San Francisco', detail: 'us-west' },
  { value: 'sgp', label: 'Singapore', detail: 'ap-southeast' },
]

const LABELS = { search: 'Zoeken…', noResults: (q: string) => `Geen treffers voor ‘${q}’` }

function Region({ initial }: { initial: string | null }) {
  const [value, setValue] = useState<string | null>(initial)
  return (
    <div className="w-full max-w-72">
      <FormField label="Regio" description="Waar de app draait.">
        {(field) => (
          <Combobox
            label="Regio"
            placeholder="Kies een regio"
            labels={LABELS}
            options={REGIONS}
            value={value}
            onValueChange={setValue}
            block
            {...field}
          />
        )}
      </FormField>
    </div>
  )
}

function Labels() {
  const [value, setValue] = useState<string[]>(['ams', 'fra', 'sfo'])
  return (
    <div className="w-full max-w-72">
      <FormField label="Regio's voor de replica's">
        {(field) => (
          <MultiCombobox
            label="Regio's"
            placeholder="Kies regio's"
            labels={LABELS}
            countLabel={(count) => `${count} regio's`}
            options={REGIONS}
            value={value}
            onValueChange={setValue}
            block
            {...field}
          />
        )}
      </FormField>
    </div>
  )
}

export default {
  group: 'overlays',
  title: 'Combobox',
  states: {
    Empty: () => <Region initial={null} />,
    Chosen: () => <Region initial="zrh" />,
    'Several chosen': () => <Labels />,
    Invalid: () => (
      <div className="w-full max-w-72">
        <FormField label="Regio" error="Kies een regio.">
          {(field) => (
            <Combobox
              label="Regio"
              placeholder="Kies een regio"
              labels={LABELS}
              options={REGIONS}
              value={null}
              onValueChange={() => {}}
              block
              {...field}
            />
          )}
        </FormField>
      </div>
    ),
  },
} satisfies Story
