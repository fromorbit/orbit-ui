import { cva } from 'class-variance-authority'
import type { ReactElement, ReactNode } from 'react'

/**
 * The rule and the air behind it, with the two shapes as complete class strings.
 *
 * `cva` rather than a ternary for the same reason as `Kbd`, `Input` and `SearchList`: the variants
 * of a component stand in one table where they can be read against each other, and Tailwind finds
 * every utility by scanning source text, so neither string is ever joined at runtime.
 */
const rule = cva('border-l pl-3', {
  variants: { line: { visible: 'border-border', hidden: 'border-transparent' } },
  defaultVariants: { line: 'visible' },
})

/** Whether the rule is drawn or only kept as space; `hidden` still takes exactly the same room. */
export type RailLine = 'visible' | 'hidden'

/** The props of `Rail`. */
export interface RailProps {
  children: ReactNode
  /**
   * `hidden` keeps the inset without drawing the rule.
   *
   * For a block that belongs to the same column but is not the work being done — a run of
   * technical events of a provider. It stands where the others stand and says nothing extra.
   */
  line?: RailLine
}

/**
 * The left rule every secondary block of an answer hangs from: thinking, a run of tool calls, a
 * single call, a run of technical events.
 *
 * One component rather than the same two classes in four places, because the four had quietly
 * drifted apart: a block of calls carried an extra `ml-1.5`, so its rule stood six pixels to the
 * right of the thinking block above it — off the 4px grid as well — and an answer that alternated
 * the two made the line jump in and out. What a reader sees now is one column: the rule at the
 * left edge of the answer, 12px of air, and the block.
 *
 * It draws the rule and owns that gap, and nothing else: what stands inside decides its own
 * layout. `RailInset` is the other half — the columns a glyph and a chevron take, kept open by a
 * block that has neither, so the first line of every block begins at the same x.
 *
 * The conversation itself no longer draws this rule:
 * its quiet lines stand at the edge of the agent's text. `RailInset` is still what indents the text
 * of an open thought and the rows of an open run of technical events.
 */
export function Rail({ children, line = 'visible' }: RailProps): ReactElement {
  return (
    // The shape as an attribute, so a test can find the line itself rather than guess which
    // wrapper happens to carry the border.
    <div data-nt-rail={line} className={rule({ line })}>
      {children}
    </div>
  )
}

/** The props of `RailInset`. */
export interface RailInsetProps {
  children: ReactNode
  /**
   * How many glyph-sized columns stand open in front of the content: one or two.
   *
   * One is the chevron's column, for rows that carry a glyph of their own (a tool call under an
   * open summary). Two is for a block that has neither chevron nor glyph — the thinking step —
   * which then starts its first line exactly where a summary's sentence and a row's name start.
   */
  columns?: 1 | 2
}

/**
 * The columns a glyph and a chevron occupy, kept open by content that has neither.
 *
 * The same idiom as the empty slot of `StatusShape` and the check of `SearchList`: a box that is
 * there whether or not something stands in it, so nothing shifts sideways when it fills. Here it
 * is what makes one rail readable — the label of a thinking block, the sentence of a folded run of
 * steps and the name of an open tool row all begin at the same x, in every order they can appear.
 */
export function RailInset({ children, columns = 1 }: RailInsetProps): ReactElement {
  return (
    <div className="flex gap-2">
      <span className="size-(--nt-icon-sm) shrink-0" />
      {columns === 2 ? <span className="size-(--nt-icon-sm) shrink-0" /> : null}
      {/* `min-w-0`, or a long tool input would push the column wider than the conversation. */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">{children}</div>
    </div>
  )
}
