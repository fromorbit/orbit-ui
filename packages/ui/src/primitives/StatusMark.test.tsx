import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { StatusMark, type StatusMarkKind } from './StatusMark'

/** The mark is decorative by default, so it has no role to query: read it from the container. */
function markOf(container: HTMLElement): HTMLElement {
  const mark = container.querySelector<HTMLElement>('[data-nt-status-mark]')
  if (!mark) throw new Error('no status mark rendered')
  return mark
}

const kinds: StatusMarkKind[] = ['running', 'fault', 'blocked', 'stopped']

// Read from disk: happy-dom applies no stylesheet, so the drawing is checked in the CSS itself.
const themeCss = readFileSync(join(import.meta.dirname, '..', 'theme.css'), 'utf8')

/** The declarations of the first rule with exactly this selector. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return themeCss.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

test('each state draws its own shape, never colour alone', () => {
  const shapes = Object.fromEntries(
    kinds.map((kind) => [
      kind,
      markOf(render(<StatusMark kind={kind} />).container).getAttribute('data-shape'),
    ]),
  )
  expect(shapes).toEqual({
    running: 'circle',
    fault: 'triangle',
    blocked: 'diamond',
    stopped: 'square',
  })
})

test.each(kinds)('%s sits in the same slot, the sweet inside it', (kind) => {
  const mark = markOf(render(<StatusMark kind={kind} />).container)
  expect(mark).toHaveAttribute('data-kind', kind)
  expect(mark).toHaveClass('nt-status-mark')
  expect(mark.querySelector('.nt-status-mark-body')).not.toBeNull()
})

test('without a label the mark stays decorative, for a row that says its status in words', () => {
  const mark = markOf(render(<StatusMark kind="fault" />).container)
  expect(mark).toHaveAttribute('aria-hidden', 'true')
  expect(mark).not.toHaveAttribute('role')
  expect(screen.queryByRole('img')).toBeNull()
})

test('with a label the mark is named by its status word', () => {
  render(<StatusMark kind="blocked" label="Geblokkeerd" />)
  const mark = screen.getByRole('img', { name: 'Geblokkeerd' })
  expect(mark).not.toHaveAttribute('aria-hidden')
})

describe('the drawing in theme.css', () => {
  const tokenOf = { running: 'run', fault: 'fail', blocked: 'block', stopped: 'stop' } as const

  test.each(kinds)('%s takes its colour from its own token', (kind) => {
    expect(rule(`.nt-status-mark[data-kind="${kind}"]`)).toContain(
      `--c: var(--nt-status-${tokenOf[kind]});`,
    )
  })

  test('a flat shape in its colour with a soft glow of it: no gloss, no inset edges', () => {
    const body = rule('.nt-status-mark-body')
    expect(body).toContain('background: var(--c);')
    expect(body).toMatch(
      /box-shadow: 0 0 calc\(6px \* var\(--nt-status-glow\)\) calc\(1px \* var\(--nt-status-glow\)\)\s+color-mix\(in srgb, var\(--c\) 55%, transparent\);/,
    )
    expect(themeCss).not.toMatch(/nt-status-mark[^{]*\{[^}]*(gradient|inset)/)
  })

  test('the triangle is clipped higher in its box, so its glow is a drop-shadow on the slot', () => {
    expect(rule('.nt-status-mark[data-kind="fault"] .nt-status-mark-body')).toContain(
      '"M 5.7 3.1 Q 7 1.1 8.3 3.1 L 12.5 9.8 Q 13.5 11.5 11.5 11.5 L 2.5 11.5 Q 0.5 11.5 1.5 9.8 Z"',
    )
    expect(rule('.nt-status-mark[data-kind="fault"]')).toMatch(
      /filter: drop-shadow\(\s*0 0 calc\(4px \* var\(--nt-status-glow\)\) color-mix\(in srgb, var\(--c\) 60%, transparent\)/,
    )
  })

  test('the diamond is a turned square, so its glow is not clipped', () => {
    expect(rule('.nt-status-mark[data-kind="blocked"] .nt-status-mark-body')).toContain(
      'rotate: 45deg;',
    )
  })

  test('the mark stands still under the pointer: no spring, no transition', () => {
    const own = themeCss.slice(
      themeCss.indexOf('/* The mark of something that runs'),
      themeCss.indexOf('@keyframes nt-pulse'),
    )
    expect(own).not.toMatch(/scale|transition|:hover/)
  })
})
