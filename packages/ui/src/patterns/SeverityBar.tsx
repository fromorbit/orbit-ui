import { Icon, type IconName } from '../primitives/Icon'
import { ShareBar, type ShareTone } from '../primitives/ShareBar'

/** How much a finding of a review weighs: it stops the merge, it should be fixed, or a remark. */
export type FindingSeverity = 'blocking' | 'problem' | 'note'

/** The weights from heavy to light: the order of a legend and of a list of findings. */
export const FINDING_SEVERITIES: readonly FindingSeverity[] = ['blocking', 'problem', 'note']

/**
 * The colour and the sign of each weight, shared by `SeverityBar` and `FindingCard` so a weight
 * looks the same in the count and on the card. The sign is there so colour is never the only cue.
 */
export const SEVERITY_SIGN: Readonly<
  Record<FindingSeverity, { readonly tone: ShareTone; readonly icon: IconName }>
> = {
  blocking: { tone: 'danger', icon: 'octagon-alert' },
  problem: { tone: 'attention', icon: 'alert-triangle' },
  note: { tone: 'neutral', icon: 'message-square' },
}

/**
 * How much each weight counts in the bar: one blocking finding weighs on a merge as much as four
 * remarks, so the heaviest share is never the thinnest (Von Restorff). Only the bar; the words
 * keep the real counts.
 */
const BAR_WEIGHT: Readonly<Record<FindingSeverity, number>> = { blocking: 4, problem: 2, note: 1 }

/** The words of `SeverityBar`: a count per weight, and the line when there is nothing. */
export interface SeverityBarLabels {
  /** "1 blokkade", "2 blokkades". */
  blocking: (count: number) => string
  /** "1 probleem", "3 problemen". */
  problem: (count: number) => string
  /** "1 opmerking", "4 opmerkingen". */
  note: (count: number) => string
  /** The line when every count is zero: "Geen bevindingen; niets houdt de merge tegen". */
  none: string
}

/** The props of `SeverityBar`. */
export interface SeverityBarProps {
  /** The name of the legend for a screen reader: "Bevindingen naar ernst". */
  label: string
  /** How many findings of each weight; a weight left out counts as zero. */
  counts: Readonly<Partial<Record<FindingSeverity, number>>>
  labels: SeverityBarLabels
}

/**
 * The findings of a review counted per weight: the words with their signs, in the colour of the
 * weight, and one bar that shows how much each weight weighs, heavy to light.
 *
 * A `ShareBar` with the weights filled in, so the review screen and its card agree on colour and
 * sign (`SEVERITY_SIGN`). A weight of zero is left out. The bar weighs a blocking finding four
 * times and a problem twice (`BAR_WEIGHT`), so one blocker never looks lighter than one remark;
 * with only remarks there is no bar, only the words. With no findings at all it is one calm line
 * with a check, the good end of a review. A `status` region, so a finding that turns up while a
 * review runs is announced.
 */
export function SeverityBar({ label, counts, labels }: SeverityBarProps) {
  const segments = FINDING_SEVERITIES.map((severity) => {
    const count = counts[severity] ?? 0
    return {
      id: severity,
      label: labels[severity](count),
      value: count * BAR_WEIGHT[severity],
      ...SEVERITY_SIGN[severity],
    }
  })
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const onlyNotes = total > 0 && (counts.blocking ?? 0) === 0 && (counts.problem ?? 0) === 0
  return (
    <div role="status" data-nt-severity-bar className="min-w-0">
      {total === 0 ? (
        <p className="m-0 flex items-center gap-1.5 text-[12px] text-secondary">
          <span className="text-success">
            <Icon name="check-circle" size="sm" />
          </span>
          {labels.none}
        </p>
      ) : (
        <ShareBar label={label} segments={segments} hideBar={onlyNotes} />
      )}
    </div>
  )
}
