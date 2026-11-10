import { type ReactNode, useId } from 'react'
import { Tooltip } from '../overlays/Tooltip'
import { Switch } from '../primitives/Switch'
import { present, withoutFullStop } from './setting-text'

/** The props of `SettingSwitchRow`. */
export interface SettingSwitchRowProps {
  /** The title of the row, and the switch's accessible name. */
  label: string
  /**
   * Drawn in place of `label`, holding the same text: a repository in DM Mono, or the label with
   * the letters a search hit in `<mark>`. The accessible name is still `label`. Words and marks
   * only, never a link or a button: it is `aria-hidden` inside the row's `<label>`, so a control in
   * it would be unreachable for a screen reader and its click would toggle the switch.
   */
  labelContent?: ReactNode
  /**
   * The explanation under the title (12px, `muted`), read as the switch's description, without a
   * full stop at its end like the line of a `SettingRow`. It wraps onto as many lines as it needs:
   * a row of a switch has room for a sentence, and is never cut.
   */
  description?: string
  /** A quiet word before the switch, such as the profile of a repository ("Assertief"). */
  meta?: string
  checked: boolean
  /** Off without a reason; for a reason the reader should hear, use `dimmed`. */
  disabled?: boolean
  /**
   * Why the setting cannot be changed now: the switch goes off, the words stay readable, and this
   * reason is the row's tooltip and part of the switch's description.
   */
  dimmed?: string
  onCheckedChange(checked: boolean): void
}

/**
 * A setting that is on or off, in which the whole row is the switch's label: the title and its
 * explanation on the left, quiet meta and the `Switch` on the right.
 *
 * Beside `SettingRow` and `SettingFoldRow` rather than one more mode of them: `SettingRow` with a
 * `Switch` gives the layout, but only the switch itself takes a click, and its line is cut to one.
 * `CheckboxField` is clickable as a whole but sets its box on the left. Here the row is a
 * `<label>`, so a click anywhere in it toggles the switch, and the switch stays the one tab stop.
 *
 * The measures are those of a `SettingRow`: 12px above and under, 16px at the sides, the title on
 * a line of 24px, so a row is 48px at the least and 64px with one line of explanation, and the two
 * stand in one group at one rhythm. The switch stays on the right and centred at every width; the
 * words wrap instead, and stay selectable, so a repository name can be copied.
 *
 * The wrapper carries `data-nt-setting-switch-row`, its own mark rather than `data-nt-setting-row`:
 * a host that finds the rows of a `SettingRow` by that mark expects its inner structure.
 */
export function SettingSwitchRow({
  label,
  labelContent,
  description,
  meta,
  checked,
  disabled = false,
  dimmed,
  onCheckedChange,
}: SettingSwitchRowProps) {
  const labelId = useId()
  const lineId = useId()
  const metaId = useId()
  const reasonId = useId()

  const line = withoutFullStop(present(description))
  const quiet = present(meta)
  const reason = present(dimmed)
  const off = disabled || reason !== undefined
  const describedBy = [
    line === undefined ? undefined : lineId,
    quiet === undefined ? undefined : metaId,
    reason === undefined ? undefined : reasonId,
  ].filter((id) => id !== undefined)

  const row = (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is the Switch inside, a button.
    <label
      className={`flex min-h-12 items-center gap-x-6 px-4 py-3 ${off ? '' : 'cursor-pointer'}`}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span id={labelId} className="text-[13px] leading-6 text-fg">
          {labelContent === undefined ? (
            label
          ) : (
            // The pieces are drawn; the name is read from the plain label.
            <>
              <span className="sr-only">{label}</span>
              <span aria-hidden="true">{labelContent}</span>
            </>
          )}
        </span>
        {line === undefined ? null : (
          <span id={lineId} className="text-[12px] leading-4 text-muted">
            {line}
          </span>
        )}
        {reason === undefined ? null : (
          <span id={reasonId} className="sr-only">
            {reason}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-3">
        {quiet === undefined ? null : (
          <span id={metaId} className="text-[12px] leading-4 text-muted">
            {quiet}
          </span>
        )}
        <Switch
          label={label}
          aria-labelledby={labelId}
          aria-describedby={describedBy.length === 0 ? undefined : describedBy.join(' ')}
          checked={checked}
          disabled={off}
          onCheckedChange={onCheckedChange}
        />
      </span>
    </label>
  )

  return (
    <div data-nt-setting-switch-row>
      {reason === undefined ? row : <Tooltip label={reason}>{row}</Tooltip>}
    </div>
  )
}
