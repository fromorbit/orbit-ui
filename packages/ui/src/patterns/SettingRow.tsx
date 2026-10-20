import { type ReactNode, useId, useRef } from 'react'
import { Tooltip } from '../overlays/Tooltip'
import { Icon } from '../primitives/Icon'
import { IconButton } from '../primitives/IconButton'

/** Blank text is no text: a value the caller does not have yet never becomes an empty line. */
function present(text: string | undefined): string | undefined {
  return text === undefined || text.trim() === '' ? undefined : text
}

/**
 * The line of explanation without a full stop at its end: one form for every row, whatever its
 * catalogue spelt, and room for "· Na herstart" behind it. An ellipsis stays.
 */
function withoutFullStop(text: string | undefined): string | undefined {
  return text?.trim().replace(/(?<!\.)\.$/, '')
}

/**
 * The classes of what a row shows only under the pointer or with the focus in it — the way back
 * to the default, the actions of an Expert — hidden with `opacity` alone, so it keeps its place in
 * the tab order and is drawn the moment it takes the focus.
 *
 * Unlike the line under a message it keeps taking clicks at rest: a pointer that reaches the
 * button has crossed its row, so the button is in view by then, and a click that comes without a
 * hover first (a touch, a script) would otherwise fall through to the row around it.
 */
export const SETTING_ROW_REVEAL =
  'opacity-0 group-hover/setting-row:opacity-100 group-focus-within/setting-row:opacity-100'

/** Where else a value may live besides the app; each gets a quiet sign. */
export type SettingRowScope = 'project' | 'chat'

/**
 * The one quiet sign of the other layers a value may live on: a few words ("per project en chat")
 * and the whole sentence as its name and tooltip, or nothing when the app is the only layer.
 *
 * One label rather than an icon per layer: two loose glyphs beside a title read as clutter,
 * and a word says what a folder or a speech bubble only hints at.
 */
function scopeLabel(
  scopes: readonly SettingRowScope[],
  labels: SettingRowLabels['scope'],
): { text: string; name: string } | undefined {
  const project = scopes.includes('project')
  const chat = scopes.includes('chat')
  if (project && chat) return labels.both
  if (project) return labels.project
  if (chat) return labels.chat
  return undefined
}

/**
 * The words every settings row shares, in the host's language; the label and its line are the
 * row's own props.
 */
export interface SettingRowLabels {
  /** "· Na herstart" without its dot: the tail of the line of a setting that waits for a restart. */
  restart: string
  /** The name and tooltip of the layers sign on a project's own value. */
  project: string
  /** The reset button's name on the app scope: "Terug naar standaard". */
  reset: string
  /** The reset button's name on a project scope: "Volg app". */
  followApp: string
  /** The quiet sign of the other layers: a few words and the sentence as its name and tooltip. */
  scope: Record<'project' | 'chat' | 'both', { text: string; name: string }>
}

/** What a row hands its control, to wire the visible label and the explanations onto it. */
export interface SettingRowIds {
  labelId: string
  /** Space-separated ids of the line under the label, the hint and the reason it is dimmed. */
  describedById: string | undefined
  /** True while the row is dimmed: the control must be off. */
  disabled: boolean
}

