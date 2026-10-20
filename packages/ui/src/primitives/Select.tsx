import { cva } from 'class-variance-authority'
import { Select as RadixSelect } from 'radix-ui'
import type { ControlSize } from './control-size'
import { controlHeight, controlSize } from './control-size'
import { handBackOnlyLostFocus } from './hand-back'
import { Icon } from './Icon'

const trigger = cva(
  'no-drag inline-flex max-w-56 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-fg outline-focus hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40',
  {
    variants: { size: controlSize },
    defaultVariants: { size: 'md' },
  },
)

/**
 * One option in the popup: a row you click, so it is as tall as the `md` trigger that opened it.
 *
 * The height comes from `controlHeight.md` rather than from a hand-written `h-7`, which happened to
 * be the same 28px: move `--nt-control-md` and the popup would silently stay behind. No focus ring
 * here — Radix moves a `data-highlighted` state through the list, and the browser's own outline on
 * top of that would draw a second selection.
 */
const ITEM = `flex ${controlHeight.md} cursor-default items-center rounded-md px-2 text-[12px] text-muted outline-none select-none data-[highlighted]:bg-surface-hover data-[highlighted]:text-fg data-[state=checked]:text-fg data-[disabled]:opacity-40`

/** The props of `Select`. */
export interface SelectProps<T extends string> {
  /** Accessible name of the control. */
  label: string
  value: T
  /** An option may be `disabled`: it stays in the list, greyed, and cannot be picked. */
  options: readonly { value: T; label: string; disabled?: boolean }[]
  size?: ControlSize
  disabled?: boolean
  onValueChange(value: T): void
  /**
   * Set by `Field`: per the ARIA accessible-name computation this wins over `label`'s
   * `aria-label`, so the trigger's name becomes the row's own visible label text.
   */
  'aria-labelledby'?: string | undefined
  /** Set by `Field`, pointing at its description or error text. */
  'aria-describedby'?: string | undefined
}

/**
 * One choice out of a list that can grow, such as projects, or out of a few fixed options whose
 * labels are too wide to stand beside each other. For up to four short fixed options use
 * `SegmentedControl` instead, where the alternatives stay visible.
 *
 * Generic in its value, exactly like `SegmentedControl`: a caller whose options are a union — the
 * access levels of the settings, a language — hears that union back in `onValueChange` instead of
 * a bare `string` it has to cast. The one cast left is inside, on Radix' own `string`, where the
 * component itself knows that nothing but its own `options` can come out.
 */
export function Select<T extends string>({
  label,
  value,
  options,
  size,
  disabled,
  onValueChange,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: SelectProps<T>) {
  return (
    <RadixSelect.Root
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      {...(disabled ? { disabled } : {})}
    >
      <RadixSelect.Trigger
        aria-label={label}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        className={trigger({ size })}
      >
        <span className="truncate">
          <RadixSelect.Value />
        </span>
        <RadixSelect.Icon className="text-muted">
          <Icon name="chevron-down" size="sm" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          // Knowingly a near copy of `PANEL` in `overlays/panel.ts`: a layer imports only downward,
          // so `primitives/` may not reach into `overlays/`. Keep the two in step.
          className="z-(--nt-z-popover) max-h-72 min-w-40 overflow-hidden rounded-lg border border-border bg-overlay p-1 shadow-menu"
          // Radix hands the focus back a task after the pick, late under load: a pick that moved
          // the focus on keeps it there.
          onCloseAutoFocus={handBackOnlyLostFocus}
        >
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className={ITEM}
                {...(option.disabled ? { disabled: true } : {})}
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
