import type { ComponentPropsWithRef } from 'react'
import { useUi } from '../provider/UiProvider'
import { Icon, type IconName } from './Icon'
import { Kbd } from './Kbd'
import type { ShortcutLabel } from './shortcut'

/** The props of `SearchFieldButton`. */
export interface SearchFieldButtonProps
  extends Omit<ComponentPropsWithRef<'button'>, 'className' | 'style' | 'children' | 'type'> {
  /**
   * The words of the field, in the host's words ("Zoek of spring naar…"): drawn as a placeholder
   * and the button's accessible name.
   */
  placeholder: string
  /**
   * The command the button stands for, as `Button` takes it: read through the `ShortcutPort` of
   * `UiProvider`, drawn at the end in one cap (`Kbd` `menu`) and announced as
   * `aria-keyshortcuts`. Without a provider nothing is drawn.
   */
  shortcut?: ShortcutLabel
  /** The glyph before the words; a magnifier by default. */
  icon?: IconName
}

/**
 * A button in the shape of a search field: the top bar's "Zoek of spring naar… ⌘K", which opens a
 * palette rather than taking text itself.
 *
 * A field at rest, so the eye reads it as the place to search: the height of a small control
 * (`--nt-control-sm`, 28px and 24px compact), a hairline in `border` on the quiet `surface`, radius
 * 8px, a 14px glyph and the words in muted 13px, the key in a cap at the end. Under the pointer the
 * plane lights as a row does. A `<button>`, not an `<input>`: it holds no text, so a screen reader
 * should meet a control that opens something, named by its words, and not an empty field.
 *
 * Full width with `min-w-0`, so the host gives it its width (the top bar: up to 460px between its
 * ends) and the words lose their tail before the key does. `className` is not accepted, as on
 * `Button`; the `ref` and every other prop reach the `<button>`, so it can be the trigger of a
 * `Popover` as well.
 */
export function SearchFieldButton({
  placeholder,
  shortcut,
  icon = 'search',
  ...props
}: SearchFieldButtonProps) {
  // Dropped at runtime too: a caller working around the type keeps the field's look all the same.
  const { className: _className, style: _style, ...rest } = props as ComponentPropsWithRef<'button'>
  const { shortcuts } = useUi()
  const key = shortcut === undefined || shortcut === '' ? undefined : shortcut
  return (
    <button
      type="button"
      aria-keyshortcuts={key === undefined ? undefined : shortcuts.aria(key)}
      {...rest}
      className="no-drag inline-flex h-(--nt-control-sm) w-full min-w-0 items-center gap-2 rounded-md border border-border bg-surface ps-2.5 pe-1.5 text-[13px] text-muted outline-focus transition-colors duration-(--nt-duration-fast) ease-(--nt-ease) hover:bg-surface-hover hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <Icon name={icon} size="sm" />
      <span className="min-w-0 flex-1 truncate text-start">{placeholder}</span>
      {key === undefined ? null : (
        <span aria-hidden="true" className="flex shrink-0">
          <Kbd shortcut={key} tone="menu" />
        </span>
      )}
    </button>
  )
}
