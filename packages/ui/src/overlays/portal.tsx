import { createContext, type ReactNode, useContext } from 'react'

/**
 * The element every floating layer portals into; `null` until the screen around it has painted.
 *
 * Deliberately not a default of `document.body`: a layer outside the app root escapes the subtree
 * that carries `--nt-app-background` and the stacking context of the window, and in the gallery it
 * would also fall outside the stage that axe checks and that the screenshots are clipped to.
 */
const PortalContainerContext = createContext<HTMLElement | null>(null)

/**
 * Names the element that floating layers below it mount into.
 *
 * The app points it at a box inside its own root, the gallery at its stage. One provider per
 * screen, so a layer never has to know which of the two it is running in.
 *
 * `container` is a DOM node, which a screen only holds after its first render: the very first
 * render therefore always passes `null`, and a layer must simply cope with that instead of
 * throwing. That is why there is no `usePortalContainer` that demands a provider, unlike
 * `useBridge`.
 */
export function PortalContainerProvider({
  container,
  children,
}: {
  container: HTMLElement | null
  children: ReactNode
}) {
  return (
    <PortalContainerContext.Provider value={container}>{children}</PortalContainerContext.Provider>
  )
}

/** Where this subtree's floating layers belong; `null` means "wherever the layer itself defaults". */
export function usePortalContainer(): HTMLElement | null {
  return useContext(PortalContainerContext)
}
