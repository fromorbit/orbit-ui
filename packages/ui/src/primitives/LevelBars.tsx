/**
 * A small glyph of a level on a scale: three or four bars, as many filled as the place of the level
 * (the reasoning level of a model).
 *
 * Bars of 2px wide and 4, 7 and 10px high (a fourth 13px), rising left to right, in the colour of
 * the text around them; an unfilled bar is that colour at a third. Decorative (`aria-hidden`):
 * the word of the level always stands beside it, and a glyph never carries the meaning alone
 * (never colour alone). Spans rather than an `<svg>`, so no drawing of its own has to
 * be registered beside the icons.
 */
export function LevelBars({ level, of }: { level: number; of: number }) {
  const count = Math.max(1, Math.min(4, of))
  return (
    <span
      data-nt-level-bars
      aria-hidden="true"
      className="inline-flex h-3.5 shrink-0 items-end gap-px"
    >
      {Array.from({ length: count }, (_, index) => {
        const on = index < level
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: the bars are a fixed scale.
            key={index}
            data-nt-level-bar
            data-on={on}
            className={[
              'w-0.5 rounded-[1px] bg-current',
              HEIGHTS[index] ?? HEIGHTS[3],
              on ? '' : 'opacity-35',
            ].join(' ')}
          />
        )
      })}
    </span>
  )
}

/** The height of each bar, written out in full so Tailwind generates every class. */
const HEIGHTS = ['h-1', 'h-[7px]', 'h-2.5', 'h-[13px]'] as const
