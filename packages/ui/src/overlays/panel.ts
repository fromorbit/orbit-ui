/**
 * Everything a floating panel fixes, shared by every layer in `overlays/`.
 *
 * The frame (radius, border, `--nt-overlay-background`, `--nt-shadow-menu`) and the layer
 * (`--nt-z-popover`) are the same for all of them: a panel is never a hole in the window material,
 * and it never has to guess which z-index puts it above the chat. `p-1` is the frame around rows of
 * a list, the content such a panel almost always holds; anything else the caller builds inside it.
 *
 * `max-h-72` with its own scroll caps a list that grows: past that the panel scrolls instead of
 * running off the window, and `overscroll-contain` keeps the last flick of that scroll to itself
 * rather than passing it on to the conversation behind it. `min-w-40` keeps a panel with two short
 * rows from looking like a tooltip; the width beyond that comes from the children.
 *
 * `no-drag` because a layer may well float over the title bar, where a click would otherwise drag
 * the window instead of choosing a row. `outline-none` because the panel itself is focusable only
 * programmatically (Radix's focus scope parks focus on it when it holds nothing focusable), and the
 * browser's own ring around a whole panel reads as a selection that is not there.
 *
 * A near copy of this string lives in `primitives/Select.tsx`. That is knowing duplication: a layer
 * imports only downward, so `primitives/` may not reach into `overlays/`. Change one, change both.
 */
export const PANEL =
  'no-drag nt-fade-in z-(--nt-z-popover) max-h-72 min-w-40 overflow-y-auto overscroll-contain rounded-lg border border-border bg-overlay p-1 shadow-menu outline-none'

/**
 * The frame of a wide panel that shows a document rather than rows: a file's preview.
 *
 * The same material as `PANEL`, 640px wide or as much as the window has, at most 60% of the
 * window's height; no padding and no scroll of its own, because the content brings a header that
 * stays and a region that scrolls.
 */
export const WIDE_PANEL =
  'no-drag nt-fade-in z-(--nt-z-popover) flex max-h-[60vh] w-[640px] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-lg border border-border bg-overlay shadow-menu outline-none'

/**
 * The frame of a `Dialog`: the material of `PANEL`, centred on the window, on its own layer.
 *
 * `--nt-z-dialog` rather than `--nt-z-popover`: a dialog stands above every popover and below a
 * toast (`tokens.css`). 32rem wide or as much as the window has, at most 80% of its height; no
 * padding and no scroll of its own, because a dialog brings a header and a footer that stay and a
 * body that scrolls between them.
 */
export const DIALOG_PANEL =
  'no-drag nt-fade-in fixed top-1/2 left-1/2 z-(--nt-z-dialog) flex max-h-[80vh] w-[32rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-overlay shadow-menu outline-none'

/**
 * The frame of a `Dialog` with `size="wide"`: the material of `DIALOG_PANEL`, for a form of
 * two columns such as the Expert editor. At most 60rem wide (or the window minus 4rem), and a
 * height of its own, 44rem or 85% of the window: each column then scrolls by itself between the
 * header and the footer, rather than the whole body.
 */
export const WIDE_DIALOG_PANEL =
  'no-drag nt-fade-in fixed top-1/2 left-1/2 z-(--nt-z-dialog) flex h-[min(44rem,85vh)] w-[60rem] max-w-[calc(100vw-4rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-overlay shadow-menu outline-none'

/**
 * The frame of a `Spotlight`: the material of `PANEL`, on the dialog layer, centred across the
 * window and hung 12vh below its top edge rather than in its middle — where Raycast, Linear and
 * macOS Spotlight put it, so the field stays where the eye left it while the rows below it grow
 * and shrink. 560px wide or as much as the window has; `p-1` frames the rows like any list panel.
 */
export const SPOTLIGHT_PANEL =
  'no-drag nt-fade-in fixed top-[12vh] left-1/2 z-(--nt-z-dialog) flex w-[560px] max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-border bg-overlay p-1 shadow-menu outline-none'
