import { Slider as RadixSlider } from 'radix-ui'

/** The props of `Slider`. */
export interface SliderProps {
  /** Accessible name of the thumb. */
  label: string
  value: number
  onValueChange(value: number): void
  /** Called once the drag or key press is over, for a value that is costly to apply. */
  onValueCommit?(value: number): void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  /**
   * The value in words, for a screen reader and for the figure beside the track: "512 MB",
   * "2 kernen". A function, because the unit is the host's language.
   */
  valueText(value: number): string
  /** Shows `valueText` beside the track, in mono; on by default. */
  showValue?: boolean
  /** Set by `FormField` or `Field`: the visible label wins over `label`. */
  'aria-labelledby'?: string | undefined
  'aria-describedby'?: string | undefined
  'aria-invalid'?: boolean | undefined
  id?: string | undefined
}

/**
 * One number on a range, set by dragging or with the keys: a memory limit, a number of replicas.
 *
 * Radix supplies the `slider` role and the keys: the arrows move one `step`, Page Up and Page Down
 * ten, Home and End to the ends. The thumb is the one tab stop and carries the name; a screen
 * reader hears `valueText` ("512 MB") rather than a bare number. The filled part of the track is
 * the accent, like a checked box: it is the value that was chosen. For a value that must be exact
 * use `NumberField`; a slider is for a value one gets roughly right by eye.
 */
export function Slider({
  label,
  value,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  valueText,
  showValue = true,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  id,
}: SliderProps) {
  return (
    <span className="flex w-full min-w-0 items-center gap-3">
      <RadixSlider.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        {...(disabled ? { disabled } : {})}
        onValueChange={([next]) => {
          if (next !== undefined) onValueChange(next)
        }}
        {...(onValueCommit
          ? {
              onValueCommit: ([next]: number[]) => {
                if (next !== undefined) onValueCommit(next)
              },
            }
          : {})}
        className="no-drag relative flex h-(--nt-control-md) min-w-0 flex-1 touch-none items-center select-none data-disabled:opacity-40"
      >
        <RadixSlider.Track className="relative h-1 grow overflow-hidden rounded-full bg-border-focus">
          <RadixSlider.Range className="absolute h-full rounded-full bg-accent" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          aria-label={label}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          aria-valuetext={valueText(value)}
          id={id}
          className="block size-4 rounded-full bg-accent-fg shadow-menu ring-1 ring-border-strong outline-focus transition-transform duration-(--nt-duration-fast) hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
        />
      </RadixSlider.Root>
      {showValue ? (
        <span
          aria-hidden="true"
          className="min-w-14 shrink-0 text-right text-[12px] text-muted tabular-nums"
        >
          {valueText(value)}
        </span>
      ) : null}
    </span>
  )
}
