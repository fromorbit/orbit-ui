import type { Story } from '../gallery/story'
import { LevelBars } from './LevelBars'

/** Every level of a scale of three, beside the word it stands for, as in the reasoning pill. */
function OfThree() {
  return (
    <div className="flex flex-col gap-2 text-[12px] text-secondary">
      {['Laag', 'Midden', 'Hoog'].map((word, index) => (
        <span key={word} className="flex items-center gap-1.5">
          <LevelBars level={index + 1} of={3} />
          {word}
        </span>
      ))}
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'LevelBars',
  states: { 'Of three': OfThree },
} satisfies Story
