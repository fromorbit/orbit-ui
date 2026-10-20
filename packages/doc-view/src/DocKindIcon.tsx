import {
  ClipboardList,
  File,
  FileText,
  Gavel,
  type LucideIcon,
  Ruler,
  ScanSearch,
  Square,
  SquareCheck,
  SquareMinus,
} from 'lucide-react'
import { type ReactNode, useId } from 'react'

/**
 * The kinds of document the app and the website know: a spec, a decision (an ADR), a plan, an
 * audit, a convention and anything else.
 *
 * The app calls a decision `adr` on the wire (`SddKind`); it maps that name before it draws, so this
 * package needs nothing of the app's protocol.
 */
export type DocKind = 'spec' | 'decision' | 'plan' | 'audit' | 'convention' | 'other'

/** What {@link DocKindIcon} draws: a kind of document, or a step of a plan. */
export type DocIconKind = DocKind | 'step'

/**
 * The category of a status, as the profile of a project sorts its statuses: the
 * same five names as `SddStatusCategory`, spelt out here so the package stands on its own.
 */
export type DocStatusCategory = 'concept' | 'review' | 'active' | 'done' | 'closed'

/** The badge a status category puts on a document; `none` for a closed one and for a step. */
type Badge = 'ring' | 'dot' | 'arc' | 'check' | 'none'

/** A glyph of lucide with the name it carries in `data-glyph`. */
interface Glyph {
  name: string
  icon: LucideIcon
}

/**
 * The glyph of each kind of document (the "paper" family): a sheet with
 * lines for a spec, a gavel for a decision, a clipboard with a list for a plan, a ruler for a
 * convention (a measure agreed on) and a plain sheet for anything else.
 */
const GLYPHS: Readonly<Record<DocKind, Glyph>> = {
  spec: { name: 'file-text', icon: FileText },
  decision: { name: 'gavel', icon: Gavel },
  plan: { name: 'clipboard-list', icon: ClipboardList },
  // A frame with a magnifier: an area looked at closely, finding by finding.
  audit: { name: 'scan-search', icon: ScanSearch },
  convention: { name: 'ruler', icon: Ruler },
  other: { name: 'file', icon: File },
}

const BADGES: Readonly<Record<DocStatusCategory, Badge>> = {
  concept: 'ring',
  review: 'dot',
  active: 'arc',
  done: 'check',
  closed: 'none',
}

/**
 * Where the badge sits and how the glyph makes room for it, per kind, in the 24-unit box of lucide.
 *
 * The sheets and the clipboard give up their lower right corner to the cut-out, as in the mockup.
 * The gavel does not: its head runs diagonally through that corner, so the cut-out bit the face off
 * and the check sat inside what was left of it — too small to read at 14px.
 * So the gavel is drawn a little smaller and up to the left, which leaves the corner empty: the
 * badge sits in free space with a clear gap, and the head stays whole. The ruler lies along the same
 * diagonal, so it turns a quarter and runs from the upper right to the lower left instead.
 */
const PLACES: Readonly<Record<DocKind, { centre: number; glyph?: string }>> = {
  spec: { centre: 19 },
  decision: {
    centre: 19.4,
    glyph: 'translate(-1.2 -1.2) translate(12 12) scale(0.86) translate(-12 -12)',
  },
  plan: { centre: 19 },
  audit: { centre: 19 },
  convention: { centre: 19, glyph: 'rotate(90 12 12)' },
  other: { centre: 19 },
}

/** The radius of the hole cut out of the glyph around a badge: the badge plus a clear gap. */
const CUT = 7.2

/**
 * One badge, in the colour of what it says. A little heavier than the mockup (2.6 and 3 units
 * instead of 2.2 and 2.4, a check of 9 units instead of 7): at 14px one unit is 0.58px, and the
 * mockup's check came out at under four pixels.
 */
function badge(kind: Badge, c: number): ReactNode {
  switch (kind) {
    case 'ring':
      return (
        <circle
          data-nt-doc-badge
          cx={c}
          cy={c}
          r="3.6"
          stroke="var(--nt-text-muted)"
          strokeWidth="2.6"
        />
      )
    case 'dot':
      return (
        <circle data-nt-doc-badge cx={c} cy={c} r="4.6" fill="var(--nt-attention)" stroke="none" />
      )
    case 'arc':
      // A dashed circle rather than a path, so the still arc of reduced motion is the same drawing.
      return (
        <circle
          data-nt-doc-badge
          className="nt-badge-spin"
          cx={c}
          cy={c}
          r="3.6"
          stroke="var(--nt-accent-text)"
          strokeWidth="2.6"
          strokeDasharray="13.6 9"
        />
      )
    case 'check':
      return (
        <path
          data-nt-doc-badge
          d={`M${c - 4.6} ${c + 0.2}l3 3 5.9-6.1`}
          stroke="var(--nt-text-muted)"
          strokeWidth="3"
        />
      )
    case 'none':
      return null
  }
}

