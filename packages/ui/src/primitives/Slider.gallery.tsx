import { useState } from 'react'
import type { Story } from '../gallery/story'
import { FormField } from './FormField'
import { Slider } from './Slider'

function Memory() {
  const [value, setValue] = useState(1024)
  return (
    <div className="w-full max-w-80">
      <FormField label="Geheugen" description="Per container; boven de limiet stopt hij.">
        {(field) => (
          <Slider
            label="Geheugen"
            value={value}
            min={128}
            max={4096}
            step={128}
            valueText={(v) => `${v} MB`}
            onValueChange={setValue}
            {...field}
          />
        )}
      </FormField>
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'Slider',
  states: {
    'In een formulierveld': () => <Memory />,
    'Zonder getal': () => (
      <div className="w-64">
        <Slider
          label="Volume"
          value={30}
          showValue={false}
          valueText={(v) => `${v}%`}
          onValueChange={() => {}}
        />
      </div>
    ),
    Uitgeschakeld: () => (
      <div className="w-64">
        <Slider
          label="Kernen"
          value={2}
          max={8}
          disabled
          valueText={(v) => `${v} kernen`}
          onValueChange={() => {}}
        />
      </div>
    ),
  },
} satisfies Story
