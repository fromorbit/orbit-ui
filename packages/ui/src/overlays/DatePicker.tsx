import { cva } from 'class-variance-authority'
import { Popover as RadixPopover } from 'radix-ui'
import { useId, useState } from 'react'
import { Calendar, type CalendarLabels, type IsoDate } from '../primitives/Calendar'
import type { ControlSize } from '../primitives/control-size'
import { controlSize } from '../primitives/control-size'
import { handBackOnlyLostFocus } from '../primitives/hand-back'
import { Icon } from '../primitives/Icon'
import { useUi } from '../provider/UiProvider'
import { usePortalContainer } from './portal'

/** The props of `DatePicker`. */
export interface DatePickerProps {
  /** The accessible name of the trigger. */
  label: string
  value: IsoDate | null
  onValueChange(value: IsoDate): void
  /** What the trigger says while no day is chosen: "Kies een datum". */
  placeholder: string
  labels: CalendarLabels
  min?: IsoDate
  max?: IsoDate
  isDisabled?(day: IsoDate): boolean
  /** For a test or a story: the day the calendar marks as today. */
  today?: IsoDate
  weekStartsOn?: 0 | 1
  size?: ControlSize
  disabled?: boolean
  /** `true` for a trigger as wide as its column, as in a form. */
  block?: boolean
  /**
   * `true` for a value in a list of properties: plain text at rest, the field's frame only on
   * hover, focus or while open, so it reads like the values beside it (Similarity).
   */
  quiet?: boolean
  /** Set by `FormField` or `Field`: the visible label wins over `label`. */
  'aria-labelledby'?: string | undefined
  'aria-describedby'?: string | undefined
  'aria-invalid'?: boolean | undefined
  'aria-required'?: boolean | undefined
  id?: string | undefined
}

const trigger = cva(
  'no-drag inline-flex items-center gap-1.5 rounded-md border px-2 text-left outline-focus hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40',
  {
    variants: {
      size: controlSize,
      invalid: { true: 'border-danger', false: '' },
      block: { true: 'w-full min-w-0', false: 'min-w-40' },
      quiet: { true: '-ms-2 bg-transparent', false: 'bg-surface' },
    },
    compoundVariants: [
      { invalid: false, quiet: false, class: 'border-border' },
      {
        invalid: false,
        quiet: true,
        class:
          'border-transparent hover:border-border focus-visible:border-border data-[state=open]:border-border',
      },
    ],
    defaultVariants: { size: 'md', invalid: false, block: false, quiet: false },
  },
)

/** The frame of the panel: the material of `PANEL`, sized by the calendar inside. */
const CALENDAR_PANEL =
  'no-drag nt-fade-in z-(--nt-z-popover) rounded-lg border border-border bg-overlay p-1 shadow-menu outline-none'

/**
 * One day, chosen from a calendar under a button: a deadline, a date of publication.
 *
 * The trigger shows the day in the provider's locale ("3 nov 2026") and opens a `Calendar` with
 * the focus on the chosen day, or today. A choice closes the panel and returns the focus to the
 * trigger; Escape closes it without a choice. The value is `YYYY-MM-DD`, a day without a zone, so
 * what is chosen is what is stored. A day typed by hand is a different control (`Input` with
 * `type="date"`); this one is for picking.
 */
export function DatePicker({
  label,
  value,
  onValueChange,
  placeholder,
  labels,
  min,
  max,
  isDisabled,
  today,
  weekStartsOn,
  size,
  disabled,
  block = false,
  quiet = false,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  id,
}: DatePickerProps) {
  const { locale } = useUi()
  const container = usePortalContainer()
  const [open, setOpen] = useState(false)
  const labelId = useId()
  const valueId = useId()
  const shown =
    value === null
      ? placeholder
      : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
          new Date(`${value}T00:00:00Z`),
        )
  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      {/* Named by the label and then the day it shows ("Deadline 31 okt 2026"), so a screen
          reader hears the choice and a voice user can say the words in sight (WCAG 2.5.3). */}
      <RadixPopover.Trigger
        type="button"
        aria-labelledby={`${ariaLabelledBy ?? labelId} ${valueId}`}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={ariaRequired}
        aria-haspopup="dialog"
        id={id}
        disabled={disabled}
        className={trigger({ size, invalid: ariaInvalid === true, block, quiet })}
      >
        {ariaLabelledBy === undefined ? (
          <span id={labelId} className="sr-only">
            {label}
          </span>
        ) : null}
        <span className="shrink-0 text-muted">
          <Icon name="calendar" size="sm" />
        </span>
        <span
          id={valueId}
          className={`min-w-0 flex-1 truncate ${value === null ? 'text-muted' : 'text-fg'}`}
        >
          {shown}
        </span>
      </RadixPopover.Trigger>
      <RadixPopover.Portal container={container}>
        <RadixPopover.Content
          aria-label={label}
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className={CALENDAR_PANEL}
          // The calendar puts the focus on its day itself.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={handBackOnlyLostFocus}
        >
          <Calendar
            value={value}
            onValueChange={(day) => {
              onValueChange(day)
              setOpen(false)
            }}
            labels={labels}
            autoFocus
            {...(min === undefined ? {} : { min })}
            {...(max === undefined ? {} : { max })}
            {...(isDisabled === undefined ? {} : { isDisabled })}
            {...(today === undefined ? {} : { today })}
            {...(weekStartsOn === undefined ? {} : { weekStartsOn })}
          />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}
