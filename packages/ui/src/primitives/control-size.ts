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
