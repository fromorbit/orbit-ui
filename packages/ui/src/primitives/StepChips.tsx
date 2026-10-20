import { Icon } from './Icon'

/** One step of a `StepChips` row. */
export interface StepChip {
  id: string
  /** The short name on the chip: the header of a question. */
  label: string
  /** `done` draws a check, `skipped` a dash; absent while the step is open. */
  state?: 'done' | 'skipped'
  /**
   * What the state says to a screen reader, already translated ("beantwoord"); the glyph says it
   * on screen. A prop, because this primitive does not know the catalogue.
   */
  stateLabel?: string
}

/** The props of `StepChips`. */
export interface StepChipsProps {
  /** Accessible name of the row ("Vragen"). */
  label: string
  steps: readonly StepChip[]
  selected: string
  onSelect(id: string): void
  /** The id of the panel the chips switch, for `aria-controls`. */
  controls?: string
}

/**
 * A row of small chips, one per step of a form, as tabs: the question card's questions, after the
 * chips Claude Code draws above its questions.
 *
 * A `tablist` with one tab stop — the selected chip — and a click to switch; which key walks the
 * steps is the caller's (the register's ← →), so this row takes no arrow of its own. A step that
 * is done carries a check, a skipped one a dash, each with a word for a screen reader.
 */
export function StepChips({ label, steps, selected, onSelect, controls }: StepChipsProps) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1">
      {steps.map((step) => {
        const active = step.id === selected
        return (
          <button
            key={step.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={controls}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(step.id)}
            className={[
              'no-drag inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[12px] outline-focus focus-visible:outline-2 focus-visible:outline-offset-2',
              active
                ? 'border-border bg-surface-active text-fg'
                : 'border-transparent text-muted hover:bg-surface-hover',
            ].join(' ')}
          >
            {step.state === 'done' ? <Icon name="check" size="sm" /> : null}
            {step.state === 'skipped' ? <Icon name="minus" size="sm" /> : null}
            {step.label}
            {step.state && step.stateLabel ? (
              <span className="sr-only">{` ${step.stateLabel}`}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