/** The props of `SettingRow`. */
export interface SettingRowProps {
  /** The visible label; via `aria-labelledby` also the control's accessible name. */
  label: string
  /**
   * The words every row shares, in the host's language: the restart tail, the reset buttons and
   * the signs of the other layers. Required, since the library holds no text of its own.
   */
  labels: SettingRowLabels
  /**
   * Drawn in place of `label`, holding the same text: the label with the letters a search hit in
   * `<mark>` (a settings search). The accessible name is still `label`.
   */
  labelContent?: ReactNode
  /**
   * One short line under the label (12px, `muted`). Cut to one line where the row is narrow, with
   * the whole text as its tooltip: the label wraps, the explanation does not.
   */
  description?: string
  /**
   * A longer explanation, the line of a row without a description, cut to one line like every
   * line, the whole text as its tooltip and the control's description. A row has one form of explanation, not an
   * info button beside a line.
   */
  hint?: string
  /** Core's refusal, in place of the description, in `danger` and announced. */
  error?: string
  /** The setting only takes effect after a restart: "Na herstart" in the line, after the rest. */
  restart?: boolean
  /**
   * On a project scope, where the value comes from. Following the app is the rest state and shows
   * nothing; `project` carries the layers sign, and "Volg app" as its reset. Left
   * out on the app scope.
   */
  source?: 'app' | 'project'
  /**
   * On the app scope, where a project keeps a value of its own ("Anders in webwinkel"): the layers
   * sign, with this as its name and tooltip. Left out while no project differs, so a row that
   * only *may* differ per project says nothing about it.
   */
  differs?: string
  /** Other places the value can differ, as one quiet label behind the label. */
  scopes?: readonly SettingRowScope[]
  /** Whether the value differs from what it would fall back to; only then is reset offered. */
  modified?: boolean
  /** Back to the default (or to the app on a project); the focus then goes to the control. */
  onReset?(): unknown
  /** The reset button's name; `labels.reset` or, on a project, `labels.followApp` by default. */
  resetLabel?: string
  /**
   * Why the row is dimmed (a `dependsOn … dim`): the control goes off, the label stays readable,
   * and this reason is the row's tooltip and part of the control's description.
   */
  dimmed?: string
  /** 32px instead of 48px, for a long list of rows without a line, such as the shortcuts. */
  dense?: boolean
  /** Draws the control, with the ids to wire onto it. */
  children(ids: SettingRowIds): ReactNode
}

/**
 * The one row of the settings screen: label, scope and tag on the left with one short line under
 * it, the control on the right, and "back to the default" just before the control.
 *
 * It replaces `Field` on this screen, and the rows every custom control copied:
 * 12px above and under, 16px at the sides, at least 48px high (32px `dense`). The row is a size
 * container, and below 480px of its own width the control moves under the label instead of
 * squeezing the label column to three or four lines — measured in the
 * gallery, since happy-dom has no layout.
 *
 * Every control ends 16px from the edge of the card: reset keeps no empty slot
 * behind it, but stands before the control of a changed row and shows under the pointer or with the
 * focus in the row (`SETTING_ROW_REVEAL`), so the control itself never moves.
 *
 * The explanation has one form: one line, without a full stop and cut where it does
 * not fit — the description, else the hint — with "Na herstart" at its end for a setting that
 * waits for a restart, never cut itself, and the scope as 11px meta behind the label.
 *
 * `labelId` sits on a span around the label text alone: the accessible-name algorithm folds a
 * descendant's `aria-label` (the info button's) into whatever `aria-labelledby` points at.
 */
