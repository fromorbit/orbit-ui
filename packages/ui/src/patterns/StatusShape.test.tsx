import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { TooltipProvider } from '../overlays/Tooltip'
import { StatusShape } from './StatusShape'
import type { RunStatusKind } from './status-kind'

/** The shape is decorative, so it has no role to query: read it straight from the container. */
function shapeOf(container: HTMLElement): HTMLElement {
  const shape = container.querySelector<HTMLElement>('[data-nt-status-shape]')
  if (!shape) throw new Error('no status shape rendered')
  return shape
}

const all: RunStatusKind[] = [
  'queued',
  'running',
  'attention',
  'done',
  'interrupted',
  'closed',
  'failed',
]

test.each(all)('kind %s keeps the same 14px slot, so titles line up', (kind) => {
  const { container } = render(<StatusShape kind={kind} />)
  expect(shapeOf(container).getAttribute('class')).toContain('size-3.5')
  expect(shapeOf(container)).toHaveAttribute('aria-hidden', 'true')
})

test('each state draws its own shape, never colour alone', () => {
  const shapes = new Map<RunStatusKind, string>()
  for (const kind of ['running', 'attention', 'failed', 'queued', 'done'] as const) {
    const shape = shapeOf(render(<StatusShape kind={kind} />).container)
    expect(shape, kind).toHaveAttribute('data-kind', kind)
    shapes.set(kind, shape.getAttribute('data-shape') ?? '')
  }
  // More sides, further along: a circle moves, a triangle warns, a square stops.
  expect(Object.fromEntries(shapes)).toEqual({
    running: 'circle',
    attention: 'triangle',
    failed: 'square',
    queued: 'pentagon',
    done: 'hexagon',
  })
  // Interrupted shares the square of failed, but as an outline: the fill is what sets them apart,
  // not the colour alone.
  const interrupted = shapeOf(render(<StatusShape kind="interrupted" />).container)
  expect(interrupted).toHaveAttribute('data-shape', 'square')
  expect(interrupted.querySelector('[fill="currentColor"]')).toBeNull()
  const failed = shapeOf(render(<StatusShape kind="failed" />).container)
  expect(failed.querySelector('[fill="currentColor"]')).not.toBeNull()
})

test('every state that means something carries its own colour; the rest stays neutral', () => {
  // Busy in the accent, waiting in attention, finished in success, failed in danger; only what
  // is neither under way nor settled (queued, interrupted) stays muted.
  const tones: Record<RunStatusKind, string> = {
    running: 'text-accent-text',
    attention: 'text-attention',
    failed: 'text-danger',
    queued: 'text-muted',
    interrupted: 'text-muted',
    done: 'text-success',
    closed: 'text-success',
  }
  for (const kind of all) {
    const shape = shapeOf(render(<StatusShape kind={kind} />).container)
    expect(shape.getAttribute('class'), kind).toContain(tones[kind])
  }
  // Only what asks for attention is filled; the rest is a thin outline, so the column stays quiet.
  for (const kind of ['queued', 'interrupted', 'done', 'closed', 'running'] as const) {
    const shape = shapeOf(render(<StatusShape kind={kind} />).container)
    expect(shape.querySelector('[fill="currentColor"]'), kind).toBeNull()
  }
})

test('a finished chat is a hexagon at full strength, not faded', () => {
  const shape = shapeOf(render(<StatusShape kind="done" />).container)
  expect(shape.getAttribute('class')).not.toContain('opacity-')
})

test('a closed chat shows the outline of how it ended, in the colour of that ending', () => {
  // After a restart every chat that was not final comes back closed; "closed" says how it stands,
  // the outcome says how its work went. Never filled: a closed chat asks nothing.
  const tones = { done: 'text-success', failed: 'text-danger', interrupted: 'text-muted' } as const
  const shapes = { done: 'hexagon', failed: 'square', interrupted: 'square' } as const
  for (const closedAs of ['done', 'failed', 'interrupted'] as const) {
    const shape = shapeOf(render(<StatusShape kind="closed" closedAs={closedAs} />).container)
    expect(shape, closedAs).toHaveAttribute('data-kind', 'closed')
    expect(shape, closedAs).toHaveAttribute('data-shape', shapes[closedAs])
    expect(shape.getAttribute('class'), closedAs).toContain(tones[closedAs])
    expect(shape.querySelector('[fill="currentColor"]'), closedAs).toBeNull()
  }
})

test('a muted shape keeps its form but drops its colour and fill', () => {
  // An archived chat: what it ended on still reads, but nothing in the archive asks for anything.
  for (const kind of ['failed', 'attention', 'done', 'running'] as const) {
    const shape = shapeOf(render(<StatusShape kind={kind} muted />).container)
    expect(shape, kind).toHaveAttribute('data-muted', 'true')
    expect(shape.getAttribute('class'), kind).toContain('text-muted')
    expect(shape.querySelector('[fill="currentColor"]'), kind).toBeNull()
  }
  expect(shapeOf(render(<StatusShape kind="failed" muted />).container)).toHaveAttribute(
    'data-shape',
    'square',
  )
})

