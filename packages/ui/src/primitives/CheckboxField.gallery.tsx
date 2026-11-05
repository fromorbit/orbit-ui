import { useState } from 'react'
import type { Story } from '../gallery/story'
import { CheckboxField } from './CheckboxField'

function Remember() {
  const [checked, setChecked] = useState(true)
  return <CheckboxField label="Ingelogd blijven" checked={checked} onCheckedChange={setChecked} />
}

function Described() {
  const [checked, setChecked] = useState(false)
  return (
    <div className="w-full max-w-80">
      <CheckboxField
        label="Openbare preview"
        description="Iedereen met de link kan de app bekijken, zonder in te loggen."
        checked={checked}
        onCheckedChange={setChecked}
      />
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'CheckboxField',
  states: {
    Aangevinkt: () => <Remember />,
    'Met een beschrijving': () => <Described />,
    'Met een fout': () => (
      <div className="w-full max-w-80">
        <CheckboxField
          label="Ik ga akkoord met de voorwaarden"
          error="Ga akkoord om door te gaan."
          required
          checked={false}
          onCheckedChange={() => {}}
        />
      </div>
    ),
    Uitgeschakeld: () => (
      <CheckboxField label="Gezien" checked disabled onCheckedChange={() => {}} />
    ),
  },
} satisfies Story
