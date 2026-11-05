import { useState } from 'react'
import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { nl } from '../testing/labels'
import { ChipListField } from './ChipListField'

function Live({
  initial,
  maxItems = 8,
  minItems,
  refuse,
}: {
  initial: string[]
  maxItems?: number
  minItems?: number
  refuse?: boolean
}) {
  const [value, setValue] = useState<readonly string[]>(initial)
  return (
    <TooltipProvider>
      <div className="flex w-full max-w-[360px]">
        <ChipListField
          labels={nl.chipList}
          label="Hosts"
          value={value}
          maxItems={maxItems}
          maxLength={60}
          {...(minItems !== undefined ? { minItems } : {})}
          check={(item) =>
            refuse && item.includes(' ') ? 'Een host heeft geen spaties' : undefined
          }
          onChange={(next) => setValue(next)}
        />
      </div>
    </TooltipProvider>
  )
}

export default {
  group: 'patterns',
  title: 'ChipListField',
  states: {
    Leeg: () => <Live initial={[]} />,
    'Een paar waarden': () => <Live initial={['shop.test', 'api.shop.test']} />,
    'Veel waarden lopen door': () => (
      <Live
        initial={['shop.test', 'api.shop.test', 'cdn.shop.test', 'admin.shop.test', 'localhost']}
      />
    ),
    'Vol: geen veld om toe te voegen': () => <Live initial={['draft', 'review']} maxItems={2} />,
    'Houdt er minstens één': () => <Live initial={['draft']} minItems={1} />,
  },
} satisfies Story
