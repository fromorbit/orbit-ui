import type { ReactNode } from 'react'
import { Icon, type IconName, ShareBar, type ShareTone } from '../../../../src'
import { Missing } from '../../demo-kit/Missing'

/** How much a finding of the review agent weighs. */
export type Severity = 'blocking' | 'problem' | 'note'

/** One finding: what the agent saw, where, and the screenshot it took, if any. */
export interface Finding {
  severity: Severity
  title: string
  detail: string
  /** The page of the shop it happened on. */
  url?: string
  /** A screenshot, drawn here as a small sketch of what it shows. */
  screenshot?: 'fout' | 'klein'
}

/** The word, colours and glyph of each weight; a finding is never told apart by colour alone. */
const WEIGHT: Record<
  Severity,
  {
    one: string
    many: string
    text: string
    tone: ShareTone
    icon: IconName
  }
> = {
  blocking: {
    one: 'blokkerend',
    many: 'blokkerend',
    text: 'text-danger',
    tone: 'danger',
    icon: 'octagon-alert',
  },
  problem: {
    one: 'probleem',
    many: 'problemen',
    text: 'text-attention',
    tone: 'attention',
    icon: 'alert-triangle',
  },
  note: {
    one: 'opmerking',
    many: 'opmerkingen',
    text: 'text-muted',
    tone: 'neutral',
    icon: 'message-square',
  },
}

const ORDER: Severity[] = ['blocking', 'problem', 'note']

/** The band above the findings: how many there are per weight, as words and as one bar. */
export function SeverityBand({ findings }: { findings: readonly Finding[] }): ReactNode {
  const segments = ORDER.map((severity) => {
    const count = findings.filter((finding) => finding.severity === severity).length
    const weight = WEIGHT[severity]
    return {
      id: severity,
      label: `${count} ${count === 1 ? weight.one : weight.many}`,
      value: count,
      tone: weight.tone,
      icon: weight.icon,
    }
  })
  return (
    <div className="flex flex-col gap-2.5 rounded-lg bg-overlay px-4 py-3.5">
      <h3 className="m-0 font-medium text-[13px] text-fg">Bevindingen</h3>
      <ShareBar label="Bevindingen per gewicht" segments={segments} />
    </div>
  )
}

/** A screenshot of the shop as a small drawing: the checkout, with what went wrong on it. */
function Shot({ kind }: { kind: 'fout' | 'klein' }): ReactNode {
  return (
    <div
      role="img"
      aria-label={
        kind === 'fout'
          ? 'Schermafbeelding: foutmelding op de kassa'
          : 'Schermafbeelding: klein totaalbedrag'
      }
      className="flex h-24 w-36 shrink-0 flex-col gap-1.5 overflow-hidden rounded-md border border-border bg-canvas p-2"
    >
      <div className="flex items-center gap-1">
        <span className="size-1 rounded-full bg-border-strong" />
        <span className="size-1 rounded-full bg-border-strong" />
        <span className="size-1 rounded-full bg-border-strong" />
        <span className="ml-1 h-1.5 flex-1 rounded-full bg-surface-active" />
      </div>
      <span className="h-1.5 w-12 rounded-full bg-border-strong" />
      {kind === 'fout' ? (
        <span className="flex flex-1 flex-col justify-center gap-1 rounded border border-danger-border bg-danger-subtle px-1.5">
          <span className="h-1 w-16 rounded-full bg-danger" />
          <span className="h-1 w-20 rounded-full bg-danger/50" />
        </span>
      ) : (
        <span className="flex flex-1 flex-col justify-end gap-1">
          <span className="h-3 rounded border border-border bg-surface" />
          <span className="h-0.5 w-6 self-end rounded-full bg-attention outline outline-attention outline-offset-2" />
        </span>
      )}
    </div>
  )
}

/**
 * One finding as a card, drawn as the missing `FindingCard`: the weight as a sign and a word,
 * the title, what the agent saw, the page, and the screenshot beside it.
 */
export function ReviewFinding({ finding }: { finding: Finding }): ReactNode {
  const weight = WEIGHT[finding.severity]
  return (
    <Missing name="FindingCard">
      <article className="flex gap-4 rounded-lg bg-overlay px-4 py-3.5">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className={`m-0 flex items-center gap-1.5 font-medium text-[12px] ${weight.text}`}>
            <Icon name={weight.icon} size="sm" />
            {weight.one}
          </p>
          <h4 className="m-0 font-medium text-[13px] text-fg">{finding.title}</h4>
          <p className="m-0 text-[13px] text-secondary leading-relaxed">{finding.detail}</p>
          {finding.url === undefined ? null : (
            <p className="m-0 mt-0.5 font-mono text-[11px] text-muted">{finding.url}</p>
          )}
        </div>
        {finding.screenshot === undefined ? null : (
          <div className="hidden @2xl:block">
            <Shot kind={finding.screenshot} />
          </div>
        )}
      </article>
    </Missing>
  )
}
