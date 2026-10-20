import { ScrollArea as RadixScrollArea } from 'radix-ui'
import type { ReactNode } from 'react'

/** The props of `ScrollArea`. */
export interface ScrollAreaProps {
  /**
   * Accessible name of the viewport, and the switch between this component's two shapes.
   *
   * With a label the viewport becomes a named region the keyboard can reach and scroll
   * (`role="region"`, `aria-label`, `tabIndex={0}`): that is the case where the content itself
   * holds nothing focusable, so without it the region would be mouse-only. Leave the label out
   * when the content brings its own focusable elements (a list of buttons, say): the viewport is
   * then not a tab stop and carries no role or name, since a second, nameless stop between those
   * elements is only noise — and a focusable region without a name is what axe's
   * `scrollable-region-focusable` (WCAG 4.1.2) is about.
   */
  label?: string
  children: ReactNode
}

/**
 * Vertically scrolling region, wrapping Radix's `ScrollArea` once here per the UI guidelines
 * (a Radix primitive is wrapped once and used everywhere else through that wrapper).
 *
 * The caller gives the surrounding box its height (e.g. `h-72`); this component only fills
 * whatever height and width it is given.
 */
export function ScrollArea({ label, children }: ScrollAreaProps) {
  // All three attributes or none: a tab stop exists here only to carry a name, and a name only
  // matters on something that can be reached. Blank text is no name, so it is no label either.
  const named = label !== undefined && label.trim() !== ''
  const region = named ? ({ role: 'region', 'aria-label': label, tabIndex: 0 } as const) : {}

  return (
    <RadixScrollArea.Root type="auto" className="h-full w-full overflow-hidden">
      <RadixScrollArea.Viewport
        {...region}
        // `[&>div]:block!` overrides Radix, which wraps the viewport's children in a div of its
        // own with the inline style `min-width: 100%; display: table`. A table box is
        // shrink-to-fit: it grows to its widest child, so a row that should truncate widens the
        // wrapper to its full text instead, drags every sibling row out of the column with it and
        // makes the whole area scroll sideways. As a block box the wrapper is simply the width of
        // the viewport, which is what a truncating child needs to measure itself against. The
        // `!` is not optional: the style it beats is inline, and unreachable through any prop.
        //
        // Written out per branch, not assembled: Tailwind only generates classes it can read as
        // whole strings in the source.
        className={
          named
            ? 'no-drag h-full w-full outline-focus focus-visible:outline-2 focus-visible:outline-offset-2 [&>div]:block!'
            : 'no-drag h-full w-full [&>div]:block!'
        }
      >
        {children}
      </RadixScrollArea.Viewport>
      <RadixScrollArea.Scrollbar
        orientation="vertical"
        className="flex w-2 touch-none select-none p-0.5"
      >
        <RadixScrollArea.Thumb className="flex-1 rounded-full bg-border transition-colors duration-100 hover:bg-muted" />
      </RadixScrollArea.Scrollbar>
    </RadixScrollArea.Root>
  )
}
