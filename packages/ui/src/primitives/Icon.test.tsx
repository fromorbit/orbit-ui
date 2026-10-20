import { render } from '@testing-library/react'
import * as lucide from 'lucide-react'
import { expect, test } from 'vitest'
import { Icon, iconGlyph, iconNames, iconSymbol } from './Icon'

test('is decorative: hidden from assistive technology', () => {
  const { container } = render(<Icon name="check" />)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test('without size the size is md, from the icon token', () => {
  const { container } = render(<Icon name="check" />)
  expect(container.querySelector('svg')?.getAttribute('class')).toContain('size-(--nt-icon-md)')
})

test('size="sm" uses the small icon token', () => {
  const { container } = render(<Icon name="search" size="sm" />)
  expect(container.querySelector('svg')?.getAttribute('class')).toContain('size-(--nt-icon-sm)')
})

test('size="xs" uses the extra small icon token, for the affordance of a control', () => {
  const { container } = render(<Icon name="chevron-down" size="xs" />)
  expect(container.querySelector('svg')?.getAttribute('class')).toContain('size-(--nt-icon-xs)')
})

test('never shrinks below its glyph in a crowded flex row', () => {
  const { container } = render(<Icon name="chevron-right" size="sm" />)
  expect(container.querySelector('svg')?.getAttribute('class')?.split(' ')).toContain('shrink-0')
})

test('the stroke width is 1.75', () => {
  const { container } = render(<Icon name="check" />)
  expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '1.75')
})

test('without a tone the glyph carries no colour of its own and inherits one', () => {
  const { container } = render(<Icon name="check" />)
  expect(container.querySelector('svg')?.getAttribute('class')).not.toContain('text-')
})

test('tone="danger" colours the glyph itself, so it wins over what it sits in', () => {
  // On the glyph rather than on its surroundings: an icon button paints itself `text-muted`, and
  // an inherited colour would lose to that. Exactly one colour class is ever emitted, because the
  // tone is the only thing here that emits one at all.
  const { container } = render(<Icon name="alert-triangle" tone="danger" />)
  const className = container.querySelector('svg')?.getAttribute('class') ?? ''
  expect(className).toContain('text-danger')
  expect(className.match(/text-\S+/g)).toHaveLength(1)
})

test('every icon from the registry renders an svg path of its own', () => {
  const check = render(<Icon name="check" />)
  const search = render(<Icon name="search" />)
  expect(check.container.querySelector('svg path')?.getAttribute('d')).not.toBe(
    search.container.querySelector('svg path')?.getAttribute('d'),
  )
})

// Straight from the registry, so a new icon is covered the moment it is added and a removed one
// cannot leave a stale name behind. A hand-copied list here had already lost `message-circle`.
test.each(iconNames)('%s exists in the registry', (name) => {
  const { container } = render(<Icon name={name} />)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test('the archive and the row menu have glyphs of their own', () => {
  // `test.each(iconNames)` above covers a new name the moment it lands in the registry, so it can
  // never fail on a missing one of these — this test names the four the row menu and the archive
  // need and checks each draws a shape distinct from the others.
  const names = ['more-horizontal', 'archive', 'archive-restore', 'trash-2'] as const
  const paths = names.map((name) =>
    render(<Icon name={name} />)
      .container.querySelector('svg path')
      ?.getAttribute('d'),
  )
  expect(new Set(paths).size).toBe(names.length)
})

test('the panel and the sidebar have glyphs of their own', () => {
  // Same pattern as the archive test above, for the four glyphs the panel and sidebar add: "Browser" (globe),
  // "Terminal", the new diff view of a file, and the collapsed left sidebar.
  const names = ['globe', 'terminal', 'file-diff', 'panel-left'] as const
  const paths = names.map((name) =>
    render(<Icon name={name} />)
      .container.querySelector('svg path')
      ?.getAttribute('d'),
  )
  expect(new Set(paths).size).toBe(names.length)
})

test('the changes toolbar has its seven glyphs', () => {
  // Same pattern as the two tests above, for the seven glyphs the toolbar of the changes tab needs:
  // the layout choice, wrapping, ignoring whitespace, the file tree, and
  // expand/collapse-all.
  const names = [
    'rows',
    'columns',
    'wrap-text',
    'pilcrow',
    'folder-tree',
    'chevrons-expand',
    'chevrons-collapse',
  ] as const
  const paths = names.map((name) =>
    render(<Icon name={name} />)
      .container.querySelector('svg path')
      ?.getAttribute('d'),
  )
  expect(new Set(paths).size).toBe(names.length)
})

test('the branch icon is in the registry', () => {
  // The line under the composer names the branch of a chat that runs in its own worktree;
  // without this entry the name is a type error and the render stays empty.
  const { container } = render(<Icon name="git-branch" />)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test.each([
  'square-pen',
  'folder-git-2',
  'messages-square',
  'pin',
  'chevrons-up-down',
  'shield',
  'settings',
  'file-diff',
  'git-branch',
  'square-arrow-out-up-right',
  'bot',
  'corner-down-left',
  'loader-circle',
])('the name %s that the design asks for is in the registry', (name) => {
  // Written out rather than read from `iconNames`, so a name the design
  // needs cannot drop out of the registry unnoticed.
  expect(iconNames).toContain(name)
  const { container } = render(<Icon name={name as (typeof iconNames)[number]} />)
  expect(container.querySelector('svg')?.getAttribute('class')).toContain(`lucide-${name}`)
})

test('every glyph in the registry is an export of lucide-react', () => {
  const exports = new Set<unknown>(Object.values(lucide))
  for (const name of iconNames) expect(exports.has(iconGlyph(name)), name).toBe(true)
})

test('the three sizes are the 12, 14 and 16px tokens, with a stroke of 1.75 at each', () => {
  for (const [size, token] of [
    ['xs', '--nt-icon-xs'],
    ['sm', '--nt-icon-sm'],
    ['md', '--nt-icon-md'],
  ] as const) {
    const { container } = render(<Icon name="pin" size={size} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('class')).toContain(`size-(${token})`)
    expect(svg).toHaveAttribute('stroke-width', '1.75')
  }
})

test('iconSymbol writes a glyph of the registry as a sprite symbol, for a library that takes one', () => {
  // `PierreTree` hands the tree's chevron to `@pierre/trees` as a `<symbol>`: the same Lucide
  // path at the same stroke, so the tree's affordance is the app's own chevron.
  const symbol = iconSymbol('chevron-down', 'nt-icon-chevron')
  expect(symbol).toMatch(/^<symbol id="nt-icon-chevron" viewBox="0 0 24 24"/)
  expect(symbol).toContain('stroke-width="1.75"')
  expect(symbol).toContain('d="m6 9 6 6 6-6"')
  expect(symbol).not.toContain('key=')
  expect(symbol.endsWith('</symbol>')).toBe(true)
})
