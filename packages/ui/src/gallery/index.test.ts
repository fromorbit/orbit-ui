import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { galleryLabels, stories } from './index'
import { storyId } from './story'

/** The root of the library, one level up from this folder. */
const UI = resolve(import.meta.dirname, '..')

/** Every `*.gallery.tsx` under the library, as a path relative to this folder (`../primitives/Button.gallery`). */
function galleryFiles(directory = UI): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return galleryFiles(path)
    if (!entry.name.endsWith('.gallery.tsx')) return []
    return [relative(import.meta.dirname, path).replace(/\.tsx$/, '')]
  })
}

/** The modules `index.ts` imports, as written. */
function imported(): string[] {
  const source = readFileSync(join(import.meta.dirname, 'index.ts'), 'utf8')
  return [...source.matchAll(/^import\s+\w+\s+from\s+'([^']+)'/gm)].map((match) => match[1] ?? '')
}

describe('the gallery of the library', () => {
  test('lists every gallery file', () => {
    const listed = new Set(imported())
    const missing = galleryFiles().filter((file) => !listed.has(file))
    expect(missing, 'a story that index.ts does not import').toEqual([])
  })

  test('lists no gallery file twice and nothing that is not one', () => {
    const files = imported()
    expect(files.length, 'an import listed twice').toBe(new Set(files).size)
    expect(files.filter((file) => !file.endsWith('.gallery'))).toEqual([])
    expect(stories).toHaveLength(galleryFiles().length)
  })

  test('gives every story its own id', () => {
    const ids = stories.map(storyId)
    expect(ids.length).toBe(new Set(ids).size)
  })

  test('hands a host the words of the stories as galleryLabels', () => {
    expect(galleryLabels.copy.copiedLabel).toBe('Gekopieerd')
  })
})
