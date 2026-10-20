import { RadioGroup as RadixRadioGroup } from 'radix-ui'
import { useId } from 'react'

/** One choice in the list; `description` is its own line, read as its accessible description. */
export interface RadioGroupOption {
  id: string
  label: string
  description?: string
}

/** The props of `RadioGroup`. */
export interface RadioGroupProps {
  /** Accessible name of the group. */
  label: string
  options: readonly RadioGroupOption[]
  value: string | null
  onValueChange(value: string): void
  disabled?: boolean
  /**
   * Set by `Field`: per the ARIA accessible-name computation this wins over `label`'s
   * `aria-label`, so the group's name becomes the row's own visible label text.
   */
  'aria-labelledby'?: string | undefined
  /** Set by `Field`, pointing at its description or error text. */
  'aria-describedby'?: string | undefined
}

/**
 * One row per option, checked one at a time: the vertical form of a radio group.
 *
 * Chosen over `SegmentedControl` whenever an option needs a line of its own explanation —
 * `description` sits under the label and is wired on as that option's own `aria-describedby`, a
 * shape a row of segments has no room for. Arrow keys move the roving focus through the list;
 * Radix supplies that, and the component itself draws no number on an option — the sequence 1–9
 * belongs to whichever card knows which list is on screen, not to this primitive.
 */
export function RadioGroup({
  label,
  options,
  value,
  onValueChange,
  disabled,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: RadioGroupProps) {
  return (
    <RadixRadioGroup.Root
      aria-label={label}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      value={value}
      disabled={disabled}
      orientation="vertical"
      onValueChange={onValueChange}
      // Dimmed on the group, not per option: the same reasoning as `SegmentedControl` — an option
      // dimmed on its own would leave the checked one looking live while its neighbours did not.
      className="no-drag flex flex-col gap-0.5 data-disabled:opacity-40"
    >
      {options.map((option) => (
        <RadioGroupOptionRow key={option.id} option={option} />
      ))}
    </RadixRadioGroup.Root>
  )
}

function RadioGroupOptionRow({ option }: { option: RadioGroupOption }) {
  const labelId = useId()
  const descriptionId = useId()
  return (
    <RadixRadioGroup.Item
      value={option.id}
      aria-labelledby={labelId}
      aria-describedby={option.description === undefined ? undefined : descriptionId}
      className="no-drag flex items-start gap-2 rounded-md p-2 text-left outline-focus transition-colors duration-100 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 data-[state=checked]:bg-surface-hover"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border"
      >
        <RadixRadioGroup.Indicator className="size-2 rounded-full bg-accent" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span id={labelId} className="text-fg">
          {option.label}
        </span>
        {option.description === undefined ? null : (
          <span id={descriptionId} className="text-[12px] text-muted">
            {option.description}
          </span>
        )}
      </span>
    </RadixRadioGroup.Item>
  )
}
