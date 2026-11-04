import { createElement, type ReactNode, useState } from 'react'
import { PortalContainerProvider } from '../overlays/portal'

/**
 * The stage of a story whose modal layer starts open: a box of the given height that the layer
 * opens in, scrim and all, instead of over the whole gallery.
 *
 * The box is a containing block (`transform`), so the layer's `fixed` panel and scrim are placed
 * against it, and the provider is `contained`, so the layer is not modal: the theme switch, the
 * search and the other stories stay in reach while it stands open.
 */
export function LayerStage({
  height = 440,
  children,
}: {
  height?: number
  children: ReactNode
}): ReactNode {
  const [box, setBox] = useState<HTMLElement | null>(null)
  return createElement(
    'div',
    {
      ref: setBox,
      'data-nt-layer-stage': '',
      className: 'relative w-full transform-gpu overflow-hidden rounded-lg bg-canvas',
      style: { height },
    },
    box === null
      ? null
      : createElement(PortalContainerProvider, { container: box, contained: true, children }),
  )
}
