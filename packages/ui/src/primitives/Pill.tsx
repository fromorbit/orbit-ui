import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

/**
 * The frame of a pill, as one complete class string (Tailwind reads source text, and this project
 * has no class-merging tool). `aria-expanded` keeps the pill lit while its menu is open, the way a
 * hover lights it.
 */
const PILL =
  'no-drag inline-flex h-(--nt-control-md) min-w-0 max-w-full items-center gap-1.5 rounded-full border border-border-strong bg-pill ps-2.5 pe-2 text-[12px] font-medium whitespace-nowrap text-secondary outline-focus transition-[background-color] duration-100 hover:bg-pill-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 aria-expanded:bg-pill-hover aria-expanded:text-fg disabled:pointer-events-none disabled:opacity-40 aria-disabled:opacity-40'

/**
 * The quiet pill: the same box with a transparent border, so its size never changes, and no plane
 * until hover or an open menu. `text-muted` at rest, one step below the framed pill's tone.
 */
const QUIET =
  'no-drag inline-flex h-(--nt-control-md) min-w-0 max-w-full items-center gap-1.5 rounded-full border border-transparent bg-transparent ps-2.5 pe-2 text-[12px] font-medium whitespace-nowrap text-muted outline-focus transition-[background-color] duration-100 hover:bg-pill-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 aria-expanded:bg-pill-hover aria-expanded:text-fg disabled:pointer-events-none disabled:opacity-40 aria-disabled:opacity-40'

/**
 * The container width below which a collapsing pill falls back to its icon: 588px of toolbar.
 *
 * Here rather than in `PickerPill`, which explains the number, because both frames of a toolbar
 * pill use it and a second copy of the literal could drift. One literal class: Tailwind finds
 * utilities by scanning source text.
 *
 * @see PickerPill's `COLLAPSE_BELOW` note for where the 588px comes from
 */
export const COLLAPSE_BELOW = '@max-[588px]/toolbar:sr-only'

/**
 * The pill as its glyph alone: the same round box, square at 28px, no value on screen and no
 * chevron. For the access level beside the model pill, whose word was
 * one more thing to read in a row that should only say what matters.
 */
const BARE =
  'no-drag inline-flex size-(--nt-control-md) shrink-0 items-center justify-center rounded-full border border-border-strong bg-pill text-secondary outline-focus transition-[background-color] duration-100 hover:bg-pill-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 aria-expanded:bg-pill-hover aria-expanded:text-fg disabled:pointer-events-none disabled:opacity-40 aria-disabled:opacity-40'

/** `BARE` without border and plane at rest, for a chat that has started (see `quiet`). */
const BARE_QUIET =
  'no-drag inline-flex size-(--nt-control-md) shrink-0 items-center justify-center rounded-full border border-transparent bg-transparent text-muted outline-focus transition-[background-color] duration-100 hover:bg-pill-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 aria-expanded:bg-pill-hover aria-expanded:text-fg disabled:pointer-events-none disabled:opacity-40 aria-disabled:opacity-40'

/** `BARE` as text: nothing to press. */
const BARE_TEXT =
  'inline-flex size-(--nt-control-md) shrink-0 items-center justify-center rounded-full border border-transparent text-muted'

/** The cap on a value that loses its tail, as complete class strings (see `PickerPill`). */
const CAP = { wide: 'max-w-40', narrow: 'max-w-26' } as const

/** The box of a quiet pill as text: no hover, no focus, nothing to press. */
const TEXT =
  'inline-flex h-(--nt-control-md) min-w-0 max-w-full items-center gap-1.5 rounded-full border border-transparent ps-2.5 pe-2 text-[12px] font-medium whitespace-nowrap text-muted'

/** The props of `Pill`. */
export interface PillProps
  extends Omit<ComponentPropsWithRef<'button'>, 'className' | 'style' | 'children'> {
  /** The value the pill shows ("Claude Sonnet", "Bewerkingen"); loses its tail when room runs out. */
  children: string
  /** A 14px glyph before the value, in the faint tone: the shield of the access level. */
  icon?: IconName
  /**
   * A drawing of the caller's own in the place of `icon`: the mark of the agent in the model pill
   * (`BrandIcon`), which stands in for the agent's name. Wins over `icon`.
   */
  glyph?: ReactNode
  /**
   * The value as a screen reader hears it, where the glyph says something the text leaves out
   * ("Claude Code · Opus 5.5 · Medium" beside a pill that shows the mark and "Opus 5.5 · Medium").
   * Only with `label`; left out, the value is `children`.
   */
  spoken?: string
  /**
   * What the pill chooses ("Toegang"): given, the accessible name is "<label>: <value>", so a
   * screen reader hears which choice this is and not only its current value.
   */
  label?: string
  /**
   * `attention` colours the glyph and the value, for the access level "full"; never
   * alone, the glyph says it too.
   */
  tone?: 'neutral' | 'attention'
  /**
   * Without border and plane at rest, the same size: the toolbar of a chat that has started,
   * where the pills are there for whoever wants to change something and
   * otherwise step back. Hover, an open menu and the focus ring stay as they are.
   */
  quiet?: boolean
  /**
   * Below a toolbar of 588px the value leaves the screen and the glyph stands alone, and the pill
   * no longer shrinks: it has nothing left to truncate (the Expert pill; see `PickerPill`). The
   * value stays in the accessible name, which is `label` and the value.
   */
  collapse?: boolean
  /**
   * A cap on the value before it loses its tail: 160px (`wide`) or 104px (`narrow`). Left out,
   * the value takes the room the row gives it — the model and the access level keep their words.
   */
  cap?: 'wide' | 'narrow'
  /**
   * Only the glyph, in a round box of 28px: the value leaves the screen (it stays in the
   * accessible name) and so does the chevron. Needs `icon` or `glyph`; the caller puts the value in
   * a tooltip, since the eye has no other way to read it.
   */
  bare?: boolean
}

