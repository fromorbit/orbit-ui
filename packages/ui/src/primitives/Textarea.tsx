import type { ChangeEvent, ComponentPropsWithRef } from 'react'
import { useState } from 'react'

/** The props of `Textarea`. */
export interface TextareaProps
  extends Omit<ComponentPropsWithRef<'textarea'>, 'className' | 'style' | 'rows'> {
  /** Accessible name; every field has one. */
  label: string
  /** Fewest rows shown, even when empty; default 1. */
  minRows?: number
  /** Most rows shown before the field scrolls instead of growing further; default 8. */
  maxRows?: number
  /**
   * `field` (default) draws its own box. `bare` draws none: no border, no background, no focus
   * ring and no dimming while disabled — a surrounding surface owns the first three, and the
   * caller decides what the fourth covers.
   */
  variant?: 'field' | 'bare'
  /**
   * Keeps the native placeholder as the field's attribute but draws it in no colour, for a caller
   * that draws a richer one over the empty field itself (the composer's keys, design A). The
   * attribute stays what assistive technology and tests read.
   */
  placeholderHidden?: boolean
}

/**
 * The chrome around the field.
 *
 * `bare` exists for the composer, where field and toolbar stand inside one surface that shows
 * focus with `focus-within`: a second border there would be a box inside a box. Dimming is left to
 * the caller for the same reason — the composer wraps the field alone in it, because `opacity`
 * makes a group and greying the whole surface would grey the pills beside it, which stay usable.
 * A dimming of its own on top of that wrapper (0.6 × 0.4) would leave text nobody can read.
 */
function chromeFor(variant: 'field' | 'bare', disabled: boolean | undefined): string {
  if (variant === 'bare') return 'no-drag block text-fg'
  const box =
    'no-drag block rounded-md border border-border bg-surface px-2 py-[3.25px] text-fg outline-focus focus-within:border-accent-border focus-within:outline-2 focus-within:outline-offset-2'
  return disabled ? `${box} opacity-40` : box
}

/** Number of rows a block of text needs, bounded to `[minRows, maxRows]`. */
function rowsFor(text: string, minRows: number, maxRows: number): number {
  return Math.min(maxRows, Math.max(minRows, text.split('\n').length))
}

/**
 * Multi-line text field that grows with its content instead of scrolling from the first line.
 *
 * The row count is derived from the text itself, the way `Composer` computed it inline before
 * this primitive existed, so a controlled caller sees the field react to a programmatic change of
 * `value` too, not only to typing. There is no `size` prop: unlike a single-line control this has
 * no fixed `h-(--nt-control-*)`, since its height must be free to grow; instead its border and
 * padding are sized so a single row lines up with a size `md` `Input` (28px) sitting next to it.
 */
export function Textarea({
  label,
  minRows = 1,
  maxRows = 8,
  variant = 'field',
  placeholderHidden = false,
  disabled,
  value,
  defaultValue,
  onChange,
  ...props
}: TextareaProps) {
  // `className` and `style` are not part of `TextareaProps`, but a caller working around the type
  // (or plain JS) could still pass either; drop them explicitly, as `Input` does.
  const {
    className: _className,
    style: _style,
    ...rest
  } = props as ComponentPropsWithRef<'textarea'>
  const [uncontrolled, setUncontrolled] = useState(String(defaultValue ?? ''))
  const isControlled = value !== undefined
  const text = isControlled ? String(value) : uncontrolled
  const rows = rowsFor(text, minRows, maxRows)

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    if (!isControlled) setUncontrolled(event.target.value)
    onChange?.(event)
  }

  return (
    // The wrapper div, not the textarea itself, carries the chrome: only the textarea has the
    // native `disabled` attribute, so Tailwind's `disabled:` variant cannot reach the wrapper.
    <div className={chromeFor(variant, disabled)}>
      <textarea
        aria-label={label}
        rows={rows}
        disabled={disabled}
        value={value}
        defaultValue={isControlled ? undefined : defaultValue}
        onChange={handleChange}
        className={`block w-full resize-none overflow-y-auto bg-transparent text-[13px] text-inherit leading-[19.5px] outline-none disabled:cursor-not-allowed ${placeholderHidden ? 'placeholder:text-transparent' : 'placeholder:text-muted'}`}
        {...rest}
      />
    </div>
  )
}
