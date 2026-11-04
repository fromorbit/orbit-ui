import { type ReactNode, useId } from 'react'
import { FindingCard, type FindingSeverity, SeverityBar } from '../../../../src'
import { galleryLabels } from '../../../../src/gallery'

/** One finding: what the agent saw, where, and the screenshot it took, if any. */
export interface Finding {
  severity: FindingSeverity
  title: string
  detail: string
  /** The page of the shop it happened on. */
  url?: string
  /** A screenshot, drawn here as a small sketch of what it shows. */
  screenshot?: 'fout' | 'klein'
}

/**
 * A screenshot of the shop as a small drawing that opens large: the checkout, with what went
 * wrong on it. A tint against the card, no frame.
 */
function Shot({ kind }: { kind: 'fout' | 'klein' }): ReactNode {
  return (
    <button
      type="button"
      aria-label={
        kind === 'fout'
          ? 'Open schermafbeelding: foutmelding op de kassa'
          : 'Open schermafbeelding: klein totaalbedrag'
      }
      className="flex h-24 w-36 flex-col gap-1.5 overflow-hidden rounded-md bg-canvas p-2 text-left outline-focus transition-[filter] duration-(--nt-duration-fast) hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <span aria-hidden="true" className="flex w-full items-center gap-1">
        <span className="size-1 rounded-full bg-border-strong" />
        <span className="size-1 rounded-full bg-border-strong" />
        <span className="size-1 rounded-full bg-border-strong" />
        <span className="ml-1 h-1.5 flex-1 rounded-full bg-surface-active" />
      </span>
      <span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-border-strong" />
      {kind === 'fout' ? (
        <span
          aria-hidden="true"
          className="flex w-full flex-1 flex-col justify-center gap-1 rounded-sm bg-danger-subtle px-1.5"
        >
          <span className="h-1 w-16 rounded-full bg-danger" />
          <span className="h-1 w-20 rounded-full bg-danger/50" />
        </span>
      ) : (
        <span aria-hidden="true" className="flex w-full flex-1 flex-col justify-end gap-1.5">
          <span className="h-3 rounded-sm bg-surface-active" />
          <span className="h-0.5 w-6 self-end rounded-full bg-attention outline outline-attention outline-offset-2" />
        </span>
      )}
    </button>
  )
}

/**
 * The findings of the review as one group: a heading with the count, the count per weight, and
 * the cards heavy to light.
 */
export function ReviewFindings({ findings }: { findings: readonly Finding[] }): ReactNode {
  const headingId = useId()
  const counts = {
    blocking: findings.filter((finding) => finding.severity === 'blocking').length,
    problem: findings.filter((finding) => finding.severity === 'problem').length,
    note: findings.filter((finding) => finding.severity === 'note').length,
  }
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-2">
        <h3
          id={headingId}
          className="m-0 flex items-baseline gap-2 font-medium text-[13px] text-fg"
        >
          Bevindingen
          <span className="font-normal text-[12px] text-muted tabular-nums">{findings.length}</span>
        </h3>
        <SeverityBar
          label="Bevindingen per gewicht"
          counts={counts}
          labels={galleryLabels.severity}
        />
      </div>
      {findings.length === 0 ? null : (
        <div className="flex flex-col gap-2">
          {findings.map((finding) => (
            <FindingCard
              key={finding.title}
              severity={finding.severity}
              severityLabel={galleryLabels.severityWord[finding.severity]}
              title={finding.title}
              headingLevel={4}
              {...(finding.url === undefined ? {} : { location: finding.url })}
              {...(finding.screenshot === undefined
                ? {}
                : { media: <Shot kind={finding.screenshot} /> })}
            >
              {finding.detail}
            </FindingCard>
          ))}
        </div>
      )}
    </section>
  )
}
