import { type ReactNode, useId } from 'react'
import { Icon } from '../primitives/Icon'
import type { ShareTone } from '../primitives/ShareBar'
import { type FindingSeverity, SEVERITY_SIGN } from './SeverityBar'

// Written out per tone: Tailwind finds a class only as a literal in the source.
const INK: Record<ShareTone, string> = {
  danger: 'text-danger',
  attention: 'text-attention',
  success: 'text-success',
  neutral: 'text-muted',
}

/** The props of `FindingCard`. */
export interface FindingCardProps {
  severity: FindingSeverity
  /** The word of the weight, beside its sign: "Blokkerend". */
  severityLabel: string
  /** What is wrong, in a few words: "Betalen met iDEAL loopt vast". */
  title: string
  /** Where it happened: a page ("/kassa") or a file and line; drawn in mono. */
  location?: string
  /** The level of the title in the outline of the page; 3 under a section heading by default. */
  headingLevel?: 2 | 3 | 4
  /** What the reviewer saw, in a sentence or two. */
  children?: ReactNode
  /** A screenshot or other image beside the words: a `Thumbnail`, a small drawing. */
  media?: ReactNode
  /** A small row of quiet buttons under the words: "Bekijk in opname". */
  actions?: ReactNode
}

/**
 * One finding of a review as a card: the weight as a sign and a word, the title, where it
 * happened, what was seen, and an image beside it.
 *
 * An `<article>` named by its title, on the plane of a card (`bg-overlay`, 12px, no frame), so a
 * list of findings reads as a column of cards a screen reader can jump through. The sign of the
 * weight stands in a column of its own beside the title and takes the colour of `SeverityBar`, so
 * the count above and the cards below agree; the word beside the place says it again, so colour
 * is never the only cue. The image stands at the right while the card is wide enough and under the
 * words, in line with them, when it is not (a container query on the card itself).
 */
export function FindingCard({
  severity,
  severityLabel,
  title,
  location,
  headingLevel = 3,
  children,
  media,
  actions,
}: FindingCardProps) {
  const titleId = useId()
  const sign = SEVERITY_SIGN[severity]
  const Heading = headingLevel === 2 ? 'h2' : headingLevel === 4 ? 'h4' : 'h3'
  return (
    <article
      aria-labelledby={titleId}
      data-nt-finding-card
      data-severity={severity}
      className="@container min-w-0 rounded-lg bg-overlay"
    >
      <div className="flex flex-col gap-3 p-4 @lg:flex-row @lg:gap-6">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className={`flex h-5 shrink-0 items-center ${INK[sign.tone]}`}>
            <Icon name={sign.icon} size="sm" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Heading id={titleId} className="m-0 font-medium text-[13px] text-fg leading-5">
              {title}
            </Heading>
            <p className="m-0 flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-[12px] leading-4">
              <span className={INK[sign.tone]}>{severityLabel}</span>
              {location === undefined ? null : (
                <>
                  <span aria-hidden="true" className="text-muted">
                    ·
                  </span>
                  <span className="min-w-0 truncate font-mono text-[11px] text-muted">
                    {location}
                  </span>
                </>
              )}
            </p>
            {children === undefined ? null : (
              <div className="mt-1 text-[13px] text-secondary leading-relaxed">{children}</div>
            )}
            {actions === undefined ? null : (
              <div className="mt-2 flex flex-wrap items-center gap-2">{actions}</div>
            )}
          </div>
        </div>
        {media === undefined ? null : <div className="shrink-0 pl-7 @lg:pl-0">{media}</div>}
      </div>
    </article>
  )
}
