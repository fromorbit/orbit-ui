import type { ComponentType } from 'react'

/** A component shown in the gallery, grouped and split into the states it can be in. */
export interface Story {
  /**
   * The layer a story belongs to: the three of `shared/ui`, and `features` for the few screens
   * whose shape only shows in place — the line under the composer is the first.
   */
  group: 'primitives' | 'overlays' | 'patterns' | 'features'
  title: string
  /**
   * One entry per state; the key is the caption shown above it.
   *
   * A state is a component, not a plain function: `index.tsx` mounts it with `createElement`
   * rather than calling it inline, so it may hold its own state with `useState` (an openable
   * Popover, a search field) without becoming a hook of `GalleryView` itself. Calling it inline
   * would tie its hooks to the gallery's own hook order, which breaks ("Rendered more hooks than
   * during the previous render", or worse, silently reads another story's state) the moment the
   * gallery switches to a different story.
   */
  states: Record<string, ComponentType>
}

/**
 * Display order of the groups; not alphabetical, so `primitives` leads.
 *
 * `features` comes last, so a story added there moves no existing story in the nav — and so no
 * reference image of the gallery shifts because of it.
 */
const groupOrder: Story['group'][] = ['primitives', 'overlays', 'patterns', 'features']

/** Lowercase words joined by hyphens: safe in a hash, a selector and a file name. */
function slug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Stable id for a story, used as its nav link and hash: `'primitives-empty-state'`. */
export function storyId(story: Pick<Story, 'group' | 'title'>): string {
  return `${story.group}-${slug(story.title)}`
}

/**
 * Stable id for one state of a story, from its caption: `'with-a-unit'`.
 *
 * The screenshot test takes one reference per state and names the file after it. A whole story can
 * be taller than the window, and the scrolling stage cuts such a screenshot off.
 */
export function stateId(caption: string): string {
  return slug(caption)
}

/**
 * Turns stories into a sorted list: the modules from `import.meta.glob('**\/*.gallery.tsx', {
 * eager: true })`, or a list such as the library's `stories`.
 *
 * Sorted by group then title so the nav order is stable regardless of glob, file or list order;
 * titles in English collation, so a machine in another locale keeps the same order (and the same
 * reference images).
 *
 * @throws if two stories resolve to the same id, since that id is also the nav link and the hash
 * route.
 */
export function collectStories(
  modules: Record<string, { default: Story }> | readonly Story[],
): Story[] {
  const list = Array.isArray(modules)
    ? [...(modules as readonly Story[])]
    : Object.values(modules as Record<string, { default: Story }>).map((module) => module.default)
  const stories = list.sort((a, b) => {
    const groupDiff = groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group)
    return groupDiff !== 0 ? groupDiff : a.title.localeCompare(b.title, 'en')
  })

  const seen = new Set<string>()
  for (const story of stories) {
    const id = storyId(story)
    if (seen.has(id)) throw new Error(`Two stories share the same id: ${id}`)
    seen.add(id)
  }
  return stories
}
