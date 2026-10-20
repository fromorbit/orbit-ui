import { useState } from 'react'
import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { PathField } from './PathField'

function Live({ initial, placeholder }: { initial: string | null; placeholder?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <TooltipProvider>
      <div className="flex w-[360px] justify-end">
        <PathField
          label="Folder"
          chooseLabel="Kies…"
          clearLabel="Wissen"
          value={value}
          placeholder={placeholder ?? 'Niet gekozen'}
          onChoose={() => setValue('/work/shop/docs')}
          onClear={() => setValue(null)}
        />
      </div>
    </TooltipProvider>
  )
}

export default {
  group: 'patterns',
  title: 'PathField',
  states: {
    'Not chosen': () => <Live initial={null} />,
    'A placeholder that says what empty means': () => (
      <Live initial={null} placeholder="From PATH" />
    ),
    Chosen: () => <Live initial="/work/shop" />,
    'A long path in a narrow row': () => (
      <Live initial="/work/clients/north/shop/packages/storefront/docs" />
    ),
    Disabled: () => (
      <TooltipProvider>
        <PathField
          label="Folder"
          chooseLabel="Kies…"
          clearLabel="Wissen"
          placeholder="Niet gekozen"
          value="/work/shop"
          disabled
          onChoose={() => undefined}
          onClear={() => undefined}
        />
      </TooltipProvider>
    ),
  },
} satisfies Story