test('a closed chat whose ending nobody knows reads as finished', () => {
  // A chat written down before core kept its outcome: most of those were finished, and an empty
  // slot would make a whole column say nothing.
  const shape = shapeOf(render(<StatusShape kind="closed" />).container)
  expect(shape).toHaveAttribute('data-shape', 'hexagon')
})

test('a finished chat carries a small check inside its hexagon, closed or not', () => {
  const finished = [
    render(<StatusShape kind="done" />).container,
    render(<StatusShape kind="closed" />).container,
    render(<StatusShape kind="closed" closedAs="done" />).container,
    render(<StatusShape kind="done" pending />).container,
  ]
  for (const container of finished) {
    const shape = shapeOf(container)
    expect(shape).toHaveAttribute('data-shape', 'hexagon')
    const check = shape.querySelector('[data-nt-status-check]')
    // In the colour of the hexagon (it paints in `currentColor`), and never dotted: only the
    // outline says a message stands ready.
    expect(check).not.toBeNull()
    expect(check).toHaveAttribute('stroke', 'currentColor')
    expect(check).not.toHaveAttribute('stroke-dasharray')
  }
  for (const kind of ['running', 'attention', 'failed', 'interrupted', 'queued'] as const) {
    const shape = shapeOf(render(<StatusShape kind={kind} />).container)
    expect(shape.querySelector('[data-nt-status-check]'), kind).toBeNull()
  }
  const closedFailed = shapeOf(render(<StatusShape kind="closed" closedAs="failed" />).container)
  expect(closedFailed.querySelector('[data-nt-status-check]')).toBeNull()
})

test('a chat that never started draws nothing', () => {
  const shape = shapeOf(render(<StatusShape kind={null} />).container)
  expect(shape).toHaveAttribute('data-kind', 'none')
  expect(shape).toBeEmptyDOMElement()
})

test('a chat with a prepared message gets a dotted outline', () => {
  for (const kind of ['running', 'attention', 'failed', 'queued', 'done'] as const) {
    const plain = shapeOf(render(<StatusShape kind={kind} />).container)
    expect(plain, kind).not.toHaveAttribute('data-pending')
    const pending = shapeOf(render(<StatusShape kind={kind} pending />).container)
    expect(pending, kind).toHaveAttribute('data-pending', 'true')
    // The same shape, drawn as dots: nothing filled, so the dots are what the eye sees.
    expect(pending.getAttribute('data-shape'), kind).toBe(plain.getAttribute('data-shape'))
    expect(pending.querySelector('[fill="currentColor"]'), kind).toBeNull()
    expect(pending.querySelector('[stroke-dasharray]'), kind).not.toBeNull()
  }
})

test('the busy circle turns, and stands still under reduced motion', () => {
  const { container } = render(<StatusShape kind="running" />)
  expect(shapeOf(container).querySelector('.nt-shape-spin')).not.toBeNull()
  const css = readFileSync(join(import.meta.dirname, '..', 'theme.css'), 'utf8')
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
  expect(reduced).toMatch(/\.nt-shape-spin\s*\{\s*animation: none;/)
})

test('waiting for you is an amber outline of 1.4px, not a fill: only failed is filled', () => {
  // Amber is loud enough, and a filled triangle in a column of quiet
  // lines shouted.
  const attention = shapeOf(render(<StatusShape kind="attention" />).container)
  expect(attention.getAttribute('class')).toContain('text-attention')
  const triangle = attention.querySelector('path')
  expect(triangle).toHaveAttribute('fill', 'none')
  expect(triangle).toHaveAttribute('stroke', 'currentColor')
  expect(triangle).toHaveAttribute('stroke-width', '1.4')
  for (const kind of all) {
    const shape = shapeOf(render(<StatusShape kind={kind} />).container)
    const filled = shape.querySelector('[fill="currentColor"]') !== null
    expect(filled, kind).toBe(kind === 'failed')
  }
})

test('with a label the shape is named by its status word and shows it as a tooltip', async () => {
  render(
    <TooltipProvider delayDuration={0}>
      <StatusShape kind="attention" label="Wacht op jou" />
    </TooltipProvider>,
  )
  const shape = screen.getByRole('img', { name: 'Wacht op jou' })
  expect(shape).not.toHaveAttribute('aria-hidden')
  fireEvent.pointerMove(shape, { pointerType: 'mouse' })
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Wacht op jou')
})

test('without a label the shape stays decorative, for a row that says its status in words', () => {
  const { container } = render(<StatusShape kind="attention" />)
  expect(shapeOf(container)).toHaveAttribute('aria-hidden', 'true')
  expect(screen.queryByRole('img')).toBeNull()
})
