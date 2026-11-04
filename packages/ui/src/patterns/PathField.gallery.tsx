import { useState } from 'react'
import type { Story } from '../gallery/story'
import { TooltipProvider } from '../overlays/Tooltip'
import { PathField } from './PathField'

function Live({ initial, placeholder }: { initial: string | null; placeholder?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <TooltipProvider>
      <div className="flex w-full max-w-[360px] justify-end">
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
    'Niet gekozen': () => <Live initial={null} />,
    'Een placeholder die zegt wat leeg betekent': () => (
      <Live initial={null} placeholder="Uit je PATH" />
    ),
    Gekozen: () => <Live initial="/work/shop" />,
    'Een lang pad in een smalle rij': () => (
      <Live initial="/work/clients/north/shop/packages/storefront/docs" />
    ),
    Uitgeschakeld: () => (
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
