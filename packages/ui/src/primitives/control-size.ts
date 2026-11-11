/** The three sizes a control (button, field, …) can take; a switch keeps its own fixed shape. */
export type ControlSize = 'sm' | 'md' | 'lg'

/**
 * Height per control size, with no text size attached, for a control that has no visible text to
 * scale — an icon-only button (`IconButton`) — so it never carries a `text-[…px]` class that does
 * nothing but sit in the class list.
 *
 * The class names are written out in full, not assembled from a shared token string: Tailwind
 * finds utility classes by scanning the literal text of source files, not by evaluating them, so a
 * class built at runtime from `` `h-(${token})` `` never appears as the exact text `h-(--nt-control-
 * sm)` anywhere and silently never gets generated. `controlSize` and `controlSquare` below both
 * read from here (`controlSize` appends its own literal text size), so this map is the one place
 * the three heights are written.
 */
export const controlHeight: Record<ControlSize, string> = {
  sm: 'h-(--nt-control-sm)',
  md: 'h-(--nt-control-md)',
  lg: 'h-(--nt-control-lg)',
}

/**
 * Height and text size per control size, spread into a component's `cva` variants as `size`.
 *
 * One shared map instead of a copy per component, so a new size (or a size change) is one line
 * here instead of a change at every call site that renders a control (with visible text — see
 * `controlHeight` for one that has none).
 */
export const controlSize: Record<ControlSize, string> = {
  sm: `${controlHeight.sm} text-[12px]`,
  md: `${controlHeight.md} text-[13px]`,
  lg: `${controlHeight.lg} text-[13px]`,
}

/**
 * Width per control size, matching `controlHeight` from the same token (`--nt-control-*`), for a
 * square control that has no text to size around, such as `IconButton`.
 */
export const controlSquare: Record<ControlSize, string> = {
  sm: 'w-(--nt-control-sm)',
  md: 'w-(--nt-control-md)',
  lg: 'w-(--nt-control-lg)',
}

/**
 * The sizes that have a horizontal padding: the three of `ControlSize` and the `xs` of `Button`,
 * which only a button takes.
 */
export type ControlPadSize = ControlSize | 'xs'

/**
 * Horizontal padding per size, as `Button` pads its text: the one source of that padding.
 *
 * Exported for what has to line up with the text of a button rather than look like one: the
 * read-only `PickerPill`, or a line in a host whose glyph stands under the first letter of a
 * ghost button. Read from here, such a line moves with the family when the padding changes,
 * instead of keeping a copied `px-2.5`. Written out in full, like `controlHeight`, so a
 * consumer's Tailwind finds the classes in `dist/`.
 */
export const controlPadX: Record<ControlPadSize, string> = {
  xs: 'px-1.5',
  sm: 'px-2.5',
  md: 'px-3',
  lg: 'px-4',
}

/**
 * Only the end of `controlPadX`, for a button whose start is set by the row it sits in
 * (`Button` `rowInset`).
 */
export const controlPadEnd: Record<ControlPadSize, string> = {
  xs: 'pe-1.5',
  sm: 'pe-2.5',
  md: 'pe-3',
  lg: 'pe-4',
}

/**
 * `controlPadX` in pixels, for an offset that has to be computed rather than taken as a class,
 * such as an inline `style` of `13 - controlPadXPx.sm`. The same in either density: the density
 * changes heights, not padding.
 */
export const controlPadXPx: Record<ControlPadSize, number> = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 16,
}
