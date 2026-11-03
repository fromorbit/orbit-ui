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

  test.each(kinds)('%s takes its body and its highlight from its own tokens', (kind) => {
    const declarations = rule(`.nt-status-mark[data-kind="${kind}"]`)
    expect(declarations).toContain(`--c: var(--nt-status-${tokenOf[kind]});`)
    expect(declarations).toContain(`--hi: var(--nt-status-${tokenOf[kind]}-hi);`)
  })

  test('the sweet: a highlight at 32% 28% over a body that darkens to its edge, and a glow', () => {
    const body = rule('.nt-status-mark-body')
    expect(body).toMatch(/radial-gradient\(\s*circle at 32% 28%/)
    expect(body).toMatch(/radial-gradient\(circle at 50% 60%/)
    // The darker inset edge below and the lighter one above.
    expect(body).toMatch(/inset 0 -1\.5px 2px/)
    expect(body).toMatch(/inset 0 1px 1px/)
    // The glow and the gloss at the strength of the theme.
    expect(body).toContain('calc(8px * var(--nt-status-glow))')
    expect(body).toContain('calc(var(--nt-status-gloss) * 100%)')
    // The plain colour under the gradients, which a contrast check reads.
    expect(body).toContain('background-color: var(--c);')
  })

  test('the triangle is clipped, so its glow is a drop-shadow on the slot', () => {
    expect(rule('.nt-status-mark[data-kind="fault"] .nt-status-mark-body')).toContain(
      'clip-path: path(',
    )
    expect(rule('.nt-status-mark[data-kind="fault"]')).toMatch(
      /filter: drop-shadow\(\s*0 0 calc\(5px \* var\(--nt-status-glow\)\)/,
    )
  })

  test('the diamond is a turned square, so the spring scale composes with its turn', () => {
    expect(rule('.nt-status-mark[data-kind="blocked"] .nt-status-mark-body')).toContain(
      'rotate: 45deg;',
    )
  })

  test('the spring under the pointer moves only for those who did not ask for less motion', () => {
    const start = themeCss.indexOf('@media (prefers-reduced-motion: no-preference)')
    expect(start).toBeGreaterThan(-1)
    const hover = themeCss.indexOf('scale: 1.18;')
    expect(hover).toBeGreaterThan(start)
    // Only once, and only inside that block: no spring without it.
    expect(themeCss.split('scale: 1.18;')).toHaveLength(2)
    const block = themeCss.slice(start, hover)
    expect(block).toMatch(/:not\(:disabled, \[aria-disabled="true"\]\):hover/)
    expect(block).toContain('button')
  })
})
