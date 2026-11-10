import type { MouseEvent } from 'react'

/**
 * The click handler of a navigation link that a host routes itself (`AppRail`, `SideNav`).
 *
 * A plain primary click goes to `onNavigate` instead of the browser, so a single-page host moves
 * without a reload; a click that asks for a new tab or window (a modifier key, the middle button)
 * stays the browser's, which is why the link keeps a real `href`. Without `onNavigate` the link is
 * an ordinary link.
 */
export function navClick(
  href: string,
  onNavigate: ((href: string) => void) | undefined,
): ((event: MouseEvent<HTMLAnchorElement>) => void) | undefined {
  if (onNavigate === undefined) return undefined
  return (event) => {
    if (event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    onNavigate(href)
  }
}
