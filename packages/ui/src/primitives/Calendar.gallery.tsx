import { useState } from 'react'
import type { Story } from '../gallery/story'
import { Calendar } from './Calendar'

const LABELS = { previousMonth: 'Vorige maand', nextMonth: 'Volgende maand' }

function Month({ min, weekends = true }: { min?: string; weekends?: boolean }) {
  const [value, setValue] = useState<string | null>('2026-11-12')
  return (
    <Calendar
      value={value}
      onValueChange={setValue}
      today="2026-11-03"
      labels={LABELS}
      {...(min ? { min } : {})}
      {...(weekends
        ? {}
        : {
            isDisabled: (day: string) => [0, 6].includes(new Date(`${day}T00:00:00Z`).getUTCDay()),
          })}
    />
  )
}

export default {
  group: 'primitives',
  title: 'Calendar',
  states: {
    'A day chosen': () => <Month />,
    'Not before today, no weekends': () => <Month min="2026-11-03" weekends={false} />,
  },
} satisfies Story