/**
 * A step of a plan per category: its box, what stands inside — a dot for a reader, a turning arc
 * for work (the arc of a document at work, still under reduced motion) —
 * and its tone (a class of `doc-view.css`).
 */
const STEPS: Readonly<
  Record<DocStatusCategory, { glyph: Glyph; inner: 'dot' | 'arc' | 'none'; tone: string }>
> = {
  concept: { glyph: { name: 'square', icon: Square }, inner: 'none', tone: '' },
  review: { glyph: { name: 'square', icon: Square }, inner: 'dot', tone: 'nt-doc-icon-attention' },
  active: { glyph: { name: 'square', icon: Square }, inner: 'arc', tone: 'nt-doc-icon-accent' },
  done: {
    glyph: { name: 'square-check', icon: SquareCheck },
    inner: 'none',
    tone: 'nt-doc-icon-done',
  },
  closed: {
    glyph: { name: 'square-minus', icon: SquareMinus },
    inner: 'none',
    tone: 'nt-doc-icon-closed',
  },
}

/** What {@link DocKindIcon} draws. */
export interface DocKindIconProps {
  kind: DocIconKind
  /** The category of its status in the profile of the project. */
  category: DocStatusCategory
  /**
   * The glyph alone, whole and in the colour around it: no badge, no dimmed tone. For a list that
   * draws the kind in its own colour and the status apart, as a shape at the right of the row
   * A step ignores it: its status is its box.
   */
  plain?: boolean
}

/**
 * The kind of a document with its status, in the 14px slot of a row glyph: a sheet with lines for
 * a spec, a gavel for a decision, a clipboard with a list for a plan, a ruler for a convention, a
 * plain sheet for anything else, a box to tick for a step.
 *
 * The status is a small badge in the lower right, cut out of the glyph in the colour behind it: an
 * open ring for a concept, a dot in attention for one that waits for a reader, a turning arc in the
 * accent for work (standing still under reduced motion), a check for done. A closed document has no
 * badge and is dimmed; the row strikes its title through. A step carries its status in the box
 * itself. Its own family, so a document never looks like a chat.
 *
 * Decorative (`aria-hidden`): the row says kind and status in words. Shared by the app and the
 * website, so a decision is the same gavel with the same badge on both.
 *
 */
export function DocKindIcon({ kind, category, plain = false }: DocKindIconProps): ReactNode {
  // A mask needs an id a url(#…) reference reads without escaping.
  const mask = `nt-doc-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`
  const frame = {
    'data-nt-doc-icon': '',
    'data-kind': kind,
    'data-category': category,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (kind === 'step') {
    const step = STEPS[category]
    const Glyph = step.glyph.icon
    return (
      <svg
        aria-hidden="true"
        {...frame}
        data-glyph={step.glyph.name}
        data-badge={step.inner}
        className={step.tone ? `nt-doc-icon ${step.tone}` : 'nt-doc-icon'}
      >
        <Glyph width={24} height={24} strokeWidth={1.75} />
        {step.inner === 'dot' ? (
          <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
        ) : step.inner === 'arc' ? (
          // The dashed circle of the badge of a document at work, the same turn around its middle.
          <circle
            className="nt-badge-spin"
            cx="12"
            cy="12"
            r="4"
            strokeWidth="2.4"
            strokeDasharray="15 10.2"
          />
        ) : null}
      </svg>
    )
  }
  const { name, icon: Glyph } = GLYPHS[kind]
  const place = PLACES[kind]
  const drawn = <Glyph width={24} height={24} strokeWidth={1.75} />
  const glyph = place.glyph ? <g transform={place.glyph}>{drawn}</g> : drawn
  const shown = BADGES[category]
  if (shown === 'none' || plain) {
    return (
      <svg
        aria-hidden="true"
        {...frame}
        data-glyph={name}
        data-badge="none"
        className={plain ? 'nt-doc-icon' : 'nt-doc-icon nt-doc-icon-closed'}
      >
        {glyph}
      </svg>
    )
  }
  return (
    <svg aria-hidden="true" {...frame} data-glyph={name} data-badge={shown} className="nt-doc-icon">
      <mask id={mask}>
        <rect width="24" height="24" fill="white" stroke="none" />
        <circle cx={place.centre} cy={place.centre} r={CUT} fill="black" stroke="none" />
      </mask>
      <g mask={`url(#${mask})`}>{glyph}</g>
      {badge(shown, place.centre)}
    </svg>
  )
}
