/** Where a line stands on screen: its top and its height, as `getBoundingClientRect` gives them. */
export interface LineBox {
  top: number
  height: number
}

/** The region that scrolls, measured the same way, with how far it scrolled and can scroll. */
export interface ScrollRegion {
  top: number
  /** The visible height (`clientHeight`). */
  height: number
  scrollTop: number
  scrollHeight: number
}

/**
 * The `scrollTop` that brings a named line into the middle of the region that scrolls, with the
 * lines above it in view as context, and never past either end of the file.
 *
 * Computed rather than left to `scrollIntoView`: that scrolls every ancestor too, and a preview in
 * a popover or a tab has ancestors that must stay where they are. A wrapped line taller than the
 * region shows its first row at the top, where its number stands.
 */
export function scrollTopForLine(line: LineBox, region: ScrollRegion): number {
  const offset = region.scrollTop + line.top - region.top
  const wanted =
    line.height >= region.height ? offset : offset + line.height / 2 - region.height / 2
  const end = Math.max(0, region.scrollHeight - region.height)
  return Math.min(end, Math.max(0, wanted))
}
