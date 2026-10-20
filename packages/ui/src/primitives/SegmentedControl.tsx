import { cva } from 'class-variance-authority'
import { RadioGroup } from 'radix-ui'
import { Fragment, type ReactElement } from 'react'
import type { ControlSize } from './control-size'
import { controlSize } from './control-size'
import { Icon, type IconName } from './Icon'

// The offset is negative: a segment's ring stays inside its own box, so in a framed group it does
// not land on the group's border, and in a toolbar it does not touch the control beside it. The
// chosen segment is styled by `aria-checked`, not `data-state`: a `wrapItem` tooltip trigger sets
// its own `data-state` (closed, delayed-open) on the same element, and the chosen segment would
// look like the rest.
//
// `sm` is the toolbar variant and has no frame at all (a framed block of
// icons weighed more than the file name and the quiet "Open in je editor" beside it). It is 20px
// high, lower than the 24px ghost button next to it, and the chosen segment is only a soft fill, as
// a ghost button that stays pressed; the others are a muted word or icon. `md` and `lg` keep their
// segment at the control height with the frame around it, as the settings rows were drawn.
const item = cva(
  'inline-flex items-center gap-1 rounded-sm font-medium text-muted outline-focus transition-colors duration-100 hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 aria-checked:bg-surface-hover aria-checked:text-fg data-nt-unavailable:opacity-40 data-nt-unavailable:hover:text-muted',
  {
    variants: {
      size: {
        sm: 'h-full px-1.5 text-[12px]',
        md: `${controlSize.md} px-2.5`,
        lg: `${controlSize.lg} px-2.5`,
      },
    },
    defaultVariants: { size: 'md' },
  },
)

// Dimmed on the group, not per segment: `disabled:opacity-40` on the items would leave the border
// and the surface at full strength, and the checked segment would still read as live.
const group = cva('no-drag inline-flex shrink-0 data-disabled:opacity-40', {
  variants: {
    size: {
      sm: 'h-(--nt-control-xs) gap-px',
      md: 'rounded-md border border-border bg-surface p-0.5',
      lg: 'rounded-md border border-border bg-surface p-0.5',
    },
  },
  defaultVariants: { size: 'md' },
})

/**
 * The widths of the nearest `@container/toolbar` below which a collapsing group shows only its
 * icons; the word stays the segment's name. Measured in the file tab, whose default
 * panel leaves a 353px toolbar: with the words, Bestand · Diff takes 92px, Lezen · Code · Gesplitst
 * 152px and "Open in je editor" 108px. 480px is where a markdown document, with both groups, still
 * leaves its file name about 60px; a plain file, with only Bestand · Diff, leaves the same at 320px —
 * so it keeps its words in the default panel, which is quieter than a row of icons. 480px is also
 * where a file tab calls itself narrow (`OUTLINE_FOLD_BELOW` in `features/markdown/MarkdownTab.tsx`).
 *
 * Folded, a segment is a 20px square around its 14px icon (`item`), so the file name keeps the
 * room the words gave back.
 *
 * Literal classes, because Tailwind finds utilities by scanning source text (see
 * `control-size.ts`); the same container name as `PickerPill`'s `COLLAPSE_BELOW`.
 */
const COLLAPSE = {
  320: {
    word: '@max-[320px]/toolbar:sr-only',
    icon: 'hidden @max-[320px]/toolbar:inline-flex',
    item: '@max-[320px]/toolbar:px-[3px]',
  },
  480: {
    word: '@max-[480px]/toolbar:sr-only',
    icon: 'hidden @max-[480px]/toolbar:inline-flex',
    item: '@max-[480px]/toolbar:px-[3px]',
  },
} as const

/** A toolbar width below which a collapsing group keeps only its icons (see `COLLAPSE`). */
export type CollapseBelow = keyof typeof COLLAPSE

/** The props of `SegmentedControl`. */
export interface SegmentedControlProps<T extends string> {
  /** Accessible name of the group. */
  label: string
  value: T
  /**
   * `disabled` dims one option that cannot be chosen now, such as a stand a document is too large
   * for; `icon` stands before the word, or alone when the group collapses.
   */
  options: readonly { value: T; label: string; disabled?: boolean; icon?: IconName }[]
  size?: ControlSize
  /**
   * Leaves only the icons below a width of the nearest `@container/toolbar` (see `COLLAPSE`), for
   * a group in a header that can grow narrow; every option then needs an `icon`. The word stays the
   * segment's name, and a `wrapItem` tooltip can say it on hover.
   */
  collapse?: boolean
  /** The toolbar width `collapse` folds below: 480px unless the toolbar holds little else. */
  collapseBelow?: CollapseBelow
  disabled?: boolean
  onValueChange(value: T): void
  /**
   * Set by `Field`: per the ARIA accessible-name computation this wins over `label`'s
   * `aria-label`, so the group's name becomes the row's own visible label text.
   */
  'aria-labelledby'?: string | undefined
  /** Set by `Field`, pointing at its description or error text. */
  'aria-describedby'?: string | undefined
  /**
   * Wraps each segment, such as in a `Tooltip` that says what the option does.
   *
   * A function rather than a hint per option: `primitives/` may not import from `overlays/`, so the
   * caller — who may — brings the layer. The segment it gets is a Radix radio that forwards its ref
   * and props, so an `asChild` trigger can take it as it is.
   */
  wrapItem?(item: ReactElement, value: T): ReactElement
}

/**
 * One choice out of a few, all visible at once.
 *
 * Preferred over a dropdown for up to four options: the alternatives are readable without a click,
 * and it is a plain radio group for assistive technology and the arrow keys. It does not shrink,
 * so it is the wrong control as soon as its labels together no longer fit the row they live in at
 * the minimum window width — then a `Select` it is, or, in a toolbar, `collapse` to its icons.
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  size,
  collapse = false,
  collapseBelow = 480,
  disabled,
  onValueChange,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  wrapItem,
}: SegmentedControlProps<T>) {
  return (
    <RadioGroup.Root
      aria-label={label}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      value={value}
      disabled={disabled}
      orientation="horizontal"
      onValueChange={(next) => onValueChange(next as T)}
      className={group({ size })}
    >
      {options.map((option) => {
        const segment = (
          <RadioGroup.Item
            value={option.value}
            disabled={option.disabled === true}
            // Its own attribute, not Radix's `data-disabled`: a disabled group marks every item
            // too, and the group already dims itself (see `group` above).
            data-nt-unavailable={option.disabled === true ? '' : undefined}
            className={
              collapse ? `${item({ size })} ${COLLAPSE[collapseBelow].item}` : item({ size })
            }
          >
            {option.icon === undefined ? null : (
              <span
                data-nt-segment-icon
                className={collapse ? COLLAPSE[collapseBelow].icon : 'inline-flex'}
              >
                <Icon name={option.icon} size="sm" />
              </span>
            )}
            <span className={collapse ? COLLAPSE[collapseBelow].word : undefined}>
              {option.label}
            </span>
          </RadioGroup.Item>
        )
        return (
          <Fragment key={option.value}>
            {wrapItem ? wrapItem(segment, option.value) : segment}
          </Fragment>
        )
      })}
    </RadioGroup.Root>
  )
}