/** The glyph before the value: the caller's drawing, else the icon, coloured for `attention`. */
function lead(
  glyph: ReactNode,
  icon: IconName | undefined,
  tone: 'neutral' | 'attention',
): ReactNode {
  if (glyph) return glyph
  if (!icon) return null
  return tone === 'attention' ? (
    // The colour on a box of its own: `Icon` has no attention tone (see `PickerPill`).
    <span data-nt-pill-icon className="flex shrink-0 text-attention">
      <Icon name={icon} size="sm" />
    </span>
  ) : (
    <Icon name={icon} size="sm" tone="faint" />
  )
}

/** The value, losing its tail where room runs out; the attention tone colours it too. */
function value(
  children: string,
  tone: 'neutral' | 'attention',
  cap?: 'wide' | 'narrow',
  collapse = false,
): ReactNode {
  const classes = [
    'min-w-0 truncate',
    tone === 'attention' ? 'text-attention' : '',
    cap ? CAP[cap] : '',
    collapse ? COLLAPSE_BELOW : '',
  ]
  return (
    <span data-nt-pill-value className={classes.filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}

/**
 * A pill with a border that opens a menu or a picker: the model and the access level in the
 * toolbar of the composer.
 *
 * 28px high, radius 999, a white plane of 4% inside the strong border, the value in 12px/500
 * `text-secondary`, an optional glyph before it and `chevrons-up-down` after it (12px, faint) — the
 * affordance that says it opens. Only the look: which menu or picker it opens is up to the caller,
 * who makes it the trigger with `asChild` (`<Popover.Trigger asChild><Pill …/></Popover.Trigger>`).
 * That is why every prop of a button passes through, the ref too, and why it defaults to
 * `type="button"`. `PickerPill` stays the pill without a frame for a panel and the line under the
 * composer; this is the one with a frame, for a row of controls — every pill of the toolbar wears
 * it, the Expert pill too.
 */
export function Pill({
  children,
  icon,
  glyph,
  label,
  spoken,
  tone = 'neutral',
  quiet = false,
  collapse = false,
  cap,
  bare = false,
  type = 'button',
  ...props
}: PillProps) {
  const { className: _className, style: _style, ...rest } = props as ComponentPropsWithRef<'button'>
  if (bare) {
    return (
      <button
        type={type}
        aria-label={label === undefined ? (spoken ?? children) : `${label}: ${spoken ?? children}`}
        data-nt-pill-bare
        className={quiet ? BARE_QUIET : BARE}
        {...rest}
      >
        {lead(glyph, icon, tone)}
      </button>
    )
  }
  // A collapsed pill keeps its glyph and chevron whole; its neighbours give way on its behalf.
  const frame = quiet ? QUIET : PILL
  return (
    <button
      type={type}
      aria-label={label === undefined ? undefined : `${label}: ${spoken ?? children}`}
      className={collapse ? `${frame} shrink-0` : frame}
      {...rest}
    >
      {lead(glyph, icon, tone)}
      {value(children, tone, cap, collapse)}
      <Icon name="chevrons-up-down" size="xs" tone="faint" />
    </button>
  )
}

/** The props of `PillText`. */
export interface PillTextProps {
  /** The value, as the pill would show it. */
  children: string
  icon?: IconName
  glyph?: ReactNode
  /** What the pill would choose: stands before the value as hidden text ("Toegang: Handmatig"). */
  label: string
  tone?: 'neutral' | 'attention'
  /** A remark about the value, as `title` and as hidden text after it (see `PickerPill`'s note). */
  note?: string
  /** Only the glyph, as `Pill`'s `bare`; the value stays as hidden text and in the `title`. */
  bare?: boolean
}

/**
 * A quiet pill that cannot be opened: a fact of this chat in the toolbar, in the same box as the
 * pills beside it, so a row of quiet pills and facts reads as one line.
 *
 * A `span` with its words as hidden text rather than an `aria-label`: ARIA forbids a label on a
 * plain span (see `PickerPill`'s read-only form, which this is for the `pill` frame). No chevron:
 * nothing opens.
 */
export function PillText({
  children,
  icon,
  glyph,
  label,
  tone = 'neutral',
  note,
  bare = false,
}: PillTextProps) {
  if (bare) {
    return (
      <span data-nt-pill title={note ?? `${label}: ${children}`} className={BARE_TEXT}>
        <span className="sr-only">{`${label}: ${children}`}</span>
        {lead(glyph, icon, tone)}
        {note ? <span data-nt-pill-note className="sr-only">{` ${note}`}</span> : null}
      </span>
    )
  }
  return (
    <span data-nt-pill {...(note ? { title: note } : {})} className={TEXT}>
      <span className="sr-only">{`${label}: `}</span>
      {lead(glyph, icon, tone)}
      {value(children, tone)}
      {note ? <span data-nt-pill-note className="sr-only">{` ${note}`}</span> : null}
    </span>
  )
}
