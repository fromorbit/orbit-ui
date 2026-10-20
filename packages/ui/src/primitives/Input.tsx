import { cva } from 'class-variance-authority'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { useCallback, useRef, useState } from 'react'
import type { ControlSize } from './control-size'
import { controlSize } from './control-size'
import { Icon, type IconName } from './Icon'
import { IconButton } from './IconButton'

/**
 * The wrapper carries the border and background; the `<input>` itself stays bare.
 *
 * `bare` drops both, and the focus ring with them: a field that stands *inside* a panel already has
 * a frame — the panel — and a ring there put a second cyan box on screen beside the one on the row
 * the keyboard was on. A text field has an indicator no other control has: the blinking caret,
 * which WCAG 2.4.7 accepts (it asks that the focus be visible, not that it be a ring). Everywhere
 * else the frame and the ring stay, because a field on a page has nothing else to show focus with.
 *
 * Both members are complete class strings and the base holds nothing about the frame, so exactly
 * one border and one background is ever emitted — this project has no class-merging tool.
 */
const wrapper = cva('no-drag inline-flex shrink-0 items-center gap-1.5 px-2 text-fg', {
  variants: {
    size: controlSize,
    variant: {
      default:
        'rounded-md border border-border bg-surface outline-focus focus-within:border-accent-border focus-within:outline-2 focus-within:outline-offset-2',
      bare: '',
    },
  },
  defaultVariants: { size: 'md', variant: 'default' },
})

/** Whether the field brings its own frame, or stands in one it is already inside. */
export type InputVariant = 'default' | 'bare'

/** The props of `Input`. */
export interface InputProps
  extends Omit<ComponentPropsWithRef<'input'>, 'className' | 'style' | 'size'> {
  /** Accessible name; every field has one. */
  label: string
  size?: ControlSize
  /** Icon shown before the text. */
  icon?: IconName
  /** `bare` for a field inside a panel: no border, no background, no ring. */
  variant?: InputVariant
  /**
   * The accessible name of a cross at the end that empties the field ("Wissen"): the cross is
   * there only when this is given, and only while there is text in the field.
   *
   * It empties the field the way typing would — through the native value setter and an `input`
   * event — so a controlled field hears it in its own `onChange` and needs no second handler; the
   * focus stays in the field. `onClear` is for a caller that wants to know on top of that.
   */
  clearLabel?: string
  /** Called after the cross emptied the field. */
  onClear?(): void
  /**
   * Content inside the frame after the text, such as the eye of `SecretField`: a control that
   * belongs to this field rather than beside it, so it shares the frame and the focus ring.
   */
  trailing?: ReactNode
  /**
   * Draws the placeholder in the text colour: for `SecretField`, whose dots stand for a value that
   * is there but never sent back to the interface, and must read as filled rather than as a hint.
   */
  placeholderFilled?: boolean
}

/** Whether a value React would render as text is non-empty. */
function hasText(value: unknown): boolean {
  return value !== undefined && value !== null && String(value) !== ''
}

/**
 * Sets an input's value as if the user had typed it, so React's `onChange` fires.
 *
 * Assigning `input.value` directly is swallowed by React's value tracker (it sees no change);
 * the prototype's setter bypasses that, the same trick Testing Library uses.
 */
function setNativeValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

/**
 * The single-line text field of the design system.
 *
 * The visible label lives in `Field`; without one, `label` becomes the accessible name via
 * `aria-label`. The border sits on the wrapper, not the `<input>`, so an icon can share it without
 * a second focus ring. A `ref` passed in goes to the native `<input>`, not the wrapper `<span>`,
 * since that is the element focus management and `Popover.Trigger asChild` need.
 */
export function Input({
  label,
  size,
  icon,
  variant,
  disabled,
  clearLabel,
  onClear,
  trailing,
  placeholderFilled,
  ...props
}: InputProps) {
  // `className` and `style` are not part of `InputProps`, but a caller working around the type
  // (or plain JS) could still pass either; drop them explicitly so they can never replace the
  // classes below, the way spreading `...rest` after a literal `className` would.
  const {
    className: _className,
    style: _style,
    ref: outerRef,
    onChange,
    ...rest
  } = props as ComponentPropsWithRef<'input'>
  const own = useRef<HTMLInputElement | null>(null)
  // Only read for an uncontrolled field: a controlled one says what it holds through `value`.
  const [typed, setTyped] = useState(() => hasText(rest.defaultValue))
  const filled = rest.value !== undefined ? hasText(rest.value) : typed
  const setRef = useCallback(
    (element: HTMLInputElement | null) => {
      own.current = element
      if (typeof outerRef === 'function') outerRef(element)
      else if (outerRef) outerRef.current = element
    },
    [outerRef],
  )

  function clear() {
    const input = own.current
    if (!input) return
    setNativeValue(input, '')
    input.focus()
    onClear?.()
  }

  return (
    // The wrapper span, not the input element, dims on disabled: only the input carries the
    // native `disabled` attribute, so Tailwind's `disabled:` variant cannot reach the wrapper.
    <span className={`${wrapper({ size, variant })} ${disabled ? 'opacity-40' : ''}`.trim()}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 'sm' : 'md'} /> : null}
      <input
        type="text"
        aria-label={label}
        disabled={disabled}
        className={
          placeholderFilled
            ? 'w-full min-w-0 bg-transparent text-inherit outline-none placeholder:text-fg disabled:cursor-not-allowed'
            : 'w-full min-w-0 bg-transparent text-inherit outline-none placeholder:text-muted disabled:cursor-not-allowed'
        }
        ref={setRef}
        onChange={(event) => {
          setTyped(event.target.value !== '')
          onChange?.(event)
        }}
        {...rest}
      />
      {clearLabel !== undefined && filled && !disabled ? (
        // Pulled into the wrapper's padding, so the cross sits as close to the edge as the icon
        // at the start does, and the text keeps its room.
        <span className="-mr-1.5 flex shrink-0">
          <IconButton
            icon="x"
            label={clearLabel}
            size="sm"
            variant="ghost"
            // Keeps the caret in the field: a press that moved the focus to the cross first would
            // blur the field, and a field that saves on blur would save what is being cleared.
            onMouseDown={(event) => event.preventDefault()}
            onClick={clear}
          />
        </span>
      ) : null}
      {trailing}
    </span>
  )
}
