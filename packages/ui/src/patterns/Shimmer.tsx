import type { ReactElement, ReactNode } from 'react'

/**
 * Runs a band of light across its children while something is happening.
 *
 * Two layers rather than a gradient clipped to the text (`color: transparent` combined with
 * `background-clip: text`): that trick only works on text, so it cannot run over an icon; it
 * paints letters in `transparent`, which `forced-colors` mode turns into an invisible line; and
 * switching it off for `prefers-reduced-motion` still leaves the transparent letters behind. This
 * draws a second, `aria-hidden` copy of the children in the full text colour, laid exactly over
 * the real ones, and slides a soft, 72px-wide mask across it (`.nt-wave`, `styles/index.css`). The
 * copy itself never moves — only the window does — so the band appears to travel while nothing it
 * lights up seems to move. Under reduced motion the whole overlay disappears (`opacity: 0`) and
 * what is left is exactly the plain line below it.
 *
 * The price is that the children stand twice in the DOM whenever this runs. For one line of text
 * that is cheap, and the copy is `aria-hidden`, so a screen reader never hears it twice.
 *
 * 72px sits on the 4px grid and is roughly three words at 12px; 2.2s is slower than the spinner
 * (0.8s) and the skeleton's pulse (1.5s), so the line reads as "something is running" rather than
 * as "something is waiting".
 */
export function Shimmer({
  active,
  children,
}: {
  /**
   * Whether the band runs. `false` draws no overlay, and the wrapper takes no box of its own
   * (`display: contents`), so the children lay out exactly as they would on their own.
   */
  active: boolean
  children: ReactNode
}): ReactElement {
  // One shape in both states: the same wrapper, the children always its first child, and only the
  // overlay coming and going. Returning the bare children when quiet would make React replace
  // their nodes the moment the band stops, and inside a `role="log"` a replaced node is new text
  // that is read out again.
  return (
    <span className={active ? 'relative overflow-hidden' : 'contents'}>
      {children}
      {active ? (
        <span aria-hidden="true" className="nt-wave text-fg">
          {children}
        </span>
      ) : null}
    </span>
  )
}
