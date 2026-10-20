import { useId } from 'react'
import { Icon, type IconName } from './Icon'
import { Tag } from './Tag'

/** The props of `CiteRow`. */
export interface CiteRowProps {
  /** The words of the row, already translated or written by the agent. */
  label: string
  /** A quiet line under the words ("Anders: …", "14 criteria"); part of the row's description. */
  description?: string
  /** A glyph before the words; decoration, since the words carry the row. */
  icon?: IconName
  /** The tone of the glyph: a check that holds, something that needs attention, or quiet. */
  tone?: 'muted' | 'success' | 'attention'
  /** A tag after the words, already translated ("Impact hoog"): the one thing to notice. */
  tag?: string
  /** A hairline around the row, for a row that is an item of its own (a choice). */
  framed?: boolean
  /** Shows its place in the text; left out, the row is text only and no button. */
  onJump?: (() => void) | undefined
}

/** The colour of the glyph per tone. */
const TONE = {
  muted: 'text-muted',
  success: 'text-success',
  attention: 'text-attention',
} as const

/**
 * A row that points at its place in a text: a glyph, one or more lines of words, a quiet line
 * under them, and on hover or focus an arrow that says it jumps. The rows of the Briefing in the
 * tab Review: a click lights the quoted block beside it and scrolls to it.
 *
 * Its own control rather than `Button`, which has a fixed height and one line: these rows wrap,
 * as a sentence of a summary does. Without `onJump` it draws the same row as text, so a row whose
 * quote the text no longer holds reads the same and simply does not move.
 */
export function CiteRow({
  label,
  description,
  icon,
  tone = 'muted',
  tag,
  framed = false,
  onJump,
}: CiteRowProps) {
  const descriptionId = useId()
  const labelId = useId()
  const tagId = useId()
  const body = (
    <>
      {icon ? (
        <span className={`flex h-5 w-4 shrink-0 items-center justify-center ${TONE[tone]}`}>
          <Icon name={icon} size="sm" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span id={labelId} className={`min-w-0 flex-1 ${framed ? 'font-medium' : ''}`}>
            {label}
          </span>
          {tag ? (
            <span id={tagId} className="shrink-0">
              <Tag tone="attention">{tag}</Tag>
            </span>
          ) : null}
        </span>
        {description ? (
          <span id={descriptionId} className="block text-[12px] text-muted">
            {description}
          </span>
        ) : null}
      </span>
      {onJump ? (
        <span
          aria-hidden="true"
          className="flex h-5 shrink-0 items-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <Icon name="arrow-up-right" size="xs" tone="faint" />
        </span>
      ) : null}
    </>
  )
  const shape = framed
    ? 'rounded-md border border-border px-2.5 py-2 hover:border-border-strong'
    : 'rounded-md px-2 py-[5px] hover:bg-row-hover'
  if (!onJump) {
    return (
      <div
        className={`flex w-full items-start gap-2 text-[13px] text-fg ${framed ? 'rounded-md border border-border px-2.5 py-2' : 'px-2 py-[5px]'}`}
      >
        {body}
      </div>
    )
  }
  return (
    <button
      type="button"
      aria-labelledby={tag ? `${labelId} ${tagId}` : labelId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={onJump}
      className={`group no-drag flex w-full items-start gap-2 text-left text-[13px] text-fg outline-focus transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${shape}`}
    >
      {body}
    </button>
  )
}
