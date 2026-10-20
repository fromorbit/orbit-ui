import type { ReactElement, ReactNode } from 'react'
import { useId } from 'react'
import { IconButton } from './IconButton'

/**
 * Blank text is no text: an empty or whitespace-only `description`/`error`/`hint` (a value the
 * caller does not have yet) must not become an empty paragraph wired as the control's description.
 */
function present(text: string | undefined): string | undefined {
  return text === undefined || text.trim() === '' ? undefined : text
}

/** The props of `Field`. */
export interface FieldProps {
  /** Visible label; the row's left column, and (via `aria-labelledby`) the control's accessible name. */
  label: string
  /**
   * Drawn in place of `label`, holding the same text: the label with the letters a search hit in
   * `<mark>` (the settings search). The accessible name is still what it reads.
   */
  labelContent?: ReactNode
  description?: string
  /** Shown instead of the description, with role="alert". */
  error?: string
  /**
   * A short explanation, shown only as a tooltip behind the label — never a line
   * of text under it. It is also the accessible name of the info button and the control's own
   * accessible description, so a keyboard user gets it without waiting for the tooltip to open.
   * Ignored while `description` or `error` is present: a row has one explanation at a time.
   */
  hint?: string
  /**
   * Wraps the info button in a `Tooltip`. `primitives/` may not import `overlays/` (see
   * `SegmentedControl.wrapItem` for the same reason), so the caller — who may — brings the layer.
   * Left out, the button still renders (focusable, with its accessible name), just without the
   * floating tooltip a mouse would show.
   */
  wrapHint?(button: ReactElement, hint: string): ReactElement
  /** Receives the ids to wire onto the control, via `aria-labelledby` and `aria-describedby`. */
  children: (ids: { labelId: string; describedById: string | undefined }) => ReactNode
}

/**
 * One settings-style row: a visible label with a description or error on the left, one control on
 * the right, wired together per the ARIA accessible-name computation (`aria-labelledby` wins over
 * a primitive's own `aria-label`, so the visible label becomes the control's name).
 *
 * The layout matches the local `Row` in `features/settings/SettingsView.tsx`, so a later task can
 * swap that for `Field` without a visual change.
 */
export function Field({
  label,
  labelContent,
  description,
  error,
  hint,
  wrapHint,
  children,
}: FieldProps) {
  const labelId = useId()
  const descriptionId = useId()
  const hintId = useId()
  const shownError = present(error)
  const explanation = shownError ?? present(description)
  // A hint only shows once neither an explanation nor a failure claims the row's one description.
  const shownHint = explanation === undefined ? present(hint) : undefined
  const describedById =
    explanation !== undefined ? descriptionId : shownHint !== undefined ? hintId : undefined
  const hintNode =
    shownHint === undefined
      ? null
      : (() => {
          const button = <IconButton icon="info" label={shownHint} variant="plain" size="sm" />
          return wrapHint ? wrapHint(button, shownHint) : button
        })()

  return (
    <div className="flex min-h-12 items-center gap-6 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        {/* `labelId` sits on a span around the label text alone, not the paragraph: the
            accessible-name algorithm folds a descendant's own `aria-label` (the info button's,
            which carries the hint text) into whatever `aria-labelledby` points at, so putting the
            id on the paragraph would silently turn "Geschiedenis" into "Geschiedenis Per
            projectprofiel" for the control this row names. */}
        <p className="m-0 flex items-center gap-1 text-fg">
          <span id={labelId}>
            {labelContent === undefined ? (
              label
            ) : (
              // The marks split the text into pieces; the name is read from the plain label, so
              // no reader ever hears "Netwerk toegang" for one word.
              <>
                <span className="sr-only">{label}</span>
                <span aria-hidden="true">{labelContent}</span>
              </>
            )}
          </span>
          {hintNode}
        </p>
        {explanation === undefined ? null : shownError !== undefined ? (
          <p id={descriptionId} role="alert" className="m-0 text-[12px] text-danger">
            {explanation}
          </p>
        ) : (
          <p id={descriptionId} className="m-0 text-[12px] text-muted">
            {explanation}
          </p>
        )}
        {shownHint === undefined ? null : (
          // Not visible: the tooltip already carries this to sighted users. It only has to exist
          // so the control's own `aria-describedby` resolves to something, tooltip open or not.
          <span id={hintId} className="sr-only">
            {shownHint}
          </span>
        )}
      </div>
      {children({ labelId, describedById })}
    </div>
  )
}
