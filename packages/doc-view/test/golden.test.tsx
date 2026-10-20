// @vitest-environment node
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Nodes, Root } from 'mdast'
import { renderToStaticMarkup } from 'react-dom/server'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { describe, expect, test } from 'vitest'
import {
  type DocFocusRange,
  DocProse,
  type DocProseLabels,
  highlightCode,
  outlineOf,
} from '../src/index'

/**
 * The golden examples: markdown in `fixtures/*.md`, with what this package makes of it beside it —
 * `*.html` from `DocProse`, `*.json` with `outlineOf` and the Shiki tokens of every fenced block.
 * The website copies `fixtures/` with `src/` and checks its copy against them, so a
 * change in a dependency or in the view shows there as a red test.
 *
 * The recipe, which the website repeats exactly: the labels of `fixtures/labels.json`, every link
 * offered to `linkable` accepted (the package's own rule still keeps every other scheme text), no
 * image loader, the headings of `outlineOf`, frontmatter and a section Contract folded
 * (`foldTechnical`), no highlighting in the HTML (the tokens stand in the JSON,
 * from a second, warm pass of `highlightCode`), the focus of
 * `<name>.focus.json` when it has one, rendered with `renderToStaticMarkup`.
 *
 * `NT_GOLDEN_UPDATE=1 bunx vitest run --project doc-view` writes them anew; read the diff.
 */
const FIXTURES = resolve(import.meta.dirname, '../fixtures')
const UPDATE = process.env.NT_GOLDEN_UPDATE === '1'
const LABELS = JSON.parse(readFileSync(join(FIXTURES, 'labels.json'), 'utf8')) as DocProseLabels
const names = readdirSync(FIXTURES)
  .filter((file) => file.endsWith('.md'))
  .map((file) => file.slice(0, -'.md'.length))
  .sort()

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkFrontmatter, ['yaml'])

/** The fenced blocks of a source, with the language their fence names. */
function fences(markdown: string): { language: string | null; value: string }[] {
  const found: { language: string | null; value: string }[] = []
  const walk = (node: Nodes): void => {
    if (node.type === 'code') found.push({ language: node.lang ?? null, value: node.value })
    if ('children' in node) for (const child of node.children) walk(child)
  }
  walk(processor.runSync(processor.parse(markdown)) as Root)
  return found
}

function html(markdown: string, focus: DocFocusRange[] | null = null): string {
  const headings = outlineOf(markdown).map(({ from, anchor }) => ({ from, anchor }))
  return `${renderToStaticMarkup(
    <DocProse
      markdown={markdown}
      labels={LABELS}
      linkable={() => true}
      onLink={() => {}}
      headings={headings}
      frontmatter="folded"
      foldTechnical
      focus={focus}
    />,
  )}\n`
}

/** The focus a fixture is drawn with: `<name>.focus.json` beside it, or none. */
function focusOf(name: string): DocFocusRange[] | null {
  const path = join(FIXTURES, `${name}.focus.json`)
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as DocFocusRange[]) : null
}

async function facts(markdown: string): Promise<string> {
  const code = []
  for (const fence of fences(markdown)) {
    const language = fence.language ?? undefined
    // Shiki gives up on a line after 500 ms and leaves the rest as one token. A cold grammar
    // compiles its expressions on the first line, which a loaded machine can push past that
    // limit, so the golden tokens are those of a second, warm pass.
    await highlightCode(fence.value, language)
    code.push({ language: fence.language, tokens: await highlightCode(fence.value, language) })
  }
  return `${JSON.stringify({ outline: outlineOf(markdown), code }, null, 2)}\n`
}

/** Compares with the file beside the fixture, or writes it anew when asked to. */
function golden(file: string, actual: string): void {
  const path = join(FIXTURES, file)
  if (UPDATE) writeFileSync(path, actual)
  expect(actual, file).toBe(readFileSync(path, 'utf8'))
}

describe('golden examples', () => {
  test('there are some', () => {
    expect(names.length).toBeGreaterThanOrEqual(6)
  })

  test.each(names)('%s renders as its HTML', (name) => {
    golden(`${name}.html`, html(readFileSync(join(FIXTURES, `${name}.md`), 'utf8'), focusOf(name)))
  })

  test('the focus example marks the blocks of the focus with nt-doc-focus', () => {
    const page = readFileSync(join(FIXTURES, 'focus.html'), 'utf8')
    const lit = [...page.matchAll(/<(\w+)[^>]*class="[^"]*nt-doc-focus[^"]*"/g)].map((m) => m[1])
    // The second item of the list and the second row of the table, each on its own: no list or
    // table as a whole, and never the paragraph between them.
    expect(lit).toEqual(['li', 'tr'])
  })

  test.each(names)('%s has its outline and code tokens', async (name) => {
    golden(`${name}.json`, await facts(readFileSync(join(FIXTURES, `${name}.md`), 'utf8')))
  })

  test('the unsafe example holds nothing that runs or loads', () => {
    const page = readFileSync(join(FIXTURES, 'unsafe.html'), 'utf8')
    for (const needle of ['<script', '<img', '<iframe', '<b>', '<details open', '<a ']) {
      expect(page, needle).not.toContain(needle)
    }
  })

  test('the links example links only a path, an anchor and an address for a browser', () => {
    const page = readFileSync(join(FIXTURES, 'links-and-images.html'), 'utf8')
    const hrefs = [...page.matchAll(/href="([^"]*)"/g)].map((match) => match[1])
    expect(hrefs).toEqual([
      '#',
      '#',
      '#',
      'https://voorbeeld.test/winkel',
      'mailto:winkel@voorbeeld.test',
      'https://voorbeeld.test',
    ])
    expect(page).not.toContain('<img')
  })
})
