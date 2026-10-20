import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, test } from 'vitest'

// Read from disk: no DOM involved, so this runs fine under happy-dom with `css: false`.
const tokensCss = readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8')
const themeCss = readFileSync(join(import.meta.dirname, 'theme.css'), 'utf8')

/**
 * Names that look like a class of ours but style nothing: the symbol ids of `file-icons.ts` and
 * the hooks `PierreDiff` hangs on its scroller for a host's test.
 */
const NOT_STYLED = /^nt-(file-icon-[a-z]+|icon-(chevron|ellipsis)|pierre-(diff|file))$/

/** The global classes of the theme a component carries besides its `nt-` classes. */
const GLOBAL = ['no-drag', 'drag-region']

/** Every component module: no test, no story. */
function components(directory = import.meta.dirname): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return components(path)
    if (!/\.tsx?$/.test(entry.name) || /\.(test|gallery)\.tsx?$/.test(entry.name)) return []
    return [path]
  })
}

/** The `nt-` class names a module writes in its strings, never a `--nt-` variable. */
function classesIn(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  return [...code.matchAll(/(?<![-\w])nt-[a-z0-9-]+/g)].map((match) => match[0])
}

/** Whether `css` has a rule whose selector names the class. */
function defines(css: string, name: string): boolean {
  return new RegExp(`\\.${name}(?![\\w-])[^{}]*\\{`).test(css)
}

describe('theme.css', () => {
  test('defines every nt- class a component carries, or tokens.css does', () => {
    const missing = components().flatMap((file) =>
      classesIn(readFileSync(file, 'utf8'))
        .filter((name) => !NOT_STYLED.test(name))
        .filter((name) => !defines(themeCss, name) && !defines(tokensCss, name))
        .map((name) => `${relative(import.meta.dirname, file)}: ${name}`),
    )
    expect(missing, 'a class without a rule in theme.css or tokens.css').toEqual([])
  })

  test.each(GLOBAL)('defines %s, which the components carry', (name) => {
    expect(defines(themeCss, name)).toBe(true)
  })

  test('finds the classes the components use', () => {
    const used = new Set(components().flatMap((file) => classesIn(readFileSync(file, 'utf8'))))
    for (const name of ['nt-spin', 'nt-shape-spin', 'nt-shimmer', 'nt-fade-in', 'nt-wave']) {
      expect(used.has(name), name).toBe(true)
    }
  })

  test('maps the tokens to Tailwind names in one @theme inline block', () => {
    expect(themeCss.match(/@theme inline\s*\{/g)).toHaveLength(1)
    expect(themeCss).toContain('--color-accent: var(--nt-accent);')
  })

  test('imports neither Tailwind nor the tokens, so a host loads each once', () => {
    expect(themeCss).not.toMatch(/^@import/m)
  })

  test('keeps the app to the app: no body, no window scrollbar, no layout of Orbit', () => {
    expect(themeCss).not.toMatch(/(^|\n)\s*(html|body|#root)\b[^{]*\{/)
    expect(themeCss).not.toContain('::-webkit-scrollbar')
    expect(themeCss).not.toMatch(/\.(titlebar|sidebar|panel|drag-strip)\s*\{/)
  })
})
