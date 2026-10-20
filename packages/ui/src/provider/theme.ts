import { useSyncExternalStore } from 'react'

/** The two palettes of `tokens.css`. */
export type Theme = 'light' | 'dark'

/**
 * The theme an element stands in: the nearest `data-theme` around it, dark without one (the
 * palette of `:root`).
 *
 * The attribute, not `prefers-color-scheme`: `tokens.css` switches its palette on it, the app's
 * preload puts the app's theme on `<html>`, and a gallery story can still put one on its
 * own element.
 */
export function themeOf(element: Element): Theme {
  const named = element.closest('[data-theme]')?.getAttribute('data-theme')
  return named === 'light' ? 'light' : 'dark'
}

/** Hears every change of `data-theme` on `<html>`. */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

/**
 * The theme of the document, live: the `data-theme` on `<html>` that `tokens.css` reads.
 *
 * For the libraries that take a theme of their own rather than reading the tokens — the diff and
 * the file of `@pierre/diffs`, the tree of `@pierre/trees`. It is also what a component of this
 * library follows when no `UiProvider` names a theme, so a host that only sets the attribute gets
 * diffs in the palette of the rest of its page.
 */
export function useDocumentTheme(): Theme {
  return useSyncExternalStore(subscribe, () => themeOf(document.documentElement))
}
