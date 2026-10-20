import { Switch as RadixSwitch } from 'radix-ui'

/** The props of `Switch`. */
export interface SwitchProps {
  /** Accessible name; the visible label lives in the surrounding row. */
  label: string
  checked: boolean
  disabled?: boolean
  onCheckedChange(checked: boolean): void
  /**
   * Set by `Field`: per the ARIA accessible-name computation this wins over `label`'s
   * `aria-label`, so the switch's name becomes the row's own visible label text.
   */
  'aria-labelledby'?: string | undefined
  /** Set by `Field`, pointing at its description or error text. */
  'aria-describedby'?: string | undefined
}

/**
 * On/off control. Radix supplies the behaviour and the `switch` role; the look comes from tokens.
 *
 * One knob for both states: white with a hairline, on the accent when on and on a neutral track
 * when off. Off used to be a dark knob on a track of `surface-hover`, which in light was all but
 * invisible, so an off switch read as on. The off track is `border-focus`, the one
 * neutral that stands at 3:1 on its own against a card in either theme (WCAG 1.4.11). Disabled
 * keeps the colours of its state at the lower opacity every control has, never a third grey.
 */
export function Switch({
  label,
  checked,
  disabled,
  onCheckedChange,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: SwitchProps) {
  return (
    <RadixSwitch.Root
      aria-label={label}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      className="no-drag relative h-[18px] w-8 shrink-0 rounded-full bg-border-focus outline-focus transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40 data-[state=checked]:bg-accent"
    >
      {/* The thumb is the one thing here that really travels, so reduced motion puts it in its
          other position without the slide — the same rule as the chevron of a Collapsible. */}
      <RadixSwitch.Thumb className="block size-3.5 translate-x-0.5 rounded-full bg-accent-fg ring-1 ring-border-strong transition-transform duration-100 motion-reduce:transition-none data-[state=checked]:translate-x-4" />
    </RadixSwitch.Root>
  )
}
