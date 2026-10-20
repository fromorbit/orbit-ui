import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { type DocIconKind, DocKindIcon, type DocStatusCategory } from '../src/index'

const CATEGORIES: readonly DocStatusCategory[] = ['concept', 'review', 'active', 'done', 'closed']

function icon(kind: DocIconKind, category: DocStatusCategory) {
  const { container, unmount } = render(<DocKindIcon kind={kind} category={category} />)
  const svg = container.querySelector('[data-nt-doc-icon]')
  if (!svg) throw new Error('No icon drawn.')
  return { svg, unmount }
}

test('each kind draws a glyph of its own', () => {
  const kinds = ['spec', 'decision', 'plan', 'convention', 'other', 'step'] as const
  const glyphs = kinds.map((kind) => {
    const { svg, unmount } = icon(kind, 'concept')
    const glyph = svg.getAttribute('data-glyph')
    expect(svg.getAttribute('data-kind'), kind).toBe(kind)
    unmount()
    return glyph
  })
  expect(glyphs).toEqual(['file-text', 'gavel', 'clipboard-list', 'ruler', 'file', 'square'])
})

test.each(['spec', 'decision', 'plan', 'convention', 'other'] as const)(
  'a %s carries its status as a badge cut out of its glyph',
  (kind) => {
    const badges = (['concept', 'review', 'active', 'done'] as const).map((category) => {
      const { svg, unmount } = icon(kind, category)
      const badge = svg.getAttribute('data-badge')
      // The cut-out: the glyph sits under a mask, the badge beside it.
      expect(svg.querySelector('mask'), category).not.toBeNull()
      expect(svg.querySelector('[data-nt-doc-badge]'), category).not.toBeNull()
      unmount()
      return badge
    })
    expect(badges).toEqual(['ring', 'dot', 'arc', 'check'])
  },
)

test('a closed document has no badge and is dimmed', () => {
  for (const kind of ['spec', 'decision', 'plan', 'convention', 'other'] as const) {
    const { svg, unmount } = icon(kind, 'closed')
    expect(svg.getAttribute('data-badge'), kind).toBe('none')
    expect(svg.querySelector('mask'), kind).toBeNull()
    expect(svg, kind).toHaveClass('nt-doc-icon-closed')
    unmount()
  }
})

test('the arc of work turns around its own middle', () => {
  const { svg } = icon('spec', 'active')
  expect(svg.querySelector('[data-nt-doc-badge]')).toHaveClass('nt-badge-spin')
})

test('the ruler turns a quarter, so the corner of the badge stays free', () => {
  const { svg } = icon('convention', 'review')
  expect(svg.querySelector('g[mask] > g')).toHaveAttribute('transform', 'rotate(90 12 12)')
})

test('a step carries its status in the box itself, without a badge', () => {
  const drawn = CATEGORIES.map((category) => {
    const { svg, unmount } = icon('step', category)
    expect(svg.querySelector('mask'), category).toBeNull()
    const result = `${svg.getAttribute('data-glyph')}:${svg.getAttribute('data-badge')}`
    unmount()
    return result
  })
  expect(drawn).toEqual([
    'square:none',
    'square:dot',
    'square:arc',
    'square-check:none',
    'square-minus:none',
  ])
})

test('a step at work turns an arc inside its box, like a document at work', () => {
  const { svg } = icon('step', 'active')
  expect(svg.querySelector('.nt-badge-spin')).not.toBeNull()
})

test('is decorative: the row around it says kind and status in words', () => {
  const { svg } = icon('plan', 'review')
  expect(svg).toHaveAttribute('aria-hidden', 'true')
})

test('two icons never share the id of their mask', () => {
  const { container } = render(
    <>
      <DocKindIcon kind="spec" category="done" />
      <DocKindIcon kind="spec" category="done" />
    </>,
  )
  const ids = [...container.querySelectorAll('mask')].map((mask) => mask.id)
  expect(ids).toHaveLength(2)
  expect(new Set(ids).size).toBe(2)
  // Only characters a url(#…) reference takes without escaping.
  for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]+$/)
})

test('sits in the 14px slot of a row glyph', () => {
  const { svg } = icon('spec', 'concept')
  expect(svg).toHaveClass('nt-doc-icon')
})

test('plain draws the glyph whole, without a badge or a dimmed tone, in the colour around it', () => {
  for (const category of CATEGORIES) {
    const { container, unmount } = render(<DocKindIcon kind="plan" category={category} plain />)
    const svg = container.querySelector('[data-nt-doc-icon]')
    expect(svg?.getAttribute('data-badge'), category).toBe('none')
    expect(svg?.querySelector('mask'), category).toBeNull()
    expect(svg?.getAttribute('class'), category).toBe('nt-doc-icon')
    unmount()
  }
})
