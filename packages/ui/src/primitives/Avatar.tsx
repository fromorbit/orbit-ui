import { cva } from 'class-variance-authority'
import { Icon } from './Icon'

/**
 * The initials of a name: the first sign of its first and of its last word, in capitals.
 *
 * Whole graphemes (`Intl.Segmenter`), like `ProjectMark`: a name that starts with an emoji keeps it
 * whole. One word gives one sign; "Noor van der Bakker" gives "NB", as most people would write it.
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]
  const last = words.length > 1 ? words.at(-1) : undefined
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  const sign = (word: string | undefined) => {
    if (word === undefined) return ''
    const [head] = segmenter.segment(word)
    return head ? head.segment.toLocaleUpperCase() : ''
  }
  return `${sign(first)}${sign(last)}`
}

/** How many quiet tones an avatar has: `--nt-avatar-1` up to this one. */
const TONES = 6

/**
 * Which of the six tones belongs to a name (1–6): a small hash of its characters, so the same
 * person always gets the same colour and two people mostly differ, without anything stored.
 */
export function avatarTone(name: string): number {
  let hash = 0
  for (const char of name) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0
  return (hash % TONES) + 1
}

// Written out in full: Tailwind finds a class only as a literal in the source.
const TONE_CLASSES = [
  'bg-avatar-1',
  'bg-avatar-2',
  'bg-avatar-3',
  'bg-avatar-4',
  'bg-avatar-5',
  'bg-avatar-6',
] as const

const avatar = cva(
  'inline-flex shrink-0 items-center justify-center rounded-full leading-none select-none',
  {
    variants: {
      size: {
        // In a row of the sidebar's foot or a menu: the 9px of `ProjectMark`, for two letters.
        sm: 'size-5 text-[9px] font-semibold',
        // The identity at the head of the account menu (design A): 30px beside two lines of text.
        md: 'size-7.5 text-[11px] font-semibold',
        // The head of the account page.
        lg: 'size-10 text-[15px] font-medium',
      },
      known: { true: 'text-fg', false: 'bg-mark text-muted' },
    },
  },
)

/** The props of `Avatar`. */
export interface AvatarProps {
  /** The person's display name; `null` when nobody is signed in. */
  name: string | null
  size: 'sm' | 'md' | 'lg'
}

/**
 * A person as a round: their initials on a quiet tone that follows from their name, or — without
 * anyone signed in — a neutral person glyph on the plane of a mark.
 *
 * Decorative (`aria-hidden`): the name always stands beside it as text. No photo: the platform
 * provides none, and the renderer loads nothing from the network.
 */
export function Avatar({ name, size }: AvatarProps) {
  const known = name !== null && name.trim() !== ''
  const tone = known ? TONE_CLASSES[avatarTone(name) - 1] : undefined
  return (
    <span
      aria-hidden="true"
      data-nt-avatar
      data-size={size}
      className={`${avatar({ size, known })}${tone ? ` ${tone}` : ''}`}
    >
      {known ? initialsOf(name) : <Icon name="user" size={size === 'sm' ? 'sm' : 'md'} />}
    </span>
  )
}
