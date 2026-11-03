import type { Story } from '../gallery/story'
import { BrandIcon } from './BrandIcon'
import { Button } from './Button'
import { OrbitSymbol } from './OrbitSymbol'

/** The symbol at the sizes it takes: beside a word (16px), in a header (24px), on its own (48px). */
function Sizes() {
  return (
    <div className="flex items-center gap-6 text-fg">
      <OrbitSymbol className="size-4" />
      <OrbitSymbol className="size-6" />
      <OrbitSymbol className="size-12" />
    </div>
  )
}

/** In a button beside GitHub's mark, at the same size, as a sign-in screen has it. */
function InAButton() {
  return (
    <div className="flex max-w-xs flex-col gap-2">
      <Button variant="secondary">
        <OrbitSymbol className="size-4" />
        Inloggen met Orbit
      </Button>
      <Button variant="secondary">
        <BrandIcon brand="github" />
        Doorgaan met GitHub
      </Button>
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'OrbitSymbol',
  states: { Maten: Sizes, 'In een knop': InAButton },
} satisfies Story
