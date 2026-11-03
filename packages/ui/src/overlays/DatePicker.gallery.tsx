import { useState } from 'react'
import type { Story } from '../gallery/story'
import { FormField } from '../primitives/FormField'
import { DatePicker } from './DatePicker'

const LABELS = { previousMonth: 'Vorige maand', nextMonth: 'Volgende maand' }

function Deadline({ initial, error }: { initial: string | null; error?: string }) {
  const [value, setValue] = useState<string | null>(initial)
  return (
    <div className="w-64">
      <FormField
        label="Deadline"
        description="De dag waarop het af moet zijn."
        {...(error ? { error } : {})}
      >
        {(field) => (
          <DatePicker
            label="Deadline"
            placeholder="Kies een datum"
            labels={LABELS}
            today="2026-11-03"
            min="2026-11-03"
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
  title: 'DatePicker',
  states: {
    Empty: () => <Deadline initial={null} />,
    Chosen: () => <Deadline initial="2026-11-20" />,
    Invalid: () => <Deadline initial={null} error="Kies een datum." />,
  },
} satisfies Story
