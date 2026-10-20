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
      <div className="flex w-[360px] justify-end">
        <ChipListField
          labels={nl.chipList}
          label="Hosts"
          value={value}
          maxItems={maxItems}
          maxLength={60}
          {...(minItems !== undefined ? { minItems } : {})}
          check={(item) => (refuse && item.includes(' ') ? 'No spaces in a host' : undefined)}
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
    Empty: () => <Live initial={[]} />,
    'A few values': () => <Live initial={['shop.test', 'api.shop.test']} />,
    'Many values wrap': () => (
      <Live
        initial={['shop.test', 'api.shop.test', 'cdn.shop.test', 'admin.shop.test', 'localhost']}
      />
    ),
    'Full: no field to add': () => <Live initial={['draft', 'review']} maxItems={2} />,
    'Keeps at least one': () => <Live initial={['draft']} minItems={1} />,
  },
} satisfies Story
