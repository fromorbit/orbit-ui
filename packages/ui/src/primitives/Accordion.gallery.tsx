import { useState } from 'react'
import type { Story } from '../gallery/story'
import { Accordion } from './Accordion'

const ITEMS = [
  {
    id: 'kosten',
    title: 'Wat kost een space?',
    content:
      'Niets zolang hij stilstaat. Een draaiende space telt per minuut, tot de limiet van je plan.',
  },
  {
    id: 'data',
    title: 'Waar staat mijn data?',
    content: 'In Amsterdam, op machines van ons zelf. Er gaat niets naar een andere regio.',
  },
  {
    id: 'export',
    title: 'Kan ik alles exporteren?',
    detail: 'zip',
    content: 'Ja: de code, de database en de bestanden, in één archief.',
  },
]

function Faq() {
  const [value, setValue] = useState<string | null>('kosten')
  return (
    <div className="w-full max-w-[28rem]">
      <Accordion type="single" items={ITEMS} value={value} onValueChange={setValue} />
    </div>
  )
}

function Several() {
  const [value, setValue] = useState<string[]>(['kosten', 'export'])
  return (
    <div className="w-full max-w-[28rem]">
      <Accordion type="multiple" items={ITEMS} value={value} onValueChange={setValue} />
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'Accordion',
  states: {
    'One open at a time': () => <Faq />,
    'Several open': () => <Several />,
  },
} satisfies Story
