/** The three sizes of `OrbMark`. */
export type OrbMarkSize = 'sm' | 'md' | 'lg'

/** The props of `OrbMark`. */
export interface OrbMarkProps {
  /**
   * `sm` (16px) beside a word in a row or a tab, `md` (22px, default) before a bubble and in the
   * row of the side panel, `lg` (40px) at the head of an empty conversation.
   */
  size?: OrbMarkSize
  /**
   * The mark's name, already translated ("Orb"), when it stands alone and says who this is.
   * Without it the mark is decorative (`aria-hidden`): beside a bubble or a name the words already
   * say it, and a second name would be read out twice.
   */
  label?: string
}

/**
 * The box and the shade per size, as complete class strings (Tailwind reads source text). The
 * shade grows with the sphere, about a sixth of its width, so the three read as one drawing.
 */
const SIZES: Record<OrbMarkSize, string> = {
  sm: 'size-4 shadow-[inset_-3px_-3px_0_var(--nt-orb-deep)]',
  md: 'size-[22px] shadow-[inset_-4px_-4px_0_var(--nt-orb-deep)]',
  lg: 'size-10 shadow-[inset_-7px_-7px_0_var(--nt-orb-deep)]',
}

/**
 * The mark of Orb, the companion in the Chats of the app: a sphere in one flat fill (`bg-orb`)
 * with a deeper shade at its lower right (`orb-deep`), so it reads as round without a gradient.
 *
 * Round by meaning, as an avatar is, and never a status: it does not pulse or spin, so there is
 * nothing to still for `prefers-reduced-motion`. A writing Orb shows `TypingDots` in its bubble
 * instead. The colours are tokens in both themes, and the sphere keeps the 3:1 of a glyph on the
 * canvas, the side panel and a card (`tokens.test.ts`).
 */
export function OrbMark({ size = 'md', label }: OrbMarkProps) {
  const name =
    label === undefined ? { 'aria-hidden': true as const } : { role: 'img', 'aria-label': label }
  return (
    <span
      {...name}
      data-nt-orb-mark
      data-size={size}
      className={`inline-block shrink-0 rounded-full bg-orb ${SIZES[size]}`}
    />
  )
}
