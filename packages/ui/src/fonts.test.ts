import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

// Read from disk: no DOM involved, so this runs fine under happy-dom with `css: false`.
// Without its comments: the example of how a host loads the stylesheets is not an import.
const fontsCss = readFileSync(join(import.meta.dirname, 'fonts.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
)
const tokensCss = readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8')
const manifest = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'),
) as { dependencies: Record<string, string>; exports: Record<string, unknown> }

/** The specifiers of the `@import`s of a stylesheet. */
function importsOf(css: string): string[] {
  return [...css.matchAll(/@import\s+["']([^"']+)["']/g)].map((match) => match[1] ?? '')
}

/** The package a bare specifier belongs to: `@scope/name` of `@scope/name/file.css`. */
function packageOf(specifier: string): string {
  return specifier.split('/').slice(0, 2).join('/')
}

/** The first family of a font token in `tokens.css`, without its quotes. */
function firstFamily(token: string): string {
  const value = new RegExp(`${token}:\\s*([^;]+);`).exec(tokensCss)?.[1] ?? ''
  return (value.split(',')[0] ?? '').trim().replace(/^["']|["']$/g, '')
}

describe('fonts.css', () => {
  test('is an entry point of the package', () => {
    expect(manifest.exports['./fonts.css']).toEqual({ default: './dist/fonts.css' })
  })

  test('loads the faces from dependencies of the package, never from another origin', () => {
    const imports = importsOf(fontsCss)
    expect(imports.length).toBeGreaterThan(0)
    for (const specifier of imports) {
      expect(manifest.dependencies[packageOf(specifier)], specifier).toBeDefined()
    }
    expect(fontsCss).not.toMatch(/https?:|\/\//)
  })

  test('loads the families tokens.css names first', () => {
    expect(firstFamily('--nt-font-sans')).toBe('Outfit Variable')
    expect(firstFamily('--nt-font-mono')).toBe('DM Mono')
    expect(importsOf(fontsCss)).toEqual([
      '@fontsource-variable/outfit/wght.css',
      '@fontsource/dm-mono/400.css',
      '@fontsource/dm-mono/500.css',
    ])
  })

  test('never lets the browser smear a bold into DM Mono', () => {
    expect(fontsCss).toMatch(/font-synthesis-weight:\s*none/)
  })
})
