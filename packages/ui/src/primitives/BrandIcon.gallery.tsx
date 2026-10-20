import type { Story } from '../gallery/story'
import { BRANDS } from '../types'
import { BrandIcon, type Mark } from './BrandIcon'

/** One mark with the word under it, as the `Icon` story shows its glyphs. */
function Cell({ brand, name }: { brand: Mark | undefined; name: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-[12px] text-muted">
      <BrandIcon brand={brand} size="md" />
      <span>{name}</span>
    </div>
  )
}

/** Every brand but the two the first story shows, and GitHub, which has a story of its own. */
const ACP_MAKERS = BRANDS.filter((brand) => !['anthropic', 'openai', 'github'].includes(brand))

export default {
  group: 'primitives',
  title: 'Brand Icon',
  states: {
    Marks: () => (
      // Both marks and the neutral glyph of an agent without a brand, in the tone of the text.
      <div className="flex items-center gap-6 text-fg">
        <Cell brand="anthropic" name="anthropic" />
        <Cell brand="openai" name="openai" />
        <Cell brand={undefined} name="none" />
      </div>
    ),
    // The makers of the ACP agents the app knows, in a story of their own so the row
    // above keeps its reference image.
    'ACP agents': () => (
      // Wrapped within the width of the first story, so its reference keeps its size.
      <div className="flex max-w-68 flex-wrap items-center gap-6 text-fg">
        {ACP_MAKERS.map((brand) => (
          <Cell key={brand} brand={brand} name={brand} />
        ))}
      </div>
    ),
    // The mark of a pull request's chip, and of Copilot's maker, on its own so the agents' row
    // above keeps its reference image.
    GitHub: () => (
      <div className="flex items-center gap-6 text-fg">
        <Cell brand="github" name="github" />
      </div>
    ),
    'Beside a model name': () => (
      // The size and tone they take in the model pill: 14px in the secondary text colour.
      <div className="flex flex-col gap-2 text-[12px] font-medium text-secondary">
        <span className="flex items-center gap-1.5">
          <BrandIcon brand="anthropic" label="Claude Code" />
          Opus 5.5 · Medium
        </span>
        <span className="flex items-center gap-1.5">
          <BrandIcon brand="openai" label="Codex" />
          GPT-5.5 · Hoog
        </span>
      </div>
    ),
  },
} satisfies Story
