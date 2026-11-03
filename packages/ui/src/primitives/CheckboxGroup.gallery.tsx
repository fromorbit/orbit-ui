import { useState } from 'react'
import type { Story } from '../gallery/story'
import { CheckboxGroup } from './CheckboxGroup'

const OPTIONS = [
  { value: 'build', label: 'Een build faalt', description: 'Met de regel waarop hij stopte.' },
  { value: 'deploy', label: 'Een deploy is klaar' },
  { value: 'invite', label: 'Iemand nodigt me uit' },
  { value: 'weekly', label: 'Wekelijks overzicht', disabled: true },
]

function Notifications({ error }: { error?: string }) {
  const [value, setValue] = useState<string[]>(error ? [] : ['build', 'invite'])
  return (
    <div className="w-full max-w-80">
      <CheckboxGroup
        label="Meldingen"
        description="Per e-mail, hooguit één per uur."
        {...(error ? { error } : {})}
        options={OPTIONS}
        value={value}
        onValueChange={setValue}
      />
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'CheckboxGroup',
  states: {
    'Two checked': () => <Notifications />,
    'With an error': () => <Notifications error="Kies er minstens één." />,
  },
} satisfies Story
