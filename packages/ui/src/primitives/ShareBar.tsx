import { Icon, type IconName } from './Icon'

/** The colour of one share: a status, or neutral. */
export type ShareTone = 'danger' | 'attention' | 'success' | 'neutral'

/** One share of a `ShareBar`. */
export interface ShareBarSegment {
  id: string
  /** The words in the legend, count included: "2 blokkerend". */
  label: string
  value: number
  tone: ShareTone
  /** A sign before the words, so the colour is never the only cue: `octagon-alert`. */
  icon?: IconName
}

/** The props of `ShareBar`. */
export interface ShareBarProps {
  /** The name of the whole: "Bevindingen". */
  label: string
  segments: readonly ShareBarSegment[]
  /** Leaves the legend out, for a caller that writes the words itself. */
  hideLegend?: boolean
}

// Written out per tone: Tailwind finds a class only as a literal in the source.
const FILL: Record<ShareTone, string> = {
  danger: 'bg-danger',
  attention: 'bg-attention',
  success: 'bg-success',
  neutral: 'bg-border-strong',
}
const INK: Record<ShareTone, string> = {
  danger: 'text-danger',
  attention: 'text-attention',
  success: 'text-success',
  neutral: 'text-muted',
}

/**
 * How a whole splits into parts, as words and as one shared bar: findings per weight, tests per
 * outcome, spaces per state.
 *
 * The legend carries the numbers in words and is what a screen reader reads, as a list named by
 * `label`; the bar only draws the proportions and is hidden from it. A share of zero is left out
 * of both. Each part is a status colour and, with `icon`, a sign, so colour is never the only cue.
 */
export function ShareBar({ label, segments, hideLegend = false }: ShareBarProps) {
  const shown = segments.filter((segment) => segment.value > 0)
  return (
    <div data-nt-share-bar className="flex min-w-0 flex-col gap-2">
      {hideLegend ? null : (
        <ul
          aria-label={label}
          className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-[12px]"
        >
          {shown.map((segment) => (
            <li key={segment.id} className="flex items-center gap-1.5">
              {segment.icon ? (
                <span className={INK[segment.tone]}>
                  <Icon name={segment.icon} size="sm" />
                </span>
              ) : (
                <span aria-hidden="true" className={`size-2 rounded-full ${FILL[segment.tone]}`} />
              )}
              <span className="text-secondary">{segment.label}</span>
            </li>
          ))}
        </ul>
      )}
      <div aria-hidden="true" className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-mark">
        {shown.map((segment) => (
          <span
            key={segment.id}
            data-nt-share={segment.id}
            className={FILL[segment.tone]}
            // The one value no class can hold: the share itself.
            style={{ flexGrow: segment.value }}
          />
        ))}
      </div>
    </div>
  )
}
