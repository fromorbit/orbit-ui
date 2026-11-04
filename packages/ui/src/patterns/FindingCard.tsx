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
  /** The word of the weight, beside its sign: "Blokkade". It also opens the card's name. */
  severityLabel: string
  /** What is wrong, in a few words: "Betalen met iDEAL loopt vast". */
  title: string
  /**
   * Where it happened: a page ("/kassa") or a file and line ("src/auth/login.ts:42"); drawn in
   * mono. A long one is cut in the middle, so the file and its line stay in sight; the whole of it
   * is the title of the line.
   */
  location?: string
  /** A quiet word before the place that says what it is: "pagina", "bestand". */
  locationLabel?: string
  /** The level of the title in the outline of the page; 3 under a section heading by default. */
  headingLevel?: 2 | 3 | 4
  /** What the reviewer saw, in a sentence or two. */
  children?: ReactNode
  /**
   * A screenshot or other image beside the words: a `Thumbnail`, a small drawing. While the card
   * is narrow it stands under the words; an image that should then fill the column of the words
   * sizes itself with a container query (`w-full @lg:w-36`), the card being the container.
   */
  media?: ReactNode
  /**
   * A small row of quiet buttons under the words ("Bekijk in opname"), as `size="sm"` buttons:
   * the card raises them to the 32px control while it is narrow and to 40px on a touch screen.
   */
  actions?: ReactNode
}

/** A place split before its last segment, so the head can be cut and the file and line stay. */
function splitPlace(place: string): { head: string; tail: string } {
  const cut = place.lastIndexOf('/')
  return cut <= 0
    ? { head: '', tail: place }
    : { head: place.slice(0, cut + 1), tail: place.slice(cut + 1) }
}

/**
 * One finding of a review as a card: the weight as a sign and a word, the title, where it
 * happened, what was seen, and an image beside it.
 *
 * An `<article>` named by its weight and its title ("Blokkade: Betalen met iDEAL loopt vast") and
 * described by its place, on the plane of a card (`bg-overlay`, 12px, no frame), so a list of
 * findings reads as a column of cards a screen reader can jump through and hears the weight first.
 * A row-like card: its title is the 13px/500 of a row, not the 15px/600 of a card that stands on
 * its own, because findings come in a column and are scanned as one. The sign of the weight stands
 * in a column of its own beside the title and takes the colour of `SeverityBar`, so the count above
 * and the cards below agree; the word beside the place says it again, so colour is never the only
 * cue. Title and meta are one chunk (4px apart), the words of the finding 12px under them on a
 * 20px line, the actions 12px under those (under the image while the card is narrow). Long words break anywhere rather than run out of the card. The image stands at the
 * right while the card is wide enough and under the words, in line with them, when it is not (a
 * container query on the card itself).
 */
export function FindingCard({
  severity,
  severityLabel,
  title,
  location,
  locationLabel,
  headingLevel = 3,
  children,
  media,
  actions,
}: FindingCardProps) {
  const titleId = useId()
  const weightId = useId()
  const placeId = useId()
  const sign = SEVERITY_SIGN[severity]
  const Heading = headingLevel === 2 ? 'h2' : headingLevel === 4 ? 'h4' : 'h3'
  const place = location === undefined ? null : splitPlace(location)
  return (
    <article
      aria-labelledby={`${weightId} ${titleId}`}
      {...(place === null ? {} : { 'aria-describedby': placeId })}
      data-nt-finding-card
      data-severity={severity}
      className="@container min-w-0 rounded-lg bg-overlay"
    >
      <span id={weightId} hidden>{`${severityLabel}:`}</span>
      <div className="grid grid-cols-1 gap-3 p-4 @lg:grid-cols-[minmax(0,1fr)_auto] @lg:gap-x-6">
        <div className="flex min-w-0 gap-3 @lg:col-start-1">
          <span className={`flex h-5 shrink-0 items-center ${INK[sign.tone]}`}>
            <Icon name={sign.icon} size="sm" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Heading
              id={titleId}
              className="m-0 font-medium text-[13px] text-fg leading-5 wrap-anywhere"
            >
              {title}
            </Heading>
            <p className="m-0 flex min-w-0 items-baseline gap-x-1.5 text-[12px] leading-4">
              <span className={`shrink-0 ${INK[sign.tone]}`}>{severityLabel}</span>
              {place === null ? null : (
                <>
                  <span aria-hidden="true" className="shrink-0 text-muted">
                    ·
                  </span>
                  <span
                    id={placeId}
                    title={location}
                    className="flex min-w-0 items-baseline gap-x-1 text-muted"
                  >
                    {locationLabel === undefined ? null : (
                      <span className="shrink-0">{locationLabel}</span>
                    )}
                    <span className="flex min-w-0 font-mono text-[11px] tracking-[-0.01em]">
                      {place.head === '' ? null : (
                        <span className="min-w-0 truncate">{place.head}</span>
                      )}
                      <span className="shrink-0">{place.tail}</span>
                    </span>
                  </span>
                </>
              )}
            </p>
            {children === undefined ? null : (
              <div className="mt-2 text-[13px] text-secondary leading-5 wrap-anywhere">
                {children}
              </div>
            )}
          </div>
        </div>
        {media === undefined ? null : (
          <div className="pl-7 @lg:col-start-2 @lg:row-span-2 @lg:row-start-1 @lg:pl-0">
            {media}
          </div>
        )}
        {actions === undefined ? null : (
          // Under the image on a narrow card, so the words and their picture stay one block.
          <div className="flex flex-wrap items-center gap-2 pl-7 @lg:col-start-1 @max-lg:[&_button]:h-(--nt-control-md) pointer-coarse:[&_button]:h-(--nt-control-lg)">
            {actions}
          </div>
        )}
      </div>
    </article>
  )
}
