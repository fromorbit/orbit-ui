import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { docsShortcuts } from './shortcuts'

/** Every command id a story names in a `shortcut` prop or field. */
function storyShortcutIds(): string[] {
  const root = join(__dirname, '../../src')
  const files = readdirSync(root, { recursive: true, encoding: 'utf8' }).filter((file) =>
    file.endsWith('.gallery.tsx'),
  )
  const ids = new Set<string>()
  for (const file of files) {
    const source = readFileSync(join(root, file), 'utf8')
    for (const match of source.matchAll(
      /[sS]hortcut(?:=|: )["']([a-z][a-zA-Z]*(?:\.[a-zA-Z]+)+)["']/g,
    )) {
      ids.add(match[1] as string)
    }
  }
  return [...ids].sort()
}

/** Ids a story names that Orbit binds to no key, so the page draws none either. */
const UNBOUND_IN_ORBIT = ['chat.send']

describe('the shortcuts of the docs page', () => {
  test('draw a key for every id a story names, never the id itself', () => {
    const port = docsShortcuts('mac')
    const ids = storyShortcutIds().filter((id) => !UNBOUND_IN_ORBIT.includes(id))
    expect(ids.length).toBeGreaterThan(0)
    for (const id of ids) {
      const label = port.label(id)
      expect(label, id).toBeDefined()
      expect(label, id).not.toBe(id)
    }
  })

  test('draw no key for an id it does not know', () => {
    expect(docsShortcuts('mac').label('chat.send')).toBeUndefined()
    expect(docsShortcuts('mac').aria('chat.send')).toBeUndefined()
  })

  test('follow the platform', () => {
    expect(docsShortcuts('mac').label('document.comment')).toBe('⇧⌘M')
    expect(docsShortcuts('windows').label('document.comment')).toBe('Ctrl+Shift+M')
    expect(docsShortcuts('windows').label('sdd.scope.all')).toBeUndefined()
  })

  test('draw a written-out key as it stands', () => {
    expect(docsShortcuts('mac').label('⌘K')).toBe('⌘K')
  })
})
