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
 * The switch of the family: a 32×18 track. Off is an outline without a fill, in the edge of an
 * empty box (`control-border`, 1.5px), with a muted thumb of 11px; on is the neutral `accent`
 * fill (Paper in dark, Midnight in light) with a thumb in `accent-fg`, 14px further along. The
 * edge and the muted thumb both hold 3:1 on every plane (WCAG 1.4.11, `tokens.test.ts`), so off
 * still reads as a control and never as on. Never violet and never a product's satellite: the
 * switch is a control, not a link or a brand. Disabled keeps the colours of its state at the lower
 * opacity every control has, never a third grey.
 *
 * Its 24px hit area (`::before`, 3px above and below the track) counts toward the overflow of a
 * scrolling ancestor: keep 4px of room after a switch at the end of an `overflow-auto` container.
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
      // The `before` makes the hit area 24px high (WCAG 2.5.8) without growing what is drawn: an
      // absolute child measures from the padding box, 29 by 15 inside the 1.5px edge, so 2px out on
      // either side and 4.5px above and below give 33 by 24, in either density.
      className="no-drag relative flex h-[18px] w-8 shrink-0 items-center before:absolute before:-inset-x-0.5 before:-inset-y-[4.5px] before:content-[''] rounded-full border-[1.5px] border-control-border bg-transparent outline-focus transition-colors duration-(--nt-duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40 data-[state=checked]:border-accent data-[state=checked]:bg-accent"
    >
      {/* The thumb is the one thing here that really travels, so reduced motion puts it in its
          other position without the slide — the same rule as the chevron of a Collapsible. */}
      <RadixSwitch.Thumb className="block size-[11px] translate-x-0.5 rounded-full bg-muted transition-transform duration-(--nt-duration-fast) motion-reduce:transition-none data-[state=checked]:translate-x-4 data-[state=checked]:bg-accent-fg" />
    </RadixSwitch.Root>
  )
}
