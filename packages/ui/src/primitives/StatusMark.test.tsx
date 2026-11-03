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

/** The clip path of the fault triangle, on the 14px box of the mark. */
const TRIANGLE =
  'M 5.6 0.97 Q 7 -0.97 8.4 0.97 L 13.4 11.83 Q 14.2 14 12.2 14 L 1.8 14 Q -0.2 14 0.6 11.83 Z'

/**
 * The top and bottom of the ink of a path made of `M`, `L`, `Q` and `Z` with absolute points: the
 * end points, and for each quadratic curve the point where it turns, if it turns between them.
 */
function verticalInk(path: string): [number, number] {
  const parts = path.trim().split(/\s+/)
  const ys: number[] = []
  let current = 0
  for (let index = 0; index < parts.length; ) {
    const command = parts[index++]
    const read = () => Number(parts[index++])
    if (command === 'M' || command === 'L') {
      read()
      current = read()
      ys.push(current)
    } else if (command === 'Q') {
      read()
      const control = read()
      read()
      const end = read()
      const bend = current - 2 * control + end
      const t = bend === 0 ? -1 : (current - control) / bend
      if (t > 0 && t < 1) ys.push((1 - t) ** 2 * current + 2 * (1 - t) * t * control + t ** 2 * end)
      ys.push(end)
      current = end
    }
  }
  return [Math.min(...ys), Math.max(...ys)]
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

  test('the triangle is clipped, so its glow is a drop-shadow on the slot', () => {
    expect(rule('.nt-status-mark[data-kind="fault"] .nt-status-mark-body')).toContain(
      `"${TRIANGLE}"`,
    )
    expect(rule('.nt-status-mark[data-kind="fault"]')).toMatch(
      /filter: drop-shadow\(\s*0 0 calc\(4px \* var\(--nt-status-glow\)\) color-mix\(in srgb, var\(--c\) 60%, transparent\)/,
    )
  })

  test("the triangle's ink is as high as the circle's, within half a pixel", () => {
    // The circle fills the 14px body; a triangle that stops short of it looked small and high.
    expect(rule('.nt-status-mark-body')).toContain('block-size: 14px;')
    const [top, bottom] = verticalInk(TRIANGLE)
    expect(Math.abs(bottom - top - 14)).toBeLessThanOrEqual(0.5)
    expect(Math.abs((top + bottom) / 2 - 7)).toBeLessThanOrEqual(0.5)
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
