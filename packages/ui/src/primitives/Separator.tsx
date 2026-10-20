/** The props of `Separator`. */
export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
}

/**
 * A thin rule that divides content, one token-coloured pixel wide.
 *
 * `aria-orientation` (not just a visual class) makes the division explicit to assistive technology,
 * since a divider between sections carries no text of its own to convey it otherwise.
 */
export function Separator({ orientation = 'horizontal' }: SeparatorProps) {
  return (
    <hr
      aria-orientation={orientation}
      className={`m-0 border-0 ${orientation === 'vertical' ? 'h-full w-px bg-border' : 'h-px w-full bg-border'}`}
    />
  )
}
