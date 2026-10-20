import type { ReactNode } from 'react'
import { Button } from '../primitives/Button'
import { Icon } from '../primitives/Icon'

/** The words of a `SummaryBar`, in the host's language. */
export interface SummaryBarLabels {
  /** The count of files as words: "3 bestanden gewijzigd". */
  files(count: number): string
  /** The lines for a screen reader, where the eye reads the figures: "12 regels erbij, 4 eraf". */
  lines(added: number, removed: number): string
  /** The button that opens the changes: "Bekijk". */
  open: string
}

/** The props of `SummaryBar`. */
export interface SummaryBarProps {
  /** How many files the answer changed. */
  files: number
  /** Lines added and removed, over all of them. */
  added: number
  removed: number
  /** The words of the bar and its counts, in the host's language; the library holds none. */
  labels: SummaryBarLabels
  /** Opens the changes: the tab Wijzigingen of the panel. */
  onOpen(): void
  /**
   * More rows of the same card, each a `SummaryRow`: what else the turn made (Artifacts). They stand
   * under the files row inside the one frame, divided by a hairline, so two facts of one answer are
   * one list and not two cards.
   */
  children?: ReactNode
}

/**
 * One row of a summary card: an icon, a label that may shrink and truncate, optional figures, and
 * on the right the action that opens it. 30px high inside the 1px frame, so a card of one row is
 * 32px on the grid, and rows stack without a spacer between them.
 */
export function SummaryRow({
  icon,
  label,
  figures,
  action,
  ...rest
}: {
  icon: ReactNode
  label: ReactNode
  figures?: ReactNode
  action: ReactNode
  /** A marker attribute for the row, for tests and the e2e (`data-nt-…`). */
  [marker: `data-nt-${string}`]: string | true | undefined
}) {
  return (
    <div
      {...rest}
      data-nt-summary-row
      className="flex h-[30px] min-w-0 items-center gap-2 ps-3 pe-1.5"
    >
      {icon}
      <span className="min-w-0 truncate text-[13px] font-medium text-secondary">{label}</span>
      {figures}
      {/* Pushed right by its own margin rather than by a growing spacer: a spacer that may shrink
          to nothing took all the room from the count in a narrow column, and it vanished whole. */}
      <span className="ms-auto flex shrink-0">{action}</span>
    </div>
  )
}

/**
 * The line under an answer that changed files: "4 bestanden gewijzigd +128 −41 · Bekijk ›".
 *
 * A row of 32px with its border, the radius token: `file-diff`, the count in 13px/500
 * `text-secondary`, the lines added and removed in mono 12px in the colours of a diff, and on the
 * right the button that opens them, muted so the action is never louder than its label. The diff colours stand on the figures only — the one colour in
 * an answer besides the highlighting of code — and never carry the
 * meaning alone: the `+` and the real minus sign say it too. A screen reader hears the lines once,
 * as words; the figures are for the eye.
 *
 * More rows (`children`) stand under it in the same frame: the card of a turn is one list.
 */
export function SummaryBar({ files, added, removed, labels, onOpen, children }: SummaryBarProps) {
  return (
    <div
      data-nt-summary-bar
      className="flex min-w-0 flex-col divide-y divide-border rounded-md border border-border"
    >
      <SummaryRow
        icon={<Icon name="file-diff" size="sm" tone="faint" />}
        label={labels.files(files)}
        figures={
          <>
            <span aria-hidden="true" className="shrink-0 font-mono text-[12px] text-success">
              +{added}
            </span>
            <span aria-hidden="true" className="shrink-0 font-mono text-[12px] text-danger">
              −{removed}
            </span>
            <span className="sr-only">{labels.lines(added, removed)}</span>
          </>
        }
        action={
          <Button variant="quiet" size="sm" onClick={onOpen}>
            {labels.open}
            <Icon name="chevron-right" size="xs" />
          </Button>
        }
      />
      {children}
    </div>
  )
}
