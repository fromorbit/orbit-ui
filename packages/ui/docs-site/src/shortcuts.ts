import type { Platform, ShortcutPort } from '../../src'
import { fakeShortcuts } from '../../src/testing'

/** The key of one command per convention, and what a screen reader hears; `null` is no key there. */
interface PageCommand {
  mac: string
  other: string | null
  aria: { mac: string; other: string | null }
}

/** A letter of the panel's start cards: the same key on every platform. */
function letter(key: string): PageCommand {
  return { mac: key, other: key, aria: { mac: key, other: key } }
}

/**
 * The keys Orbit draws for the command ids its stories name, copied from Orbit's shortcut
 * catalogue and its Dutch letters.
 *
 * The stories came from Orbit and still name its ids; the library's `fakeShortcuts` knows only
 * `demo.*` and would draw the id itself as a key. This table lives in the page, not in the package,
 * so the library still names no host's ids.
 */
export const ORBIT_KEYS: Readonly<Record<string, PageCommand>> = {
  'chat.new': { mac: '⌘N', other: 'Ctrl+N', aria: { mac: 'Meta+N', other: 'Control+N' } },
  'document.comment': {
    mac: '⇧⌘M',
    other: 'Ctrl+Shift+M',
    aria: { mac: 'Meta+Shift+M', other: 'Control+Shift+M' },
  },
  'document.sendSelection': {
    mac: '⌘L',
    other: 'Ctrl+L',
    aria: { mac: 'Meta+L', other: 'Control+L' },
  },
  'panel.start.browser': letter('B'),
  'panel.start.changes': letter('W'),
  'panel.start.files': letter('E'),
  'panel.start.subagents': letter('S'),
  'panel.start.terminal': letter('T'),
  'panel.toggle': {
    mac: '⌥⌘B',
    other: 'Ctrl+Shift+B',
    aria: { mac: 'Meta+Alt+B', other: 'Control+Shift+B' },
  },
  'sdd.scope.forYou': { mac: '⌥⌘1', other: null, aria: { mac: 'Meta+Alt+1', other: null } },
  'sdd.scope.open': { mac: '⌥⌘2', other: null, aria: { mac: 'Meta+Alt+2', other: null } },
  'sdd.scope.all': { mac: '⌥⌘3', other: null, aria: { mac: 'Meta+Alt+3', other: null } },
  'settings.toggle': { mac: '⌘,', other: 'Ctrl+,', aria: { mac: 'Meta+,', other: 'Control+,' } },
  'sidebar.toggle': { mac: '⌘B', other: 'Ctrl+B', aria: { mac: 'Meta+B', other: 'Control+B' } },
}

/** A value shaped like a command id (`chat.send`), as opposed to a written-out key (`⌘K`). */
const ID_SHAPE = /^[a-z][a-zA-Z]*(\.[a-zA-Z]+)+$/

/**
 * The `ShortcutPort` of the docs page: Orbit's keys for its ids, `fakeShortcuts` for `demo.*`, and
 * no key for any other id-shaped value, which is what Orbit's adapter does with an id it does not
 * know (`chat.send` has no key in Orbit). A written-out key is drawn as it stands.
 */
export function docsShortcuts(platform: Platform): ShortcutPort {
  const demo = fakeShortcuts(platform)
  const convention = platform === 'mac' ? 'mac' : 'other'
  return {
    label(id) {
      const known = ORBIT_KEYS[id]
      if (known) return known[convention] ?? undefined
      if (id.startsWith('demo.')) return demo.label(id)
      return ID_SHAPE.test(id) ? undefined : id
    },
    aria(id) {
      const known = ORBIT_KEYS[id]
      if (known) return known.aria[convention] ?? undefined
      return id.startsWith('demo.') ? demo.aria(id) : undefined
    },
  }
}
