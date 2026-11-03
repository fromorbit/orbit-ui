import type { ReactNode } from 'react'
import { Icon, type IconName } from '../../../../src'
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
  { one: string; many: string; edge: string; text: string; bar: string; icon: IconName }
> = {
  blocking: {
    one: 'blokkerend',
    many: 'blokkerend',
    edge: 'border-l-danger',
    text: 'text-danger',
    bar: 'bg-danger',
    icon: 'octagon-alert',
  },
  problem: {
    one: 'probleem',
    many: 'problemen',
    edge: 'border-l-attention',
    text: 'text-attention',
    bar: 'bg-attention',
    icon: 'alert-triangle',
  },
  note: {
    one: 'opmerking',
    many: 'opmerkingen',
    edge: 'border-l-border-strong',
    text: 'text-muted',
    bar: 'bg-border-strong',
    icon: 'message-square',
  },
}

const ORDER: Severity[] = ['blocking', 'problem', 'note']

/**
 * The band above the findings: how many there are per weight, as words and as one bar, drawn as
 * the missing `SeverityBar`.
 */
export function SeverityBand({ findings }: { findings: readonly Finding[] }): ReactNode {
  const counts = ORDER.map((severity) => ({
    severity,
    count: findings.filter((finding) => finding.severity === severity).length,
  })).filter((entry) => entry.count > 0)
  return (
    <Missing name="SeverityBar">
      <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-overlay px-4 py-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="m-0 font-medium text-[13px] text-fg">Bevindingen</h3>
          <p className="m-0 flex flex-wrap justify-end gap-x-3 text-[12.5px]">
            {counts.map(({ severity, count }) => (
              <span key={severity} className="flex items-center gap-1.5">
                <span className={WEIGHT[severity].text}>
                  <Icon name={WEIGHT[severity].icon} size="sm" />
                </span>
                <span className="text-secondary">
                  {`${count} ${count === 1 ? WEIGHT[severity].one : WEIGHT[severity].many}`}
                </span>
              </span>
            ))}
          </p>
        </div>
        <div aria-hidden="true" className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
          {counts.map(({ severity, count }) => (
            <span key={severity} className={WEIGHT[severity].bar} style={{ flexGrow: count }} />
          ))}
        </div>
      </div>
    </Missing>
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
 * One finding as a card, drawn as the missing `FindingCard`: the weight as an edge and a word,
 * the title, what the agent saw, the page, and the screenshot beside it.
 */
export function ReviewFinding({ finding }: { finding: Finding }): ReactNode {
  const weight = WEIGHT[finding.severity]
  return (
    <Missing name="FindingCard">
      <article
        className={`flex gap-4 rounded-xl border border-border border-l-[3px] bg-overlay px-4 py-3.5 ${weight.edge}`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p
            className={`m-0 flex items-center gap-1.5 font-medium text-[11.5px] uppercase tracking-[0.06em] ${weight.text}`}
          >
            <Icon name={weight.icon} size="sm" />
            {weight.one}
          </p>
          <h4 className="m-0 font-medium text-[14px] text-fg">{finding.title}</h4>
          <p className="m-0 text-[13px] text-secondary leading-relaxed">{finding.detail}</p>
          {finding.url === undefined ? null : (
            <p className="m-0 mt-0.5 font-mono text-[11.5px] text-muted">{finding.url}</p>
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
