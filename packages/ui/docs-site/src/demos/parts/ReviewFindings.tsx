import { type ReactNode, useId, useState } from 'react'
import { Button, Dialog, FindingCard, type FindingSeverity, SeverityBar } from '../../../../src'
import { galleryLabels } from '../../../../src/gallery'

/** One finding: what the agent saw, where, and the screenshot it took, if any. */
export interface Finding {
  severity: FindingSeverity
  title: string
  detail: string
  /** The page of the shop it happened on. */
  url?: string
  /** The step of the recording (of 23) where the agent saw it. */
  step: number
  /** A screenshot, drawn here as a small sketch of what it shows. */
  screenshot?: 'fout' | 'klein'
}

/** The words a screen reader hears for each screenshot. */
const SHOT_NAME = {
  fout: 'foutmelding op de kassa',
  klein: 'klein totaalbedrag',
} as const

/**
 * A screenshot of the shop as a small drawing: the checkout, with what went wrong on it. A tint
 * against the card, no frame. `large` is the same drawing in the dialog of the recording.
 */
function Sketch({ kind, large = false }: { kind: 'fout' | 'klein'; large?: boolean }): ReactNode {
  const bar = large ? 'h-2' : 'h-1.5'
  return (
    <span
      aria-hidden="true"
      className={`flex size-full flex-col overflow-hidden rounded-md bg-canvas ${large ? 'gap-3 p-5' : 'gap-1.5 p-2'}`}
    >
      <span className="flex w-full items-center gap-1">
        <span className="size-1 rounded-full bg-border-strong" />
        <span className="size-1 rounded-full bg-border-strong" />
        <span className="size-1 rounded-full bg-border-strong" />
        <span className={`ml-1 flex-1 rounded-full bg-surface-active ${bar}`} />
      </span>
      <span className={`w-1/3 rounded-full bg-border-strong ${bar}`} />
      {kind === 'fout' ? (
        <span
          className={`flex w-full flex-1 flex-col justify-center rounded-sm bg-danger/12 ${large ? 'gap-2 px-4' : 'gap-1 px-1.5'}`}
        >
          <span className={`w-1/2 rounded-full bg-danger ${large ? 'h-1.5' : 'h-1'}`} />
          <span className={`w-2/3 rounded-full bg-danger/50 ${large ? 'h-1.5' : 'h-1'}`} />
        </span>
      ) : (
        <span className={`flex w-full flex-1 flex-col ${large ? 'gap-3' : 'gap-1.5'}`}>
          <span className={`w-full rounded-sm bg-surface-active ${large ? 'h-6' : 'h-3'}`} />
          {/* The total itself: a short line, ringed where the agent saw it too small. */}
          <span className="flex items-center gap-1.5">
            <span className={`w-1/4 rounded-full bg-border-strong ${bar}`} />
            <span className="rounded-sm p-0.5 outline-1 outline-attention outline-solid">
              <span className={`block rounded-full bg-fg/50 ${large ? 'h-1 w-8' : 'h-0.5 w-4'}`} />
            </span>
          </span>
          <span
            className={`mt-auto w-2/5 self-end rounded-sm bg-border-strong ${large ? 'h-5' : 'h-2.5'}`}
          />
        </span>
      )}
    </span>
  )
}

/**
 * The thumbnail of a finding, a button that opens the recording at its screenshot. Beside the words
 * it is 144×96; under them, on a narrow card, it fills their column (the card is the container).
 */
function Shot({ kind, onOpen }: { kind: 'fout' | 'klein'; onOpen(): void }): ReactNode {
  return (
    <button
      type="button"
      aria-label={`Open schermafbeelding: ${SHOT_NAME[kind]}`}
      onClick={onOpen}
      className="block aspect-[3/2] w-full max-w-80 rounded-md text-left outline-focus transition-[filter] duration-(--nt-duration-fast) hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 @lg:aspect-auto @lg:h-24 @lg:w-36"
    >
      <Sketch kind={kind} />
    </button>
  )
}

/**
 * The findings of the review as one group: the count in the heading, the count per weight, and
 * the cards heavy to light, 8px apart. Each card opens the recording at its step, the thumbnail as
 * well as the quiet "Bekijk in opname", in a dialog that hands the focus back when it closes.
 */
export function ReviewFindings({ findings }: { findings: readonly Finding[] }): ReactNode {
  const headingId = useId()
  // The finding stays while the dialog fades out, so its title does not empty on the way.
  const [opened, setOpened] = useState<Finding | null>(null)
  const [open, setOpen] = useState(false)
  const show = (finding: Finding) => {
    setOpened(finding)
    setOpen(true)
  }
  const counts = {
    blocking: findings.filter((finding) => finding.severity === 'blocking').length,
    problem: findings.filter((finding) => finding.severity === 'problem').length,
    note: findings.filter((finding) => finding.severity === 'note').length,
  }
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-2">
      <h3 id={headingId} className="m-0 font-medium text-[13px] text-fg leading-5">
        {findings.length === 1 ? '1 bevinding' : `${findings.length} bevindingen`}
      </h3>
      <SeverityBar label="Bevindingen naar ernst" counts={counts} labels={galleryLabels.severity} />
      {findings.map((finding) => (
        <FindingCard
          key={finding.title}
          severity={finding.severity}
          severityLabel={galleryLabels.severityWord[finding.severity]}
          title={finding.title}
          headingLevel={4}
          {...(finding.url === undefined ? {} : { location: finding.url, locationLabel: 'pagina' })}
          {...(finding.screenshot === undefined
            ? {}
            : { media: <Shot kind={finding.screenshot} onOpen={() => show(finding)} /> })}
          actions={
            // Pulled out by the button's own padding, so a quiet one lines up with the words.
            <span className="-ms-2.5 flex">
              <Button
                variant="quiet"
                size="sm"
                aria-label={`Bekijk in opname: ${finding.title}`}
                onClick={() => show(finding)}
              >
                Bekijk in opname
              </Button>
            </span>
          }
        >
          {finding.detail}
        </FindingCard>
      ))}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={opened?.title ?? ''}
        description={`Stap ${opened?.step ?? 0} van 23${opened?.url === undefined ? '' : ` · pagina ${opened.url}`}`}
        closeLabel="Sluiten"
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Sluiten
          </Button>
        }
      >
        {opened?.screenshot === undefined ? (
          <p className="m-0 text-[13px] text-secondary leading-5">
            Bij deze stap nam de agent geen schermafbeelding; de opname toont wat hij deed.
          </p>
        ) : (
          <span
            role="img"
            aria-label={`Schermafbeelding: ${SHOT_NAME[opened.screenshot]}`}
            className="block aspect-[3/2] w-full"
          >
            <Sketch kind={opened.screenshot} large />
          </span>
        )}
      </Dialog>
    </section>
  )
}