export function SettingRow({
  label,
  labels,
  labelContent,
  description,
  hint,
  error,
  restart,
  source,
  differs,
  scopes = [],
  modified,
  onReset,
  resetLabel,
  dimmed,
  dense = false,
  children,
}: SettingRowProps) {
  const labelId = useId()
  const lineId = useId()
  const reasonId = useId()
  const controlRef = useRef<HTMLDivElement>(null)

  const shownError = present(error)
  const line = withoutFullStop(present(description) ?? present(hint))
  // One sign where a value differs from the layer under it: a project's own value, or on the app
  // a value some project changed.
  const layers = source === 'project' ? labels.project : present(differs)
  const restartShown = restart === true && shownError === undefined
  const hasLine = shownError !== undefined || line !== undefined || restartShown
  const reason = present(dimmed)
  const describedBy = [
    hasLine ? lineId : undefined,
    reason === undefined ? undefined : reasonId,
  ].filter((id) => id !== undefined)
  const scopeSign = scopeLabel(scopes, labels.scope)
  const resetName = resetLabel ?? (source === 'project' ? labels.followApp : labels.reset)

  async function reset() {
    await onReset?.()
    // The reset button goes away with the change; the control of the row takes the focus.
    controlRef.current
      ?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      ?.focus()
  }

  // Fixed heights keep a row on the 4px grid: the label line is 24px (the height of the info
  // button, and room for a tag), the line under it 16px. The body's own line height made a label
  // with a description 61.5px high.
  const row = (
    <div
      className={`flex items-center gap-x-6 gap-y-2 px-4 @max-[30rem]:flex-col @max-[30rem]:items-start ${dense ? 'min-h-8 py-1' : 'min-h-12 py-3'}`}
    >
      <div className="min-w-0 flex-1">
        <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 min-h-6 text-fg">
          <span id={labelId} className="leading-5">
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
          {scopeSign === undefined ? null : (
            <Tooltip label={scopeSign.name}>
              <span
                role="img"
                aria-label={scopeSign.name}
                data-nt-setting-scope
                className="text-[11px] leading-4 text-muted"
              >
                {scopeSign.text}
              </span>
            </Tooltip>
          )}
          {layers === undefined ? null : (
            <Tooltip label={layers}>
              <span
                role="img"
                aria-label={layers}
                data-nt-setting-layers
                className={`flex ${source === 'project' ? 'text-accent-text' : 'text-muted'}`}
              >
                <Icon name="layers" size="sm" />
              </span>
            </Tooltip>
          )}
        </p>
        {shownError !== undefined ? (
          <p id={lineId} role="alert" className="m-0 text-[12px] leading-4 text-danger">
            {shownError}
          </p>
        ) : hasLine ? (
          <ExplanationLine
            id={lineId}
            text={line}
            restart={restartShown ? labels.restart : undefined}
          />
        ) : null}
        {reason === undefined ? null : (
          <span id={reasonId} className="sr-only">
            {reason}
          </span>
        )}
      </div>
      <div className="flex max-w-full shrink-0 items-center gap-2">
        {modified && onReset && reason === undefined ? (
          // Under the label (a narrow row) the control starts on the label's edge; reset follows it.
          <span
            data-nt-setting-reset
            className={`flex size-6 shrink-0 @max-[30rem]:order-last ${SETTING_ROW_REVEAL}`}
          >
            <Tooltip label={resetName}>
              <IconButton
                icon="rotate-ccw"
                label={resetName}
                variant="plain"
                size="sm"
                onClick={() => void reset()}
              />
            </Tooltip>
          </span>
        ) : null}
        <div ref={controlRef} className="flex max-w-full items-center gap-2">
          {children({
            labelId,
            describedById: describedBy.length === 0 ? undefined : describedBy.join(' '),
            disabled: reason !== undefined,
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div data-nt-setting-row className="group/setting-row @container">
      {reason === undefined ? row : <Tooltip label={reason}>{row}</Tooltip>}
    </div>
  )
}

/**
 * The one line of explanation under the label: the text, and "· Na herstart" behind it for a
 * setting that waits for a restart. The text is cut to one line, with the whole as its tooltip;
 * "Na herstart" is never cut. The control's description reads it all, since the cut is CSS alone.
 */
function ExplanationLine({
  id,
  text,
  restart,
}: {
  id: string
  text: string | undefined
  /** The words for a setting that waits for a restart, or `undefined` for one that does not. */
  restart: string | undefined
}) {
  return (
    <p id={id} className="m-0 flex min-w-0 text-[12px] leading-4 text-muted">
      {text === undefined ? null : (
        <Tooltip label={text}>
          <span className="truncate">{text}</span>
        </Tooltip>
      )}
      {restart !== undefined ? (
        <span className="shrink-0 whitespace-pre">
          {text === undefined ? null : ' · '}
          <span>{restart}</span>
        </span>
      ) : null}
    </p>
  )
}
